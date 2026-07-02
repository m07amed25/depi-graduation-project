/**
 * Security API Router
 * Handles security scanning, vulnerability management, and CVE lookups
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { securityScanner } from "@/server/services/security/security-scanner";
import { nvdScanner } from "@/server/services/security/nvd-scanner";
import { getAccessibleRepository } from "@/lib/repository";
import { getGitHubAccessToken } from "@/server/services/github";
import { Octokit } from "octokit";

export const securityRouter = createTRPCRouter({
  /**
   * Get security issues for a specific review
   */
  getReviewSecurityIssues: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this review
      const review = await ctx.db.review.findUnique({
        where: { id: input.reviewId },
        include: {
          repository: true,
          securityIssues: {
            orderBy: [
              { severity: "asc" },
              { createdAt: "desc" },
            ],
          },
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Check access
      if (review.userId !== ctx.user.id && review.repository.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this review",
        });
      }

      return review.securityIssues;
    }),

  /**
   * Get security statistics for a repository
   */
  getRepositorySecurityStats: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      await getAccessibleRepository(ctx.db, ctx.user.id, input.repositoryId);
      return securityScanner.getRepositorySecurityStats(input.repositoryId);
    }),

  /**
   * Mark a security issue as false positive
   */
  markFalsePositive: protectedProcedure
    .input(
      z.object({
        issueId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access
      const issue = await ctx.db.securityIssue.findUnique({
        where: { id: input.issueId },
        include: {
          review: {
            include: {
              repository: true,
            },
          },
        },
      });

      if (!issue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Security issue not found",
        });
      }

      if (
        issue.review.userId !== ctx.user.id &&
        issue.review.repository.userId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this issue",
        });
      }

      await securityScanner.markFalsePositive(input.issueId, ctx.user.id);

      return { success: true };
    }),

  /**
   * Resolve a security issue
   */
  resolveIssue: protectedProcedure
    .input(
      z.object({
        issueId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access
      const issue = await ctx.db.securityIssue.findUnique({
        where: { id: input.issueId },
        include: {
          review: {
            include: {
              repository: true,
            },
          },
        },
      });

      if (!issue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Security issue not found",
        });
      }

      if (
        issue.review.userId !== ctx.user.id &&
        issue.review.repository.userId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this issue",
        });
      }

      await securityScanner.resolveIssue(input.issueId, ctx.user.id);

      return { success: true };
    }),

  /**
   * Reopen a resolved security issue
   */
  reopenIssue: protectedProcedure
    .input(
      z.object({
        issueId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access
      const issue = await ctx.db.securityIssue.findUnique({
        where: { id: input.issueId },
        include: {
          review: {
            include: {
              repository: true,
            },
          },
        },
      });

      if (!issue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Security issue not found",
        });
      }

      if (
        issue.review.userId !== ctx.user.id &&
        issue.review.repository.userId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this issue",
        });
      }

      await ctx.db.securityIssue.update({
        where: { id: input.issueId },
        data: {
          resolved: false,
          resolvedAt: null,
          resolvedBy: null,
        },
      });

      return { success: true };
    }),

  /**
   * Manually trigger security scan on a PR
   */
  scanPullRequest: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
        reviewId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await getAccessibleRepository(
        ctx.db,
        ctx.user.id,
        input.repositoryId
      );

      const accessToken = await getGitHubAccessToken(repository.userId);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub account not connected",
        });
      }

      const octokit = new Octokit({ auth: accessToken });
      const [owner, repo] = repository.fullName.split("/");

      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      // Get PR details
      const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: input.prNumber,
      });

      // Get changed files
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: input.prNumber,
      });

      // Create or get review
      let reviewId = input.reviewId;
      if (!reviewId) {
        const review = await ctx.db.review.create({
          data: {
            repositoryId: input.repositoryId,
            userId: ctx.user.id,
            prNumber: input.prNumber,
            prTitle: pr.title,
            prUrl: pr.html_url,
            status: "PROCESSING",
          },
        });
        reviewId = review.id;
      }

      // Run security scan
      const scanResult = await securityScanner.scanPullRequest({
        reviewId,
        repositoryFullName: repository.fullName,
        prNumber: input.prNumber,
        changedFiles: files.map((f: { filename: string; patch?: string; additions: number; deletions: number; status: string }) => ({
          filename: f.filename,
          patch: f.patch,
          additions: f.additions,
          deletions: f.deletions,
          status: f.status,
        })),
      });

      return {
        reviewId,
        ...scanResult,
      };
    }),

  /**
   * Search CVEs using NVD
   */
  searchCVEs: protectedProcedure
    .input(
      z.object({
        keyword: z.string().min(2),
      })
    )
    .query(async ({ input }) => {
      return nvdScanner.searchCVEs(input.keyword);
    }),

  /**
   * Get CVE details
   */
  getCVEDetails: protectedProcedure
    .input(
      z.object({
        cveId: z.string().regex(/^CVE-\d{4}-\d+$/),
      })
    )
    .query(async ({ input }) => {
      return nvdScanner.getCVEDetails(input.cveId);
    }),

  /**
   * Get recent CVEs
   */
  getRecentCVEs: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ input }) => {
      return nvdScanner.getRecentCVEs(input.days);
    }),

  /**
   * Check dependencies for vulnerabilities
   */
  checkDependencies: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await getAccessibleRepository(
        ctx.db,
        ctx.user.id,
        input.repositoryId
      );

      const accessToken = await getGitHubAccessToken(repository.userId);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub account not connected",
        });
      }

      // This would fetch package.json and run dependency checks
      // For now, return a placeholder
      return {
        success: true,
        message: "Dependency check initiated",
      };
    }),

  /**
   * Get security dashboard data (admin only)
   */
  getSecurityDashboard: adminProcedure.query(async ({ ctx }) => {
    const totalIssues = await ctx.db.securityIssue.count();
    const unresolvedIssues = await ctx.db.securityIssue.count({
      where: { resolved: false },
    });
    
    const issuesBySeverity = await ctx.db.securityIssue.groupBy({
      by: ["severity"],
      where: { resolved: false },
      _count: true,
    });

    const issuesByType = await ctx.db.securityIssue.groupBy({
      by: ["type"],
      where: { resolved: false },
      _count: true,
    });

    const recentIssues = await ctx.db.securityIssue.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        review: {
          include: {
            repository: true,
          },
        },
      },
    });

    return {
      totalIssues,
      unresolvedIssues,
      resolvedIssues: totalIssues - unresolvedIssues,
      issuesBySeverity: issuesBySeverity.reduce(
        (acc, item) => {
          acc[item.severity] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      issuesByType: issuesByType.reduce(
        (acc, item) => {
          acc[item.type] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentIssues,
    };
  }),
});
