import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { computeReviewDiff, type Finding } from "@/lib/review-diff";
import { checkUserLimit } from "@/lib/limits";
import { getAccessibleRepository } from "@/lib/repository";
import { inngest } from "@/server/inngest";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { askFollowUp } from "@/server/services/ai";
import {
  fetchPullRequestByFullName,
  getGitHubAccessToken,
} from "@/server/services/github";

export const reviewRouter = createTRPCRouter({
  trigger: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
        prNumber: z.number(),
        parentReviewId: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkUserLimit(ctx.db, ctx.user.id, "reviewsLimit");

      const repository = await getAccessibleRepository(
        ctx.db,
        ctx.user.id,
        input.repositoryId,
      );

      const accessToken = await getGitHubAccessToken(repository.userId);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub account not connected",
        });
      }

      const pullRequest = await fetchPullRequestByFullName(
        accessToken,
        repository.fullName,
        input.prNumber,
      );

      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          reviewDepth: true,
          defaultLanguage: true,
          includeSecurityChecks: true,
          includePerfSuggestions: true,
        },
      });

      const review = await ctx.db.review.create({
        data: {
          repositoryId: repository.id,
          userId: ctx.user.id,
          prNumber: pullRequest.number,
          prTitle: pullRequest.title,
          prUrl: pullRequest.html_url,
          status: "PENDING",
          parentReviewId: input.parentReviewId ?? null,
        },
      });

      try {
        await inngest.send({
          name: "review/pr.requested",
          data: {
            reviewId: review.id,
            repositoryId: repository.id,
            prNumber: pullRequest.number,
            userId: repository.userId,
            preferences: user
              ? {
                  reviewDepth: user.reviewDepth,
                  defaultLanguage: user.defaultLanguage,
                  includeSecurityChecks: user.includeSecurityChecks,
                  includePerfSuggestions: user.includePerfSuggestions,
                }
              : undefined,
          },
        });
      } catch (error) {
        console.error("Failed to send Inngest event:", error);
        await ctx.db.review.update({
          where: { id: review.id },
          data: {
            status: "FAILED",
            error:
              "Failed to queue review job. Please check Inngest configuration.",
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to queue review. Ensure INNGEST_EVENT_KEY is configured.",
        });
      }

      return { reviewId: review.id };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().max(255).max(255) }))
    .query(async ({ ctx, input }) => {
      let review = await ctx.db.review.findUnique({
        where: { id: input.id, userId: ctx.user.id },
        include: { repository: true },
      });

      if (!review) {
        review = await ctx.db.review.findFirst({
          where: {
            id: input.id,
            repository: {
              team: { members: { some: { userId: ctx.user.id } } },
            },
          },
          include: { repository: true },
        });
      }

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      return review;
    }),

  list: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255).optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teamRepoIds = await ctx.db.repository.findMany({
        where: {
          team: { members: { some: { userId: ctx.user.id } } },
        },
        select: { id: true },
      });
      const teamRepositoryIds = teamRepoIds.map((repository) => repository.id);

      return ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepositoryIds } },
          ],
          ...(input.repositoryId ? { repositoryId: input.repositoryId } : {}),
        },
        include: {
          repository: true,
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  getLatestForPR: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.review.findFirst({
        where: {
          repositoryId: input.repositoryId,
          prNumber: input.prNumber,
          OR: [
            { userId: ctx.user.id },
            {
              repository: {
                team: { members: { some: { userId: ctx.user.id } } },
              },
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      }) as Promise<
        | (Awaited<ReturnType<typeof ctx.db.review.findFirst>> & {
            resolvedComments: string[];
          })
        | null
      >;
    }),

  toggleResolvedComment: protectedProcedure
    .input(
      z.object({
        reviewId: z.string().max(255),
        commentKey: z.string().max(255),
        resolved: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findFirst({
        where: {
          id: input.reviewId,
          OR: [
            { userId: ctx.user.id },
            {
              repository: {
                team: { members: { some: { userId: ctx.user.id } } },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }

      if (input.resolved) {
        await ctx.db.$executeRaw`
          UPDATE "Review"
          SET "resolvedComments" = array_append(array_remove("resolvedComments", ${input.commentKey}), ${input.commentKey})
          WHERE id = ${input.reviewId}
        `;
      } else {
        await ctx.db.$executeRaw`
          UPDATE "Review"
          SET "resolvedComments" = array_remove("resolvedComments", ${input.commentKey})
          WHERE id = ${input.reviewId}
        `;
      }

      return { success: true };
    }),

  submitFeedback: protectedProcedure
    .input(
      z.object({
        reviewId: z.string().max(255),
        rating: z.union([z.literal(1), z.literal(-1)]),
        comment: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.reviewFeedback.upsert({
        where: {
          reviewId_userId: {
            reviewId: input.reviewId,
            userId: ctx.user.id,
          },
        },
        update: {
          rating: input.rating,
          comment: input.comment,
        },
        create: {
          reviewId: input.reviewId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment,
        },
      });
    }),

  getFeedbackStats: protectedProcedure
    .input(z.object({ repositoryId: z.string().max(255).optional() }))
    .query(async ({ ctx, input }) => {
      const teamRepoIds = await ctx.db.repository.findMany({
        where: { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const repositoryIds = teamRepoIds.map((repository) => repository.id);

      const feedbacks = await ctx.db.reviewFeedback.findMany({
        where: {
          review: {
            OR: [
              { userId: ctx.user.id },
              { repositoryId: { in: repositoryIds } },
            ],
            ...(input.repositoryId ? { repositoryId: input.repositoryId } : {}),
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const trend = feedbacks.reduce(
        (accumulator, feedback) => {
          const date = feedback.createdAt.toISOString().split("T")[0];
          const current = accumulator[date] ?? { date, up: 0, down: 0 };

          if (feedback.rating === 1) {
            current.up += 1;
          } else if (feedback.rating === -1) {
            current.down += 1;
          }

          accumulator[date] = current;
          return accumulator;
        },
        {} as Record<string, { date: string; up: number; down: number }>,
      );

      return Object.values(trend) as {
        date: string;
        up: number;
        down: number;
      }[];
    }),

  listHistoryForPR: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.review.findMany({
        where: {
          repositoryId: input.repositoryId,
          prNumber: input.prNumber,
          OR: [
            { userId: ctx.user.id },
            {
              repository: {
                team: { members: { some: { userId: ctx.user.id } } },
              },
            },
          ],
        },
        select: {
          id: true,
          status: true,
          riskScore: true,
          parentReviewId: true,
          createdAt: true,
          comments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getDiff: protectedProcedure
    .input(
      z.object({
        reviewId: z.string().max(255),
        compareReviewId: z.string().max(255),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [current, previous] = await Promise.all([
        ctx.db.review.findFirst({
          where: {
            id: input.reviewId,
            OR: [
              { userId: ctx.user.id },
              {
                repository: {
                  team: { members: { some: { userId: ctx.user.id } } },
                },
              },
            ],
          },
          select: {
            id: true,
            repositoryId: true,
            comments: true,
            riskScore: true,
            createdAt: true,
          },
        }),
        ctx.db.review.findFirst({
          where: {
            id: input.compareReviewId,
            OR: [
              { userId: ctx.user.id },
              {
                repository: {
                  team: { members: { some: { userId: ctx.user.id } } },
                },
              },
            ],
          },
          select: {
            id: true,
            repositoryId: true,
            comments: true,
            riskScore: true,
            createdAt: true,
          },
        }),
      ]);

      if (!current || !previous) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or both reviews not found",
        });
      }

      if (current.repositoryId !== previous.repositoryId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot diff reviews from different repositories",
        });
      }

      const currentFindings = (
        Array.isArray(current.comments) ? current.comments : []
      ) as Finding[];
      const previousFindings = (
        Array.isArray(previous.comments) ? previous.comments : []
      ) as Finding[];

      const { fixed, persisted, newFindings } = computeReviewDiff(
        previousFindings,
        currentFindings,
      );

      return {
        currentReviewId: current.id,
        previousReviewId: previous.id,
        currentRiskScore: current.riskScore,
        previousRiskScore: previous.riskScore,
        currentDate: current.createdAt,
        previousDate: previous.createdAt,
        fixed,
        persisted,
        new: newFindings,
        summary: {
          fixedCount: fixed.length,
          persistedCount: persisted.length,
          newCount: newFindings.length,
          previousTotal: previousFindings.length,
          currentTotal: currentFindings.length,
        },
      };
    }),

  askAI: protectedProcedure
    .input(
      z.object({
        reviewId: z.string().max(255),
        file: z.string().max(500),
        line: z.number().int().min(1),
        severity: z.string().max(50),
        category: z.string().max(50).optional(),
        message: z.string().max(2000),
        suggestion: z.string().max(2000).optional(),
        question: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findFirst({
        where: {
          id: input.reviewId,
          OR: [
            { userId: ctx.user.id },
            {
              repository: {
                team: { members: { some: { userId: ctx.user.id } } },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      const answer = await askFollowUp(
        {
          file: input.file,
          line: input.line,
          severity: input.severity,
          category: input.category,
          message: input.message,
          suggestion: input.suggestion,
        },
        input.question,
      );

      return { answer };
    }),
});
