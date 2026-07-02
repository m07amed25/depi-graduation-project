import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const settingsRouter = createTRPCRouter({
  /**
   * Get all active sessions for the current user
   */
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.session.findMany({
      where: {
        userId: ctx.user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
    });

    // The current session token is in the cookie — we can mark it
    // by comparing session IDs (ctx.session.id is the current session)
    // better-auth: ctx.session = { session: { id, ... }, user: { ... } }
    const currentSessionId = ctx.session.session.id;

    return sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));
  }),

  /**
   * Revoke a specific session (sign out from that device)
   */
  revokeSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().max(255).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.sessionId === ctx.session.session.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use the sign-out button to end your current session.",
        });
      }

      const result = await ctx.db.session.deleteMany({
        where: {
          id: input.sessionId,
          userId: ctx.user.id,
        },
      });

      return {
        success: true,
        deleted: result.count,
      };
    }),

  /**
   * Revoke all other sessions (sign out everywhere else)
   */
  revokeAllOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db.session.deleteMany({
      where: {
        userId: ctx.user.id,
        id: {
          not: ctx.session.session.id,
        },
      },
    });

    return {
      revoked: result.count,
    };
  }),

  /**
   * Delete the user account and all associated data
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirmation: z.string().refine((val) => val === "DELETE", {
          message: 'Please type "DELETE" to confirm.',
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.confirmation !== "DELETE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: 'Please type "DELETE" to confirm account deletion.',
        });
      }

      // Revoke all sessions
      await ctx.db.session.deleteMany({
        where: {
          userId: ctx.user.id,
        },
      });

      // Delete user account
      await ctx.db.user.delete({
        where: {
          id: ctx.user.id,
        },
      });

      return {
        success: true,
      };
    }),

  /**
   * Get the current user's code review preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.user.id,
      },
      select: {
        reviewDepth: true,
        defaultLanguage: true,
        autoReview: true,
        includeSecurityChecks: true,
        includePerfSuggestions: true,
        preferredModel: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  /**
   * Update the current user's code review preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        reviewDepth: z
          .enum(["quick", "standard", "thorough"])
          .optional(),
        defaultLanguage: z
          .enum([
            "auto",
            "typescript",
            "javascript",
            "python",
            "java",
            "csharp",
            "go",
            "rust",
            "cpp",
            "c",
            "php",
            "ruby",
            "swift",
            "kotlin",
            "scala",
            "r",
            "dart",
            "elixir",
            "haskell",
            "lua",
            "shell",
            "sql",
          ])
          .optional(),
        autoReview: z.boolean().optional(),
        includeSecurityChecks: z.boolean().optional(),
        includePerfSuggestions: z.boolean().optional(),
        preferredModel: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.user.update({
        where: {
          id: ctx.user.id,
        },
        data: input,
        select: {
          reviewDepth: true,
          defaultLanguage: true,
          autoReview: true,
          includeSecurityChecks: true,
          includePerfSuggestions: true,
          preferredModel: true,
        },
      });

      return updated;
    }),

  /**
   * Get the current user's notification preferences
   */
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.user.id,
      },
      select: {
        emailNotifications: true,
        notifyTeamInvites: true,
        notifyTeamMemberAdded: true,
        notifyReviewCompleted: true,
        notifyReviewFailed: true,
        notifyScheduledScanCompleted: true,
        notifyReviewAssigned: true,
        notifyReviewApproved: true,
        notifyReviewChangesRequested: true,
        notificationSoundEnabled: true,
        desktopNotifications: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      emailNotifications: user.emailNotifications,
      teamInvites: user.notifyTeamInvites,
      teamMemberAdded: user.notifyTeamMemberAdded,
      reviewCompleted: user.notifyReviewCompleted,
      reviewFailed: user.notifyReviewFailed,
      scheduledScanCompleted: user.notifyScheduledScanCompleted,
      reviewAssigned: user.notifyReviewAssigned,
      reviewApproved: user.notifyReviewApproved,
      reviewChangesRequested: user.notifyReviewChangesRequested,
      soundEnabled: user.notificationSoundEnabled,
      desktopNotifications: user.desktopNotifications,
    };
  }),

  /**
   * Update the current user's notification preferences
   */
  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        teamInvites: z.boolean().optional(),
        teamMemberAdded: z.boolean().optional(),
        reviewCompleted: z.boolean().optional(),
        reviewFailed: z.boolean().optional(),
        scheduledScanCompleted: z.boolean().optional(),
        reviewAssigned: z.boolean().optional(),
        reviewApproved: z.boolean().optional(),
        reviewChangesRequested: z.boolean().optional(),
        soundEnabled: z.boolean().optional(),
        desktopNotifications: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, boolean> = {};

      // Map frontend-friendly names to database field names
      if (input.emailNotifications !== undefined) {
        data.emailNotifications = input.emailNotifications;
      }
      if (input.teamInvites !== undefined) {
        data.notifyTeamInvites = input.teamInvites;
      }
      if (input.teamMemberAdded !== undefined) {
        data.notifyTeamMemberAdded = input.teamMemberAdded;
      }
      if (input.reviewCompleted !== undefined) {
        data.notifyReviewCompleted = input.reviewCompleted;
      }
      if (input.reviewFailed !== undefined) {
        data.notifyReviewFailed = input.reviewFailed;
      }
      if (input.scheduledScanCompleted !== undefined) {
        data.notifyScheduledScanCompleted = input.scheduledScanCompleted;
      }
      if (input.reviewAssigned !== undefined) {
        data.notifyReviewAssigned = input.reviewAssigned;
      }
      if (input.reviewApproved !== undefined) {
        data.notifyReviewApproved = input.reviewApproved;
      }
      if (input.reviewChangesRequested !== undefined) {
        data.notifyReviewChangesRequested = input.reviewChangesRequested;
      }
      if (input.soundEnabled !== undefined) {
        data.notificationSoundEnabled = input.soundEnabled;
      }
      if (input.desktopNotifications !== undefined) {
        data.desktopNotifications = input.desktopNotifications;
      }

      await ctx.db.user.update({
        where: {
          id: ctx.user.id,
        },
        data,
      });

      return { success: true };
    }),
});
