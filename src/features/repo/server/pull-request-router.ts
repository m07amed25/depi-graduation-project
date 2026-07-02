import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getAccessibleRepository } from "@/lib/repository";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  fetchPullRequests,
  getGitHubAccessToken,
} from "@/server/services/github";

export const pullRequestRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
        state: z.enum(["open", "closed", "all"]).default("open"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repository = await getAccessibleRepository(
        ctx.db,
        ctx.user.id,
        input.repositoryId,
      );

      const accessToken = await getGitHubAccessToken(repository.userId);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Github account not connected",
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const pullRequests = await fetchPullRequests(
        accessToken,
        owner,
        repo,
        input.state,
      );

      const existingReviews = await ctx.db.review.findMany({
        where: {
          repositoryId: repository.id,
          prNumber: { in: pullRequests.map((pullRequest) => pullRequest.number) },
        },
        select: {
          prNumber: true,
          status: true,
          summary: true,
          riskScore: true,
          comments: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const reviewMap = new Map(
        existingReviews.map((review) => {
          const comments = Array.isArray(review.comments)
            ? (review.comments as Array<{ severity?: string; category?: string }>)
            : [];
          const severityCounts = {
            critical: comments.filter((comment) => comment.severity === "critical").length,
            high: comments.filter((comment) => comment.severity === "high").length,
            medium: comments.filter((comment) => comment.severity === "medium").length,
            low: comments.filter((comment) => comment.severity === "low").length,
          };
          const categories = Array.from(
            new Set(
              comments
                .map((comment: { category?: string }) => comment.category)
                .filter((category): category is string => typeof category === "string"),
            ),
          );

          return [
            review.prNumber,
            {
              prNumber: review.prNumber,
              status: review.status,
              summary: review.summary,
              riskScore: review.riskScore,
              severityCounts,
              categories,
              createdAt: review.createdAt,
            },
          ];
        }),
      );

      return pullRequests.map((pullRequest) => ({
        id: pullRequest.id,
        number: pullRequest.number,
        title: pullRequest.title,
        state: pullRequest.state,
        draft: pullRequest.draft,
        htmlUrl: pullRequest.html_url,
        author: {
          login: pullRequest.user.login,
          avatarUrl: pullRequest.user.avatar_url,
        },
        headRef: pullRequest.head.ref,
        baseRef: pullRequest.base.ref,
        additions: pullRequest.additions,
        deletions: pullRequest.deletions,
        changedFiles: pullRequest.changed_files,
        createdAt: pullRequest.created_at,
        updatedAt: pullRequest.updated_at,
        mergedAt: pullRequest.merged_at,
        review: reviewMap.get(pullRequest.number) ?? null,
      }));
    }),

  get: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
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

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const pullRequest = await fetchPullRequest(
        accessToken,
        owner,
        repo,
        input.prNumber,
      );

      const existingReview = await ctx.db.review.findFirst({
        where: {
          repositoryId: repository.id,
          prNumber: pullRequest.number,
        },
        orderBy: { createdAt: "desc" },
      });

      let isAdmin = false;
      if (repository.userId === ctx.user.id) {
        isAdmin = true;
      } else if (repository.teamId) {
        const membership = await ctx.db.teamMember.findUnique({
          where: {
            teamId_userId: { teamId: repository.teamId, userId: ctx.user.id },
          },
        });

        if (membership && (membership.role === "ADMIN" || membership.role === "OWNER")) {
          isAdmin = true;
        }
      }

      return {
        id: pullRequest.id,
        number: pullRequest.number,
        title: pullRequest.title,
        state: pullRequest.state,
        draft: pullRequest.draft,
        htmlUrl: pullRequest.html_url,
        author: {
          login: pullRequest.user.login,
          avatarUrl: pullRequest.user.avatar_url,
        },
        headRef: pullRequest.head.ref,
        headSha: pullRequest.head.sha,
        baseRef: pullRequest.base.ref,
        additions: pullRequest.additions,
        deletions: pullRequest.deletions,
        changedFiles: pullRequest.changed_files,
        createdAt: pullRequest.created_at,
        updatedAt: pullRequest.updated_at,
        mergedAt: pullRequest.merged_at,
        review: existingReview,
        isAdmin,
      };
    }),

  files: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
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

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const files = await fetchPullRequestFiles(
        accessToken,
        owner,
        repo,
        input.prNumber,
      );

      return files.map((file) => ({
        sha: file.sha,
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previousFilename: file.previous_filename,
      }));
    }),
});
