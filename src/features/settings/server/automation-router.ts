import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { PrismaClient, RecommendationPriority } from "@/server/db/client";
import { getAccessibleRepository } from "@/lib/repository";

type RecommendationSeed = {
  rule: string;
  rationale: string;
  priority: RecommendationPriority;
};

function commentHasHighSeverity(comment: unknown): boolean {
  const value = comment as
    | { severity?: string; severityLevel?: string; text?: string; body?: string }
    | undefined;

  const severity = `${value?.severity ?? value?.severityLevel ?? ""}`.toUpperCase();
  if (severity === "HIGH" || severity === "CRITICAL") {
    return true;
  }

  const text = `${value?.text ?? value?.body ?? ""}`.toUpperCase();
  return text.includes("HIGH") || text.includes("CRITICAL");
}

export async function generateRepositoryRecommendations(
  db: PrismaClient,
  repositoryId: string,
): Promise<number> {
  const reviews = await db.review.findMany({
    where: {
      repositoryId,
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      riskScore: true,
      comments: true,
    },
  });

  if (reviews.length < 3) {
    return 0;
  }

  const highSeverityReviews = reviews.filter((review) => {
    if (!Array.isArray(review.comments)) return false;
    return review.comments.some((comment) => commentHasHighSeverity(comment));
  }).length;

  const avgRiskScore =
    reviews.reduce((sum, review) => sum + (review.riskScore ?? 0), 0) / reviews.length;

  const seeds: RecommendationSeed[] = [];

  if (highSeverityReviews >= 2) {
    seeds.push({
      rule: "require-status-checks",
      priority: "HIGH",
      rationale:
        "High-severity findings recur across recent reviews. Require status checks before merge to prevent regressions.",
    });
  }

  if (reviews.length >= 3) {
    seeds.push({
      rule: "require-pr-reviews",
      priority: "MEDIUM",
      rationale:
        "Repository has recurring PR activity. Enforcing at least one human approval improves quality and accountability.",
    });
  }

  if (avgRiskScore >= 70) {
    seeds.push({
      rule: "restrict-force-pushes",
      priority: "MEDIUM",
      rationale:
        "Average review risk score is elevated. Restrict force pushes to preserve commit auditability.",
    });
  }

  if (seeds.length === 0) {
    return 0;
  }

  const existingRules = await db.branchProtectionRecommendation.findMany({
    where: {
      repositoryId,
      rule: { in: seeds.map((seed) => seed.rule) },
    },
    select: { rule: true },
  });

  const existingRuleSet = new Set(existingRules.map((rec) => rec.rule));
  const toCreate = seeds.filter((seed) => !existingRuleSet.has(seed.rule));

  if (toCreate.length === 0) {
    return 0;
  }

  await db.branchProtectionRecommendation.createMany({
    data: toCreate.map((seed) => ({
      repositoryId,
      rule: seed.rule,
      rationale: seed.rationale,
      priority: seed.priority,
      dismissed: false,
    })),
  });

  return toCreate.length;
}

export const automationRouter = createTRPCRouter({
  getBranchProtectionRecommendations: protectedProcedure
    .input(z.object({ repositoryId: z.string().max(255).cuid() }))
    .query(async ({ ctx, input }) => {
      await getAccessibleRepository(ctx.db, ctx.user.id, input.repositoryId);

      return ctx.db.branchProtectionRecommendation.findMany({
        where: {
          repositoryId: input.repositoryId,
          dismissed: false,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  generateRecommendations: protectedProcedure
    .input(z.object({ repositoryId: z.string().max(255).cuid() }))
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId },
        select: { userId: true },
      });

      if (!repository) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      if (repository.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only repository owner can generate recommendations",
        });
      }

      const generated = await generateRepositoryRecommendations(
        ctx.db,
        input.repositoryId,
      );

      return { generated };
    }),

  dismissRecommendation: protectedProcedure
    .input(z.object({ recommendationId: z.string().max(255).cuid() }))
    .mutation(async ({ ctx, input }) => {
      const recommendation = await ctx.db.branchProtectionRecommendation.findUnique({
        where: { id: input.recommendationId },
        include: {
          repository: {
            include: {
              team: {
                include: {
                  members: {
                    where: { userId: ctx.user.id, role: { in: ["OWNER", "ADMIN"] } },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!recommendation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recommendation not found",
        });
      }

      const isOwner = recommendation.repository.userId === ctx.user.id;
      const isTeamAdmin = (recommendation.repository.team?.members.length ?? 0) > 0;

      if (!isOwner && !isTeamAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to dismiss this recommendation",
        });
      }

      await ctx.db.branchProtectionRecommendation.update({
        where: { id: input.recommendationId },
        data: { dismissed: true },
      });

      return { success: true as const };
    }),

  getScheduledScanRuns: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255).cuid(),
        limit: z.number().int().min(1).max(50).optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getAccessibleRepository(ctx.db, ctx.user.id, input.repositoryId);

      const config = await ctx.db.scheduledScanConfig.findUnique({
        where: { repositoryId: input.repositoryId },
        select: { id: true },
      });

      if (!config) {
        return [];
      }

      return ctx.db.scheduledScanRun.findMany({
        where: { configId: config.id },
        orderBy: { triggeredAt: "desc" },
        take: input.limit,
      });
    }),
});

