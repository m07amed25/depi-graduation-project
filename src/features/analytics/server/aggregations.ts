import { z } from "zod";
import { createTRPCRouter } from "@/server/api/trpc";
import { TimePeriodSchema, assertTeamMembership, getStartDate, analyticsProcedure } from "./helpers";

export const analyticsAggregationsRouter = createTRPCRouter({
  getReviewerWorkload: analyticsProcedure
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
          ...(repositoryId && { repositoryId }),
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      });

      const reviewerMap = new Map<
        string,
        {
          id: string;
          name: string;
          image: string | null;
          total: number;
          completed: number;
          pending: number;
          failed: number;
          avgCompletionTimeHours: number;
        }
      >();

      reviews.forEach((review) => {
        const userId = review.userId;
        if (!reviewerMap.has(userId)) {
          reviewerMap.set(userId, {
            id: review.user.id,
            name: review.user.name || "Unknown",
            image: review.user.image,
            total: 0,
            completed: 0,
            pending: 0,
            failed: 0,
            avgCompletionTimeHours: 0,
          });
        }

        const reviewer = reviewerMap.get(userId)!;
        reviewer.total++;

        if (review.status === "COMPLETED") {
          reviewer.completed++;
          const completionTime =
            review.updatedAt.getTime() - review.createdAt.getTime();
          reviewer.avgCompletionTimeHours =
            (reviewer.avgCompletionTimeHours * (reviewer.completed - 1) +
              completionTime / (1000 * 60 * 60)) /
            reviewer.completed;
        } else if (
          review.status === "PENDING" ||
          review.status === "PROCESSING"
        ) {
          reviewer.pending++;
        } else if (review.status === "FAILED") {
          reviewer.failed++;
        }
      });

      const workload = Array.from(reviewerMap.values()).sort(
        (a, b) => b.total - a.total,
      );

      return {
        reviewers: workload.map((r) => ({
          ...r,
          avgCompletionTimeHours: Math.round(r.avgCompletionTimeHours),
        })),
        period: timePeriod,
      };
    }),

  getQualityScores: analyticsProcedure
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
        select: { qualityMetrics: true, riskScore: true, summary: true },
      });

      let totalComplexity = 0;
      let complexityCount = 0;
      let totalMaintainability = 0;
      let maintainabilityCount = 0;
      let totalReadability = 0;
      let readabilityCount = 0;
      let totalTestability = 0;
      let testabilityCount = 0;
      const riskScores: number[] = [];

      reviews.forEach((review) => {
        if (review.qualityMetrics) {
          const metrics = review.qualityMetrics as Record<string, unknown>;
          if (metrics.complexity !== undefined) {
            totalComplexity += Number(metrics.complexity);
            complexityCount++;
          }
          if (metrics.maintainability !== undefined) {
            totalMaintainability += Number(metrics.maintainability);
            maintainabilityCount++;
          }
          if (metrics.readability !== undefined) {
            totalReadability += Number(metrics.readability);
            readabilityCount++;
          }
          if (metrics.testability !== undefined) {
            totalTestability += Number(metrics.testability);
            testabilityCount++;
          }
        }
        if (review.riskScore !== null) {
          riskScores.push(review.riskScore);
        }
      });

      const riskDistribution = {
        low: riskScores.filter((r) => r <= 30).length,
        medium: riskScores.filter((r) => r > 30 && r <= 60).length,
        high: riskScores.filter((r) => r > 60 && r <= 80).length,
        critical: riskScores.filter((r) => r > 80).length,
      };

      return {
        avgCoverage:
          complexityCount > 0
            ? Math.round(totalComplexity / complexityCount)
            : 0,
        avgMaintainability:
          maintainabilityCount > 0
            ? Math.round(totalMaintainability / maintainabilityCount)
            : 0,
        avgPerformance:
          readabilityCount > 0
            ? Math.round(totalReadability / readabilityCount)
            : 0,
        avgSecurity:
          testabilityCount > 0
            ? Math.round(totalTestability / testabilityCount)
            : 0,
        riskDistribution,
        totalReviewed: reviews.length,
        period: timePeriod,
      };
    }),

  getTopIssues: analyticsProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().max(255).optional(),
        teamId: z.string().max(255).optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId, limit } = input;

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
        select: { comments: true, summary: true },
      });

      const issueCounts = new Map<string, number>();
      const rejectionReasons = new Map<string, number>();

      reviews.forEach((review) => {
        if (review.comments) {
          const comments = review.comments as Array<{
            issue?: string;
            category?: string;
            severity?: string;
            type?: string;
          }>;

          comments.forEach((comment) => {
            if (comment.issue) {
              const current = issueCounts.get(comment.issue) || 0;
              issueCounts.set(comment.issue, current + 1);
            }
            if (comment.category) {
              const current = rejectionReasons.get(comment.category) || 0;
              rejectionReasons.set(comment.category, current + 1);
            }
          });
        }

        if (review.summary) {
          const summary = review.summary.toLowerCase();
          if (
            summary.includes("security") ||
            summary.includes("vulnerability")
          ) {
            const current = rejectionReasons.get("Security Issues") || 0;
            rejectionReasons.set("Security Issues", current + 1);
          }
          if (summary.includes("performance") || summary.includes("slow")) {
            const current = rejectionReasons.get("Performance Issues") || 0;
            rejectionReasons.set("Performance Issues", current + 1);
          }
          if (summary.includes("bug") || summary.includes("error")) {
            const current = rejectionReasons.get("Bugs") || 0;
            rejectionReasons.set("Bugs", current + 1);
          }
          if (
            summary.includes("code quality") ||
            summary.includes("maintainability")
          ) {
            const current = rejectionReasons.get("Code Quality") || 0;
            rejectionReasons.set("Code Quality", current + 1);
          }
          if (summary.includes("style") || summary.includes("formatting")) {
            const current = rejectionReasons.get("Code Style") || 0;
            rejectionReasons.set("Code Style", current + 1);
          }
          if (summary.includes("test") || summary.includes("coverage")) {
            const current = rejectionReasons.get("Test Coverage") || 0;
            rejectionReasons.set("Test Coverage", current + 1);
          }
          if (summary.includes("documentation") || summary.includes("docs")) {
            const current = rejectionReasons.get("Documentation") || 0;
            rejectionReasons.set("Documentation", current + 1);
          }
        }
      });

      const topIssues = Array.from(issueCounts.entries())
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      const topRejectionReasons = Array.from(rejectionReasons.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return {
        topIssues,
        topRejectionReasons,
        totalReviews: reviews.length,
        period: timePeriod,
      };
    }),

  getAnomalies: analyticsProcedure
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
          ...(repositoryId && { repositoryId }),
        },
      });

      const anomalies: Array<{
        type:
          | "high_failure_rate"
          | "slow_processing"
          | "low_quality"
          | "risk_spike";
        severity: "warning" | "critical";
        message: string;
        value: number;
        threshold: number;
      }> = [];

      const failedCount = reviews.filter((r) => r.status === "FAILED").length;
      const failureRate =
        reviews.length > 0 ? (failedCount / reviews.length) * 100 : 0;

      if (failureRate > 20) {
        anomalies.push({
          type: "high_failure_rate",
          severity: failureRate > 40 ? "critical" : "warning",
          message: `Failure rate is ${Math.round(failureRate)}% (threshold: 20%)`,
          value: Math.round(failureRate),
          threshold: 20,
        });
      }

      const stuckProcessing = reviews.filter(
        (r) =>
          r.status === "PROCESSING" &&
          now.getTime() - r.createdAt.getTime() > 30 * 60 * 1000,
      ).length;

      if (stuckProcessing > 0) {
        anomalies.push({
          type: "slow_processing",
          severity: "warning",
          message: `${stuckProcessing} review(s) stuck in processing for over 30 minutes`,
          value: stuckProcessing,
          threshold: 0,
        });
      }

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

      const avgQualityScore =
        qualityCount > 0 ? totalQualityScore / qualityCount : 0;

      if (avgQualityScore < 50 && qualityCount > 5) {
        anomalies.push({
          type: "low_quality",
          severity: "warning",
          message: `Average quality score is ${Math.round(avgQualityScore)}% (below 50%)`,
          value: Math.round(avgQualityScore),
          threshold: 50,
        });
      }

      const highRiskCount = reviews.filter(
        (r) => (r.riskScore || 0) > 80,
      ).length;
      const riskPercentage =
        reviews.length > 0 ? (highRiskCount / reviews.length) * 100 : 0;

      if (riskPercentage > 30) {
        anomalies.push({
          type: "risk_spike",
          severity: "critical",
          message: `${Math.round(riskPercentage)}% of reviews have high risk scores (threshold: 30%)`,
          value: Math.round(riskPercentage),
          threshold: 30,
        });
      }

      return {
        anomalies,
        period: timePeriod,
      };
    }),
});
