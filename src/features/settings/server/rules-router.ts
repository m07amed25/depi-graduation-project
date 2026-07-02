import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getAccessibleRepository } from "@/lib/repository";
import { checkFeature } from "@/lib/capabilities";

const severityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

const ruleInput = z.object({
  name: z.string().max(255).min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  pattern: z.string().max(500).optional(),
  severity: severityEnum.default("MEDIUM"),
  repositoryId: z.string().max(255).optional(),
  teamId: z.string().max(255).optional(),
  enabled: z.boolean().default(true),
});

export const rulesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(ruleInput)
    .mutation(async ({ ctx, input }) => {
      await checkFeature(ctx.db, ctx.user.id, "custom_review_rules");

      if (input.repositoryId) {
        await getAccessibleRepository(ctx.db, ctx.user.id, input.repositoryId);
      }

      if (input.teamId) {
        const membership = await ctx.db.teamMember.findUnique({
          where: {
            teamId_userId: { teamId: input.teamId, userId: ctx.user.id },
          },
        });
        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a member of this team.",
          });
        }
      }

      if (input.pattern) {
        try {
          new RegExp(input.pattern);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid regex pattern.",
          });
        }
      }

      return ctx.db.reviewRule.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      });
    }),

  list: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255).optional(),
        teamId: z.string().max(255).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teamMemberships = await ctx.db.teamMember.findMany({
        where: { userId: ctx.user.id },
        select: { teamId: true },
      });
      const userTeamIds = teamMemberships.map(
        (m: { teamId: string }) => m.teamId,
      );

      const rules = await ctx.db.reviewRule.findMany({
        where: {
          OR: [
            { userId: ctx.user.id, repositoryId: null, teamId: null },
            // Rules scoped to a specific repository (if requested)
            ...(input.repositoryId
              ? [{ repositoryId: input.repositoryId }]
              : []),
            // Rules for teams the user belongs to
            ...(userTeamIds.length > 0
              ? [{ teamId: { in: userTeamIds } }]
              : []),
          ],
        },
        orderBy: [
          // repo-scoped first, then team, then global
          { repositoryId: "desc" },
          { teamId: "desc" },
          { createdAt: "desc" },
        ],
      });

      return rules;
    }),

  /**
   * Fetch the active (enabled) rules to inject into an AI prompt for a review.
   * Repository rules override team rules with the same name.
   */
  getActiveForReview: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getAccessibleRepository(ctx.db, ctx.user.id, input.repositoryId);

      // Get team for this repository
      const repo = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId },
        select: { teamId: true, userId: true },
      });

      const teamFilter = repo?.teamId ? [{ teamId: repo.teamId }] : [];

      const allRules = await ctx.db.reviewRule.findMany({
        where: {
          enabled: true,
          OR: [
            { repositoryId: input.repositoryId },
            ...teamFilter,
            // Global rules from the repository owner
            {
              userId: repo?.userId ?? ctx.user.id,
              repositoryId: null,
              teamId: null,
            },
          ],
        },
      });

      // Repository-level rules override team/global rules with the same name
      const ruleMap = new Map<string, (typeof allRules)[number]>();
      // Insert in lowest-priority order so higher-priority ones overwrite
      const sorted = [...allRules].sort((a, b) => {
        const priority = (r: (typeof allRules)[number]) =>
          r.repositoryId ? 2 : r.teamId ? 1 : 0;
        return priority(a) - priority(b);
      });
      for (const rule of sorted) {
        ruleMap.set(rule.name.toLowerCase(), rule);
      }

      return Array.from(ruleMap.values());
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().max(255),
        name: z.string().max(255).min(1).max(100).optional(),
        description: z.string().min(1).max(2000).optional(),
        pattern: z.string().max(500).nullable().optional(),
        severity: severityEnum.optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.reviewRule.findUnique({ where: { id } });
      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rule not found or access denied.",
        });
      }

      if (data.pattern) {
        try {
          new RegExp(data.pattern);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid regex pattern.",
          });
        }
      }

      return ctx.db.reviewRule.update({
        where: { id },
        data,
      });
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.string().max(255), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.reviewRule.findUnique({
        where: { id: input.id },
      });
      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rule not found or access denied.",
        });
      }
      return ctx.db.reviewRule.update({
        where: { id: input.id },
        data: { enabled: input.enabled },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.reviewRule.findUnique({
        where: { id: input.id },
      });
      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rule not found or access denied.",
        });
      }
      await ctx.db.reviewRule.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
