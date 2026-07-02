import { z } from "zod";
import { UserRole } from "../../../db/client";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import {
  sendAdminPromotedEmail,
  sendAdminDemotedEmail,
  sendPlanChangedEmail,
} from "../../../email/service";
import { auth } from "../../../auth";
import { logAudit } from "../../../services/audit";
import { checkRateLimit, getRateLimitRemaining } from "@/lib/rate-limiter";
import { getPusherServer } from "../../../pusher";
import { PUSHER_EVENTS } from "@/lib/constants";

const RESET_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export const adminUsersRouter = createTRPCRouter({
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().max(50).trim().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            role: true,
            banned: true,
            bannedReason: true,
            createdAt: true,
            planId: true,
            planExpiresAt: true,
            overrideReposLimit: true,
            overrideReviewsLimit: true,
            overrideSeatsLimit: true,
            accounts: {
              where: { providerId: "github" },
              select: { id: true },
            },
            _count: {
              select: {
                repositories: true,
                reviews: true,
                teamMembers: true,
              },
            },
          },
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        users: users.map((u) => ({
          ...u,
          isOwner: u.email === process.env.OWNER_MAIL,
          githubConnected: u.accounts.length > 0,
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  getAllUserIds: adminProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const where = input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: "insensitive" as const } },
              { email: { contains: input.search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const users = await ctx.db.user.findMany({
        where,
        select: { id: true },
      });

      return users.map((u) => u.id);
    }),

  getUser: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          repositories: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              fullName: true,
              private: true,
              createdAt: true,
              _count: { select: { reviews: true } },
            },
          },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              prTitle: true,
              status: true,
              riskScore: true,
              createdAt: true,
            },
          },
          teamMembers: {
            include: {
              team: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: {
            select: { repositories: true, reviews: true, sessions: true },
          },
        },
      });
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        role: z.nativeEnum(UserRole),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true, name: true },
      });

      if (!targetUser) {
        throw new Error("User not found.");
      }

      if (targetUser.email === process.env.OWNER_MAIL && ctx.user.email !== process.env.OWNER_MAIL) {
        throw new Error("The owner's role cannot be changed by others.");
      }

      if (input.userId === ctx.user.id && ctx.user.email !== process.env.OWNER_MAIL) {
        throw new Error("You cannot change your own role.");
      }

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      void logAudit({
        actorId: ctx.user.id,
        action: "USER_ROLE_UPDATED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { newRole: input.role },
      });

      if (input.role === "ADMIN") {
        void sendAdminPromotedEmail({
          to: targetUser.email,
          userName: targetUser.name || "User",
          promotedByName: ctx.user.name || "Administrator",
        });
      } else if (input.role === "USER") {
        void sendAdminDemotedEmail({
          to: targetUser.email,
          userName: targetUser.name || "User",
          demotedByName: ctx.user.name || "Administrator",
        });
      }

      return { success: true };
    }),

  updateUserPlan: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        planId: z.string(),
        expiresAt: z.date().nullable().optional(),
        overrideReposLimit: z.number().int().min(0).nullable().optional(),
        overrideReviewsLimit: z.number().int().min(0).nullable().optional(),
        overrideSeatsLimit: z.number().int().min(0).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true, name: true, planId: true },
      });

      if (!targetUser) {
        throw new Error("User not found.");
      }

      await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          planId: input.planId,
          planExpiresAt: input.expiresAt ?? null,
          overrideReposLimit: input.overrideReposLimit ?? null,
          overrideReviewsLimit: input.overrideReviewsLimit ?? null,
          overrideSeatsLimit: input.overrideSeatsLimit ?? null,
        },
      });

      void logAudit({
        actorId: ctx.user.id,
        action: "USER_PLAN_UPDATED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: {
          oldPlan: targetUser.planId,
          newPlan: input.planId,
          expiresAt: input.expiresAt,
          overrides: {
            repos: input.overrideReposLimit,
            reviews: input.overrideReviewsLimit,
            seats: input.overrideSeatsLimit,
          },
        },
      });

      if (targetUser.email) {
        await sendPlanChangedEmail({
          to: targetUser.email,
          userName: targetUser.name || targetUser.email,
          oldPlan: targetUser.planId,
          newPlan: input.planId,
          expiresAt: input.expiresAt ?? null,
          changedBy: ctx.user.name ?? ctx.user.email,
          overrides: {
            repos: input.overrideReposLimit,
            reviews: input.overrideReviewsLimit,
            seats: input.overrideSeatsLimit,
          },
        }).catch((err) => console.error("Failed to send plan update email:", err));
      }

      // Notify user in real-time so their UI refreshes
      const pusher = getPusherServer();
      if (pusher) {
        void pusher.trigger(`private-user-${input.userId}`, PUSHER_EVENTS.PLAN_UPDATED, { planId: input.planId });
      }

      return { success: true };
    }),

  updateUserLimits: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        reposLimitDelta: z.number().int().optional(),
        reviewsLimitDelta: z.number().int().optional(),
        seatsLimitDelta: z.number().int().optional(),
        reposLimitSet: z.number().int().min(0).nullable().optional(),
        reviewsLimitSet: z.number().int().min(0).nullable().optional(),
        seatsLimitSet: z.number().int().min(0).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          email: true,
          name: true,
          planId: true,
          overrideReposLimit: true,
          overrideReviewsLimit: true,
          overrideSeatsLimit: true,
        },
      });

      if (!targetUser) {
        throw new Error("User not found.");
      }

      let baseRepos = targetUser.overrideReposLimit;
      let baseReviews = targetUser.overrideReviewsLimit;
      let baseSeats = targetUser.overrideSeatsLimit;

      if (baseRepos === null || baseReviews === null || baseSeats === null) {
        const plan = await ctx.db.pricingPlan.findUnique({ where: { id: targetUser.planId } });
        if (baseRepos === null) baseRepos = plan?.reposLimit ?? 3;
        if (baseReviews === null) baseReviews = plan?.reviewsLimit ?? 50;
        if (baseSeats === null) baseSeats = plan?.seatsLimit ?? 1;
      }

      const newReposLimit = input.reposLimitSet !== undefined
        ? input.reposLimitSet
        : input.reposLimitDelta !== undefined
          ? Math.max(0, (baseRepos ?? 0) + input.reposLimitDelta)
          : targetUser.overrideReposLimit;

      const newReviewsLimit = input.reviewsLimitSet !== undefined
        ? input.reviewsLimitSet
        : input.reviewsLimitDelta !== undefined
          ? Math.max(0, (baseReviews ?? 0) + input.reviewsLimitDelta)
          : targetUser.overrideReviewsLimit;

      const newSeatsLimit = input.seatsLimitSet !== undefined
        ? input.seatsLimitSet
        : input.seatsLimitDelta !== undefined
          ? Math.max(0, (baseSeats ?? 0) + input.seatsLimitDelta)
          : targetUser.overrideSeatsLimit;

      await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          overrideReposLimit: newReposLimit,
          overrideReviewsLimit: newReviewsLimit,
          overrideSeatsLimit: newSeatsLimit,
        },
      });

      void logAudit({
        actorId: ctx.user.id,
        action: "USER_LIMITS_UPDATED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: {
          oldOverrides: {
            repos: targetUser.overrideReposLimit,
            reviews: targetUser.overrideReviewsLimit,
            seats: targetUser.overrideSeatsLimit,
          },
          newOverrides: {
            repos: newReposLimit,
            reviews: newReviewsLimit,
            seats: newSeatsLimit,
          },
        },
      });

      return { success: true };
    }),

  bulkUpdateUserPlans: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string().max(255)),
        planId: z.string(),
        expiresAt: z.date().nullable().optional(),
        overrideReposLimit: z.number().int().min(0).nullable().optional(),
        overrideReviewsLimit: z.number().int().min(0).nullable().optional(),
        overrideSeatsLimit: z.number().int().min(0).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: { id: { in: input.userIds } },
        select: { id: true, email: true, name: true, planId: true },
      });

      await ctx.db.user.updateMany({
        where: { id: { in: input.userIds } },
        data: {
          planId: input.planId,
          planExpiresAt: input.expiresAt ?? null,
          overrideReposLimit: input.overrideReposLimit ?? null,
          overrideReviewsLimit: input.overrideReviewsLimit ?? null,
          overrideSeatsLimit: input.overrideSeatsLimit ?? null,
        },
      });

      void logAudit({
        actorId: ctx.user.id,
        action: "BULK_USER_PLAN_UPDATED",
        resource: "USER",
        resourceId: "BULK",
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: {
          count: input.userIds.length,
          newPlan: input.planId,
          expiresAt: input.expiresAt,
        },
      });

      for (const user of users) {
        try {
          await sendPlanChangedEmail({
            to: user.email,
            userName: user.name ?? user.email,
            oldPlan: user.planId,
            newPlan: input.planId,
            expiresAt: input.expiresAt ?? null,
            changedBy: ctx.user.name ?? ctx.user.email,
            overrides: {
              repos: input.overrideReposLimit,
              reviews: input.overrideReviewsLimit,
              seats: input.overrideSeatsLimit,
            },
          });
        } catch (error) {
          console.error(
            `Failed to send plan changed email to ${user.email}:`,
            error,
          );
        }
      }

      return { success: true, count: users.length };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });

      if (!targetUser) {
        throw new Error("User not found.");
      }

      if (targetUser.email === process.env.OWNER_MAIL && ctx.user.email !== process.env.OWNER_MAIL) {
        throw new Error("The owner's account cannot be deleted by others.");
      }

      if (input.userId === ctx.user.id) {
        throw new Error("Cannot delete your own admin account.");
      }

      await ctx.db.user.delete({ where: { id: input.userId } });
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_DELETED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true };
    }),

  banUser: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        reason: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });

      if (!targetUser) {
        throw new Error("User not found.");
      }

      if (targetUser.email === process.env.OWNER_MAIL && ctx.user.email !== process.env.OWNER_MAIL) {
        throw new Error("The owner's account cannot be banned by others.");
      }

      if (input.userId === ctx.user.id) {
        throw new Error("You cannot ban your own account.");
      }

      await ctx.db.$transaction([
        ctx.db.user.update({
          where: { id: input.userId },
          data: {
            banned: true,
            bannedReason: input.reason ?? null,
          },
        }),
        ctx.db.session.deleteMany({
          where: { userId: input.userId },
        }),
      ]);
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_BANNED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { reason: input.reason ?? null },
      });
      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { banned: false, bannedReason: null },
      });
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_UNBANNED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true };
    }),

  adminResetUserPassword: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true, name: true },
      });

      if (!targetUser) {
        throw new Error("User not found.");
      }

      if (targetUser.email === process.env.OWNER_MAIL) {
        throw new Error("Cannot reset the owner's password.");
      }

      const key = `pwd-reset:${targetUser.email.toLowerCase()}`;
      if (!checkRateLimit(key, RESET_WINDOW_MS)) {
        const remainingSec = Math.ceil(
          getRateLimitRemaining(key, RESET_WINDOW_MS) / 1000,
        );
        throw new Error(
          `A reset email was already sent recently. Please wait ${remainingSec} seconds before trying again.`,
        );
      }

      const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

      await auth.api.requestPasswordReset({
        body: {
          email: targetUser.email,
          redirectTo: `${baseUrl}/reset-password`,
        },
        headers: new Headers(),
      });

      void logAudit({
        actorId: ctx.user.id,
        action: "USER_PASSWORD_RESET_REQUESTED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { success: true };
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().max(255).optional(),
        role: z.nativeEnum(UserRole).optional(),
        planId: z.string().optional(),
        planExpiresAt: z.date().nullable().optional(),
        banned: z.boolean().optional(),
        bannedReason: z.string().max(2000).nullable().optional(),
        reviewDepth: z.string().optional(),
        defaultLanguage: z.string().optional(),
        autoReview: z.boolean().optional(),
        includeSecurityChecks: z.boolean().optional(),
        includePerfSuggestions: z.boolean().optional(),
        overrideReposLimit: z.number().int().min(0).nullable().optional(),
        overrideReviewsLimit: z.number().int().min(0).nullable().optional(),
        overrideSeatsLimit: z.number().int().min(0).nullable().optional(),
        desktopNotifications: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        notificationSoundEnabled: z.boolean().optional(),
        pendingPlanId: z.string().nullable().optional(),
        pendingBillingCycle: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, ...data } = input;

      const targetUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!targetUser) throw new Error("User not found.");

      if (targetUser.email === process.env.OWNER_MAIL && ctx.user.email !== process.env.OWNER_MAIL) {
        throw new Error("Only the owner can edit the owner's account.");
      }

      await ctx.db.user.update({ where: { id: userId }, data });

      void logAudit({
        actorId: ctx.user.id,
        action: "USER_UPDATED",
        resource: "USER",
        resourceId: userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: data,
      });

      return { success: true };
    }),
});
