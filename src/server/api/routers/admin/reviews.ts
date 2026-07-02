import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { logAudit } from "../../../services/audit";

export const adminReviewsRouter = createTRPCRouter({
  getReviews: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        status: z
          .enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "ALL"])
          .default("ALL"),
        search: z.string().max(50).trim().optional(),
        sortBy: z
          .enum(["createdAt", "riskScore", "prNumber"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      const conditions: Record<string, unknown>[] = [];
      if (status !== "ALL") {
        conditions.push({ status });
      }
      if (search) {
        conditions.push({
          OR: [
            { prTitle: { contains: search, mode: "insensitive" as const } },
            {
              repository: {
                fullName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              user: {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    email: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            },
          ],
        });
      }
      const where = conditions.length > 0 ? { AND: conditions } : {};

      const [reviews, total, statusCounts] = await Promise.all([
        ctx.db.review.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            prTitle: true,
            prNumber: true,
            prUrl: true,
            status: true,
            riskScore: true,
            summary: true,
            error: true,
            qualityMetrics: true,
            createdAt: true,
            updatedAt: true,
            repository: {
              select: {
                id: true,
                fullName: true,
                htmlUrl: true,
                private: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                threads: true,
                feedbacks: true,
                childReviews: true,
              },
            },
            feedbacks: {
              select: { rating: true },
            },
          },
        }),
        ctx.db.review.count({ where }),
        ctx.db.review.groupBy({
          by: ["status"],
          _count: { status: true },
          ...(search
            ? {
                where: {
                  OR: [
                    {
                      prTitle: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      repository: {
                        fullName: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  ],
                },
              }
            : {}),
        }),
      ]);

      const statusMap = Object.fromEntries(
        statusCounts.map((r) => [r.status, r._count.status]),
      );

      return {
        reviews,
        total,
        pages: Math.ceil(total / limit),
        statusBreakdown: {
          PENDING: statusMap.PENDING ?? 0,
          PROCESSING: statusMap.PROCESSING ?? 0,
          COMPLETED: statusMap.COMPLETED ?? 0,
          FAILED: statusMap.FAILED ?? 0,
        },
      };
    }),

  deleteReview: adminProcedure
    .input(z.object({ reviewId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.review.delete({ where: { id: input.reviewId } });
      void logAudit({
        actorId: ctx.user.id,
        action: "REVIEW_DELETED",
        resource: "REVIEW",
        resourceId: input.reviewId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true };
    }),

  stopAllActiveReviews: adminProcedure.mutation(async ({ ctx }) => {
    const { count } = await ctx.db.review.updateMany({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      data: {
        status: "FAILED",
        error: "Stopped by administrator.",
      },
    });

    void logAudit({
      actorId: ctx.user.id,
      action: "REVIEWS_STOPPED",
      resource: "REVIEW",
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { stoppedCount: count },
    });

    return { success: true, stoppedCount: count };
  }),

  getTeams: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [teams, total] = await Promise.all([
        ctx.db.team.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { members: true, repositories: true } },
          },
        }),
        ctx.db.team.count(),
      ]);

      return { teams, total, pages: Math.ceil(total / limit) };
    }),

  deleteTeam: adminProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.team.delete({ where: { id: input.teamId } });
      void logAudit({
        actorId: ctx.user.id,
        action: "TEAM_DELETED",
        resource: "TEAM",
        resourceId: input.teamId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true };
    }),

  getFeedbacks: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        rating: z.union([z.literal(1), z.literal(-1), z.literal(0)]).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, rating } = input;
      const skip = (page - 1) * limit;
      const where = rating !== 0 ? { rating } : {};

      const [feedbacks, total] = await Promise.all([
        ctx.db.reviewFeedback.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true, image: true } },
            review: {
              select: {
                id: true,
                prTitle: true,
                prNumber: true,
                repository: { select: { id: true, fullName: true } },
              },
            },
          },
        }),
        ctx.db.reviewFeedback.count({ where }),
      ]);

      return { feedbacks, total, pages: Math.ceil(total / limit) };
    }),

  getRepositories: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().max(50).trim().optional(),
        sortBy: z.enum(["createdAt", "name", "reviews"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
              {
                user: {
                  email: { contains: search, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {};

      const [repositories, total] = await Promise.all([
        ctx.db.repository.findMany({
          where,
          skip,
          take: limit,
          orderBy:
            sortBy === "reviews"
              ? { reviews: { _count: sortOrder } }
              : { [sortBy]: sortOrder },
          include: {
            user: { select: { name: true, email: true, image: true } },
            team: { select: { name: true, slug: true } },
            webhookConfig: { select: { enabled: true } },
            scheduledScanConfig: { select: { enabled: true, cadence: true } },
            _count: {
              select: { reviews: true, reviewRules: true, diagrams: true },
            },
          },
        }),
        ctx.db.repository.count({ where }),
      ]);

      return { repositories, total, pages: Math.ceil(total / limit) };
    }),

  deleteRepository: adminProcedure
    .input(z.object({ repositoryId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.repository.delete({ where: { id: input.repositoryId } });
      return { success: true };
    }),
});
