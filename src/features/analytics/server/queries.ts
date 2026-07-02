import { z } from "zod";
import { createTRPCRouter } from "@/server/api/trpc";
import {
  TimePeriodSchema,
  assertTeamMembership,
  getStartDate,
  groupReviewsByTime,
  analyticsProcedure,
} from "./helpers";

export const analyticsQueriesRouter = createTRPCRouter({
  getOverview: analyticsProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().max(255).optional(),
        teamId: z.string().max(255).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId } = input;

      if (teamId) {
        await assertTeamMembership(ctx.db, ctx.user.id, teamId);
      }

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const baseWhere = {
        createdAt: { gte: startDate, lte: now },
        ...(repositoryId && { repositoryId }),
      };

      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const accessFilter = {
        OR: [{ userId: ctx.user.id }, { repositoryId: { in: teamRepoIdSet } }],
        ...baseWhere,
      };

      const [statusGroups, riskAgg] = await Promise.all([
        ctx.db.review.groupBy({
          by: ["status"],
          where: accessFilter,
          _count: { status: true },
        }),
        ctx.db.review.aggregate({
          where: { ...accessFilter, riskScore: { not: null } },
          _avg: { riskScore: true },
          _count: { id: true },
        }),
      ]);

      const statusMap = Object.fromEntries(
        statusGroups.map((g) => [g.status, g._count.status]),
      ) as Record<string, number>;

      const totalReviews = statusGroups.reduce(
        (sum, g) => sum + g._count.status,
        0,
      );
      const completedReviews = statusMap["COMPLETED"] ?? 0;
      const pendingReviews = statusMap["PENDING"] ?? 0;
      const processingReviews = statusMap["PROCESSING"] ?? 0;
      const failedReviews = statusMap["FAILED"] ?? 0;
      const completionRate =
        totalReviews > 0
          ? Math.round((completedReviews / totalReviews) * 100)
          : 0;
      const avgRiskScore = Math.round(riskAgg._avg.riskScore ?? 0);

      const reviews = await ctx.db.review.findMany({
        where: { ...accessFilter, status: "COMPLETED" },
        select: { qualityMetrics: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      const completedWithTimes = reviews.filter((r) => r.updatedAt);
      const avgCompletionTimeMs =
        completedWithTimes.length > 0
          ? completedWithTimes.reduce(
              (sum, r) => sum + (r.updatedAt.getTime() - r.createdAt.getTime()),
              0,
            ) / completedWithTimes.length
          : 0;
      const avgCompletionTimeHours = Math.round(
        avgCompletionTimeMs / (1000 * 60 * 60),
      );

      let totalQualityScore = 0;
      let qualityScoreCount = 0;
      let totalBugDetection = 0;
      let totalBugDetectionCount = 0;
      let totalSecurityIssues = 0;

      reviews.forEach((r) => {
        if (r.qualityMetrics) {
          const metrics = r.qualityMetrics as Record<string, unknown>;
          if (metrics.overallScore) {
            totalQualityScore += Number(metrics.overallScore);
            qualityScoreCount++;
          }
          if (metrics.bugDetectionRate) {
            totalBugDetection += Number(metrics.bugDetectionRate);
            totalBugDetectionCount++;
          }
          if (metrics.securityIssues) {
            totalSecurityIssues += Number(metrics.securityIssues);
          }
        }
      });

      return {
        totalReviews,
        completedReviews,
        pendingReviews,
        processingReviews,
        failedReviews,
        completionRate,
        avgCompletionTimeHours,
        avgRiskScore,
        avgQualityScore:
          qualityScoreCount > 0
            ? Math.round(totalQualityScore / qualityScoreCount)
            : 0,
        avgBugDetectionRate:
          totalBugDetectionCount > 0
            ? Math.round(totalBugDetection / totalBugDetectionCount)
            : 0,
        totalSecurityIssues,
        period: timePeriod,
      };
    }),

  getTrends: analyticsProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().max(255).optional(),
        teamId: z.string().max(255).optional(),
        granularity: z.enum(["daily", "weekly", "monthly"]).default("daily"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId, granularity } = input;

      if (teamId) {
        await assertTeamMembership(ctx.db, ctx.user.id, teamId);
      }

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const reviews = await ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          createdAt: { gte: startDate, lte: now },
          ...(repositoryId && { repositoryId }),
        },
        orderBy: { createdAt: "asc" },
      });

      return groupReviewsByTime(reviews, granularity, startDate, now);
    }),

  getApprovalRejectionRates: analyticsProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().max(255).optional(),
        teamId: z.string().max(255).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId } = input;

      if (teamId) {
        await assertTeamMembership(ctx.db, ctx.user.id, teamId);
      }

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const reviews = await ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          createdAt: { gte: startDate, lte: now },
          status: "COMPLETED",
          ...(repositoryId && { repositoryId }),
        },
      });

      let approved = 0;
      let rejected = 0;
      let needsChanges = 0;
      let pending = 0;

      reviews.forEach((review) => {
        const summary = review.summary?.toLowerCase() || "";
        if (
          summary.includes("approved") ||
          summary.includes("lgtm") ||
          summary.includes("looks good")
        ) {
          approved++;
        } else if (
          summary.includes("rejected") ||
          summary.includes("changes requested")
        ) {
          rejected++;
        } else if (
          summary.includes("changes") ||
          summary.includes("needs work")
        ) {
          needsChanges++;
        } else {
          pending++;
        }
      });

      const total = reviews.length || 1;

      return {
        approved: {
          count: approved,
          percentage: Math.round((approved / total) * 100),
        },
        rejected: {
          count: rejected,
          percentage: Math.round((rejected / total) * 100),
        },
        needsChanges: {
          count: needsChanges,
          percentage: Math.round((needsChanges / total) * 100),
        },
        pending: {
          count: pending,
          percentage: Math.round((pending / total) * 100),
        },
        total: reviews.length,
        period: timePeriod,
      };
    }),

  getReviewerPerformance: analyticsProcedure
    .input(
      z.object({
        reviewerId: z.string().max(255),
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().max(255).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { reviewerId, timePeriod, repositoryId } = input;

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const reviews = await ctx.db.review.findMany({
        where: {
          userId: reviewerId,
          createdAt: { gte: startDate, lte: now },
          ...(repositoryId && { repositoryId }),
        },
        orderBy: { createdAt: "desc" },
      });

      const user = await ctx.db.user.findUnique({
        where: { id: reviewerId },
        select: { id: true, name: true, image: true, email: true },
      });

      const total = reviews.length;
      const completed = reviews.filter((r) => r.status === "COMPLETED").length;
      const pending = reviews.filter((r) => r.status === "PENDING").length;
      const processing = reviews.filter(
        (r) => r.status === "PROCESSING",
      ).length;
      const failed = reviews.filter((r) => r.status === "FAILED").length;

      const completedReviews = reviews.filter(
        (r) => r.status === "COMPLETED" && r.updatedAt,
      );
      const avgCompletionTimeMs =
        completedReviews.length > 0
          ? completedReviews.reduce(
              (sum, r) => sum + (r.updatedAt.getTime() - r.createdAt.getTime()),
              0,
            ) / completedReviews.length
          : 0;

      let totalQualityScore = 0;
      let qualityCount = 0;
      reviews.forEach((r) => {
        if (r.qualityMetrics) {
          const metrics = r.qualityMetrics as Record<string, unknown>;
          if (metrics.overallScore) {
            totalQualityScore += Number(metrics.overallScore);
            qualityCount++;
          }
        }
      });

      return {
        reviewer: user
          ? {
              id: user.id,
              name: user.name,
              image: user.image,
              email: user.email,
            }
          : null,
        stats: {
          total,
          completed,
          pending,
          processing,
          failed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          avgCompletionTimeHours: Math.round(
            avgCompletionTimeMs / (1000 * 60 * 60),
          ),
          avgQualityScore:
            qualityCount > 0 ? Math.round(totalQualityScore / qualityCount) : 0,
        },
        recentReviews: reviews.slice(0, 10).map((r) => ({
          id: r.id,
          prTitle: r.prTitle,
          prNumber: r.prNumber,
          status: r.status,
          riskScore: r.riskScore,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        period: timePeriod,
      };
    }),
});
