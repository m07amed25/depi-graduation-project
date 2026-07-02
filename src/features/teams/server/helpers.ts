import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@/server/db/client";
import {
  getGitHubAccessToken,
  fetchPullRequestByFullName,
} from "@/server/services/github";
import { inngest } from "@/server/inngest";

// Action types that require approval when requested by MEMBER role
export const ACTIONS_REQUIRING_APPROVAL = [
  "INVITE_MEMBER",
  "REMOVE_MEMBER",
  "UPDATE_ROLE",
  "SHARE_REPOSITORY",
  "UNSHARE_REPOSITORY",
  "DELETE_TEAM",
] as const;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function assertRole(
  ctx: { db: PrismaClient; user: { id: string } },
  teamId: string,
  roles: string[],
) {
  const membership = await ctx.db.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: ctx.user.id },
    },
  });
  if (!membership || !roles.includes(membership.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });
  }
  return membership;
}

export async function executeApprovedAction(
  ctx: { db: PrismaClient; user: { id: string } },
  action: {
    id: string;
    actionType: string;
    teamId: string;
    targetUserId: string | null;
    targetRepoId: string | null;
    metadata: unknown;
    requestedBy: string;
  },
) {
  switch (action.actionType) {
    case "INVITE_MEMBER": {
      const meta = action.metadata as { email?: string; role?: string } | null;
      if (!meta?.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "INVITE_MEMBER action requires an email address in metadata",
        });
      }
      const user = await ctx.db.user.findUnique({
        where: { email: meta.email },
      });
      if (user) {
        await ctx.db.teamMember.upsert({
          where: {
            teamId_userId: { teamId: action.teamId, userId: user.id },
          },
          create: {
            teamId: action.teamId,
            userId: user.id,
            role: (meta.role as "ADMIN" | "MEMBER") || "MEMBER",
          },
          update: {
            role: (meta.role as "ADMIN" | "MEMBER") || "MEMBER",
          },
        });

        const team = await ctx.db.team.findUnique({
          where: { id: action.teamId },
          select: { name: true },
        });

        await ctx.db.notification.create({
          data: {
            userId: user.id,
            type: "TEAM_INVITE",
            title: `You've been added to "${team?.name ?? "a team"}"`,
            message: `You have been added to the team as a ${meta.role?.toLowerCase() ?? "member"}.`,
            link: `/teams/${action.teamId}`,
          },
        });
      }
      break;
    }

    case "REMOVE_MEMBER":
      if (action.targetUserId) {
        await ctx.db.teamMember.delete({
          where: {
            teamId_userId: {
              teamId: action.teamId,
              userId: action.targetUserId,
            },
          },
        });
      }
      break;

    case "UPDATE_ROLE":
      if (action.targetUserId) {
        const meta = action.metadata as { role?: string } | null;
        const validRoles = z.enum(["ADMIN", "MEMBER"]);
        const parsedRole = validRoles.safeParse(meta?.role);
        if (!parsedRole.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              'Invalid role value in UPDATE_ROLE action metadata. Expected "ADMIN" or "MEMBER".',
          });
        }
        await ctx.db.teamMember.update({
          where: {
            teamId_userId: {
              teamId: action.teamId,
              userId: action.targetUserId,
            },
          },
          data: { role: parsedRole.data },
        });
      }
      break;

    case "SHARE_REPOSITORY":
      if (action.targetRepoId) {
        const repo = await ctx.db.repository.findUnique({
          where: { id: action.targetRepoId },
          select: { userId: true },
        });
        if (!repo || repo.userId !== action.requestedBy) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Repository does not belong to the requesting user.",
          });
        }
        await ctx.db.repository.update({
          where: { id: action.targetRepoId },
          data: { teamId: action.teamId },
        });
      }
      break;

    case "UNSHARE_REPOSITORY":
      if (action.targetRepoId) {
        const repo = await ctx.db.repository.findUnique({
          where: { id: action.targetRepoId },
          select: { userId: true },
        });
        if (!repo || repo.userId !== action.requestedBy) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Repository does not belong to the requesting user.",
          });
        }
        await ctx.db.repository.update({
          where: { id: action.targetRepoId },
          data: { teamId: null },
        });
      }
      break;

    case "DELETE_TEAM":
      await ctx.db.repository.updateMany({
        where: { teamId: action.teamId },
        data: { teamId: null },
      });
      await ctx.db.team.delete({ where: { id: action.teamId } });
      break;

    case "REVIEW_PR": {
      const meta = action.metadata as { prNumber?: number } | null;
      if (!meta?.prNumber || !action.targetRepoId) break;

      const repository = await ctx.db.repository.findUnique({
        where: { id: action.targetRepoId },
        select: { userId: true, fullName: true },
      });
      if (!repository) break;

      let prTitle = `PR #${meta.prNumber}`;
      let prUrl = "";
      const accessToken = await getGitHubAccessToken(repository.userId);
      if (accessToken) {
        try {
          const pr = await fetchPullRequestByFullName(
            accessToken,
            repository.fullName,
            meta.prNumber,
          );
          prTitle = pr.title;
          prUrl = pr.html_url;
        } catch {
          // Non-fatal: proceed with placeholder values
        }
      }

      const review = await ctx.db.review.create({
        data: {
          repositoryId: action.targetRepoId,
          userId: action.requestedBy,
          prNumber: meta.prNumber,
          prTitle,
          prUrl,
          status: "PENDING",
        },
      });

      await inngest.send({
        name: "review/pr.requested",
        data: {
          reviewId: review.id,
          repositoryId: action.targetRepoId,
          prNumber: meta.prNumber,
          userId: repository.userId,
        },
      });
      break;
    }

    case "APPROVE_DISCUSSION": {
      const meta = action.metadata as { discussionId?: string } | null;
      if (meta?.discussionId) {
        await ctx.db.reviewThread.update({
          where: { id: meta.discussionId },
          data: { resolved: true },
        });
      }
      break;
    }
  }
}

export async function notifyAdmins(
  ctx: { db: PrismaClient; user: { id: string } },
  teamId: string,
  action: { id: string; actionType: string; requestedBy: string },
) {
  const team = await ctx.db.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });

  const admins = await ctx.db.teamMember.findMany({
    where: {
      teamId,
      role: { in: ["OWNER", "ADMIN"] },
    },
    select: { userId: true },
  });

  const requester = await ctx.db.user.findUnique({
    where: { id: action.requestedBy },
    select: { name: true },
  });

  const actionDescription = action.actionType.toLowerCase().replace("_", " ");

  for (const admin of admins) {
    if (admin.userId !== action.requestedBy) {
      await ctx.db.notification.create({
        data: {
          userId: admin.userId,
          type: "TEAM_MEMBER_ADDED",
          title: `Action requires approval in "${team?.name ?? "team"}"`,
          message: `${requester?.name ?? "A member"} has requested to ${actionDescription}. Please review and approve or reject.`,
          link: `/teams/${teamId}`,
        },
      });
    }
  }
}
