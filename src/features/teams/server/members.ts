import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { sendTeamMemberAddedEmail } from "@/server/email/service";
import { getAppUrl } from "@/server/email/transporter";
import { checkUserLimit } from "@/lib/limits";
import { randomUUID } from "crypto";
import {
  assertRole,
  executeApprovedAction,
  notifyAdmins,
  ACTIONS_REQUIRING_APPROVAL,
} from "./helpers";

export const teamMembersRouter = createTRPCRouter({
  inviteMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        email: z.string().email().max(255),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN"]);

      const owner = await ctx.db.teamMember.findFirst({
        where: { teamId: input.teamId, role: "OWNER" },
      });
      if (owner) {
        await checkUserLimit(ctx.db, owner.userId, "seatsLimit");
      }

      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user found with that email. They must sign up first.",
        });
      }

      const existing = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: input.teamId, userId: user.id },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this team",
        });
      }

      const existingInvite = await ctx.db.verification.findFirst({
        where: {
          identifier: `team-invite:${input.teamId}:${user.id}`,
          expiresAt: { gt: new Date() },
        },
      });
      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A pending invite already exists for this user",
        });
      }

      const token = randomUUID();
      await ctx.db.verification.create({
        data: {
          id: token,
          identifier: `team-invite:${input.teamId}:${user.id}`,
          value: JSON.stringify({
            teamId: input.teamId,
            inviterId: ctx.user.id,
            role: input.role,
          }),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        select: { name: true, slug: true },
      });

      const appUrl = getAppUrl();
      const acceptUrl = `${appUrl}/teams/accept-invite?token=${token}`;

      await ctx.db.notification.create({
        data: {
          userId: user.id,
          type: "TEAM_INVITE",
          title: `You've been invited to "${team?.name ?? "a team"}"`,
          message: `${ctx.user.name ?? "A team admin"} has invited you as a ${input.role.toLowerCase()}. Accept or decline via the link below.`,
          link: `/teams/accept-invite?token=${token}`,
        },
      });

      const inviter = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true, email: true },
      });
      if (user.email && team) {
        await sendTeamMemberAddedEmail({
          to: user.email,
          inviteeName: user.name || "Team Member",
          inviteeEmail: user.email,
          inviterName: inviter?.name || "Team Admin",
          inviterEmail: inviter?.email || "",
          teamName: team.name,
          teamId: input.teamId,
          teamSlug: team.slug,
          role: input.role,
          teamUrl: acceptUrl,
          needsGithubConnection: false,
        }).catch((err) =>
          console.error("Failed to send team invite email:", err),
        );
      }

      return { invited: true };
    }),

  acceptTeamInvite: protectedProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.db.verification.findUnique({
        where: { id: input.token },
      });

      if (
        !verification ||
        !verification.identifier.startsWith("team-invite:")
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found or already used",
        });
      }

      if (verification.expiresAt < new Date()) {
        await ctx.db.verification.delete({ where: { id: input.token } });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invite has expired",
        });
      }

      const expectedIdentifier = `team-invite:${verification.identifier.split(":")[1]}:${ctx.user.id}`;
      if (verification.identifier !== expectedIdentifier) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite was not sent to your account",
        });
      }

      const meta = JSON.parse(verification.value) as {
        teamId: string;
        inviterId: string;
        role: string;
      };

      const validRoles = ["ADMIN", "MEMBER"] as const;
      const role: "ADMIN" | "MEMBER" = validRoles.includes(
        meta.role as "ADMIN" | "MEMBER",
      )
        ? (meta.role as "ADMIN" | "MEMBER")
        : "MEMBER";

      const existing = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: meta.teamId, userId: ctx.user.id },
        },
      });
      if (existing) {
        await ctx.db.verification.delete({ where: { id: input.token } });
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of this team",
        });
      }

      await checkUserLimit(ctx.db, meta.inviterId, "seatsLimit");

      const [membership] = await ctx.db.$transaction([
        ctx.db.teamMember.create({
          data: { teamId: meta.teamId, userId: ctx.user.id, role },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        }),
        ctx.db.verification.delete({ where: { id: input.token } }),
      ]);

      const team = await ctx.db.team.findUnique({
        where: { id: meta.teamId },
        select: { name: true },
      });
      await ctx.db.notification.create({
        data: {
          userId: meta.inviterId,
          type: "TEAM_MEMBER_ADDED",
          title: `${ctx.user.name ?? "A user"} accepted your invite`,
          message: `They have joined "${team?.name ?? "your team"}" as a ${role.toLowerCase()}.`,
          link: `/teams/${meta.teamId}`,
        },
      });

      return membership;
    }),

  declineTeamInvite: protectedProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.db.verification.findUnique({
        where: { id: input.token },
      });

      if (
        !verification ||
        !verification.identifier.startsWith("team-invite:")
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found or already used",
        });
      }

      const expectedIdentifier = `team-invite:${verification.identifier.split(":")[1]}:${ctx.user.id}`;
      if (verification.identifier !== expectedIdentifier) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite was not sent to your account",
        });
      }

      await ctx.db.verification.delete({ where: { id: input.token } });
      return { declined: true };
    }),

  getPendingInvites: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN", "MEMBER"]);

      const records = await ctx.db.verification.findMany({
        where: {
          identifier: { startsWith: `team-invite:${input.teamId}:` },
          expiresAt: { gt: new Date() },
        },
        orderBy: { expiresAt: "asc" },
      });

      return Promise.all(
        records.map(async (record) => {
          const userId = record.identifier.split(":")[2] ?? "";
          const parsed = JSON.parse(record.value) as {
            teamId: string;
            inviterId: string;
            role: string;
          };
          const [invitee, inviter] = await Promise.all([
            ctx.db.user.findUnique({
              where: { id: userId },
              select: { id: true, name: true, email: true, image: true },
            }),
            ctx.db.user.findUnique({
              where: { id: parsed.inviterId },
              select: { id: true, name: true },
            }),
          ]);
          return {
            token: record.id,
            role: parsed.role,
            expiresAt: record.expiresAt,
            invitee,
            inviter,
          };
        }),
      );
    }),

  cancelInvite: protectedProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.db.verification.findUnique({
        where: { id: input.token },
      });
      if (!verification?.identifier.startsWith("team-invite:")) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }
      const teamId = verification.identifier.split(":")[1]!;
      await assertRole(ctx, teamId, ["OWNER", "ADMIN"]);
      await ctx.db.verification.delete({ where: { id: input.token } });
      return { cancelled: true };
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        userId: z.string().max(255),
        role: z.enum(["ADMIN", "MEMBER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER"]);

      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      return ctx.db.teamMember.update({
        where: {
          teamId_userId: { teamId: input.teamId, userId: input.userId },
        },
        data: { role: input.role },
      });
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        userId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId !== ctx.user.id) {
        await assertRole(ctx, input.teamId, ["OWNER", "ADMIN"]);
      }

      const target = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: input.teamId, userId: input.userId },
        },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }
      if (target.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove the team owner",
        });
      }

      await ctx.db.teamMember.delete({
        where: {
          teamId_userId: { teamId: input.teamId, userId: input.userId },
        },
      });
      return { removed: true };
    }),

  getPendingActions: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN", "MEMBER"]);

      return ctx.db.teamAction.findMany({
        where: {
          teamId: input.teamId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        include: {
          team: {
            select: { id: true, name: true },
          },
        },
      });
    }),

  getMyRequestedActions: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN", "MEMBER"]);

      return ctx.db.teamAction.findMany({
        where: {
          teamId: input.teamId,
          requestedBy: ctx.user.id,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  requestAction: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        actionType: z.enum([
          "INVITE_MEMBER",
          "REMOVE_MEMBER",
          "UPDATE_ROLE",
          "SHARE_REPOSITORY",
          "UNSHARE_REPOSITORY",
          "DELETE_TEAM",
          "REVIEW_PR",
          "APPROVE_DISCUSSION",
        ]),
        targetUserId: z.string().max(255).optional(),
        targetRepoId: z.string().max(255).optional(),
        metadata: z
          .object({
            email: z.string().email().max(255).optional(),
            role: z.string().max(50).optional(),
            prNumber: z.number().optional(),
            discussionId: z.string().max(255).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const membership = await assertRole(ctx, input.teamId, [
          "OWNER",
          "ADMIN",
          "MEMBER",
        ]);

        const requiresApproval =
          membership.role === "MEMBER" &&
          (ACTIONS_REQUIRING_APPROVAL as readonly string[]).includes(
            input.actionType,
          );

        const action = await ctx.db.teamAction.create({
          data: {
            teamId: input.teamId,
            actionType: input.actionType as NonNullable<
              Parameters<typeof ctx.db.teamAction.create>[0]["data"]
            >["actionType"],
            status: requiresApproval ? "PENDING" : "APPROVED",
            requestedBy: ctx.user.id,
            targetUserId: input.targetUserId,
            targetRepoId: input.targetRepoId,
            metadata: input.metadata ?? undefined,
            resolvedAt: requiresApproval ? null : new Date(),
            resolvedBy: requiresApproval ? null : ctx.user.id,
          },
        });

        if (!requiresApproval) {
          await executeApprovedAction(ctx, action);
        } else {
          await notifyAdmins(ctx, input.teamId, action);
        }

        return {
          ...action,
          requiresApproval,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error in requestAction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process action request. Please try again.",
        });
      }
    }),

  approveAction: protectedProcedure
    .input(
      z.object({
        actionId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const action = await ctx.db.teamAction.findUnique({
        where: { id: input.actionId },
      });

      if (!action) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Action not found",
        });
      }

      await assertRole(ctx, action.teamId, ["OWNER", "ADMIN"]);

      if (action.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Action is not pending",
        });
      }

      const updatedAction = await ctx.db.teamAction.update({
        where: { id: input.actionId },
        data: {
          status: "APPROVED",
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
        },
      });

      await executeApprovedAction(ctx, updatedAction);

      return updatedAction;
    }),

  rejectAction: protectedProcedure
    .input(
      z.object({
        actionId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const action = await ctx.db.teamAction.findUnique({
        where: { id: input.actionId },
      });

      if (!action) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Action not found",
        });
      }

      await assertRole(ctx, action.teamId, ["OWNER", "ADMIN"]);

      if (action.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Action is not pending",
        });
      }

      const updatedAction = await ctx.db.teamAction.update({
        where: { id: input.actionId },
        data: {
          status: "REJECTED",
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
        },
      });

      const team = await ctx.db.team.findUnique({
        where: { id: action.teamId },
        select: { name: true },
      });

      await ctx.db.notification.create({
        data: {
          userId: action.requestedBy,
          type: "TEAM_MEMBER_ADDED",
          title: `Action rejected in "${team?.name ?? "team"}"`,
          message: `Your request to ${action.actionType.toLowerCase().replace("_", " ")} was rejected by an administrator.`,
          link: `/teams/${action.teamId}`,
        },
      });

      return updatedAction;
    }),
});
