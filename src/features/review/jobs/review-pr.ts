import { db } from "@/server/db";
import { sendReviewCompletedEmailNotification } from "@/server/email/integrations/review";
import { inngest } from "@/server/inngest/client";
import { reviewCode } from "@/server/services/ai";
import type { CustomRule, ReviewPreferences } from "@/server/services/ai";
import { matchTriggerRules } from "@/server/services/diagram-generator";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  getGitHubAccessToken,
} from "@/server/services/github";

export type ReviewPREvent = {
  name: "review/pr.requested";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
    preferences?: ReviewPreferences;
  };
};

export const reviewPR = inngest.createFunction(
  {
    id: "review-pr",
    retries: 2,
    triggers: [{ event: "review/pr.requested" }],
    onFailure: async ({
      event: {
        data: {
          event: {
            data: { reviewId },
          },
        },
      },
      error,
    }) => {
      if (reviewId) {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error:
              error?.message ??
              "An unexpected error occurred during the review",
          },
        });
      }
    },
  },
  async ({ event, step }) => {
    const { reviewId, repositoryId, prNumber, userId, preferences } =
      event.data;

    await step.run("update-status-processing", async () => {
      await db.review.update({
        where: { id: reviewId },
        data: { status: "PROCESSING" },
      });
    });

    const repository = await step.run("get-repository", async () => {
      return db.repository.findUnique({
        where: { id: repositoryId },
      });
    });

    if (!repository) {
      await step.run("mark-failed-no-repo", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: { status: "FAILED", error: "No repository found" },
        });
      });
      return { success: false, error: "No repository found" };
    }

    const accessToken = await step.run("get-access-token", async () => {
      return getGitHubAccessToken(userId);
    });

    if (!accessToken) {
      await step.run("mark-failed-no-token", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error: "GitHub access token not found",
          },
        });
      });
      return { success: false, error: "GitHub access token not found" };
    }

    const [owner, repo] = repository.fullName.split("/");
    if (!owner || !repo) {
      await step.run("mark-failed-invalid-repo", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error: "Invalid repository name",
          },
        });
      });
      return { success: false, error: "Invalid repository name" };
    }

    const files = await step.run("fetch-pr-files", async () => {
      return fetchPullRequestFiles(accessToken, owner, repo, prNumber);
    });

    const pr = await step.run("fetch-pr", async () => {
      return fetchPullRequest(accessToken, owner, repo, prNumber);
    });
    const commitSha = pr.head.sha;

    try {
      const activeRules = await step.run("fetch-active-rules", async () => {
        const currentRepository = await db.repository.findUnique({
          where: { id: repositoryId },
          select: { teamId: true, userId: true },
        });

        const teamFilter = currentRepository?.teamId
          ? [{ teamId: currentRepository.teamId }]
          : [];

        const allRules = await db.reviewRule.findMany({
          where: {
            enabled: true,
            OR: [
              { repositoryId },
              ...teamFilter,
              {
                userId: currentRepository?.userId ?? userId,
                repositoryId: null,
                teamId: null,
              },
            ],
          },
        });

        const ruleMap = new Map<string, (typeof allRules)[number]>();
        const sortedRules = [...allRules].sort((left, right) => {
          const priority = (rule: (typeof allRules)[number]) =>
            rule.repositoryId ? 2 : rule.teamId ? 1 : 0;
          return priority(left) - priority(right);
        });
        for (const rule of sortedRules) {
          ruleMap.set(rule.name.toLowerCase(), rule);
        }

        return Array.from(ruleMap.values()) as CustomRule[];
      });

      const reviewResult = await step.run("generate-review", async () => {
        const mergedPreferences: ReviewPreferences = {
          ...preferences,
          customRules: activeRules.length > 0 ? activeRules : undefined,
        };
        const result = await reviewCode(
          pr.title,
          files.map((file) => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            patch: file.patch,
          })),
          mergedPreferences,
        );

        const filteredComments = result.comments.filter(
          (comment) =>
            comment.confidence === null ||
            comment.confidence === undefined ||
            comment.confidence >= 70,
        );

        const severityWeight: Record<string, number> = {
          critical: 30,
          high: 15,
          medium: 7,
          low: 1,
        };
        const computedRisk = Math.min(
          100,
          filteredComments
            .filter(
              (comment) =>
                comment.category !== "style" &&
                comment.category !== "suggestion",
            )
            .reduce(
              (sum, comment) => sum + (severityWeight[comment.severity] ?? 1),
              0,
            ),
        );

        return {
          ...result,
          comments: filteredComments,
          riskScore: computedRisk,
        };
      });

      await step.run("save-review-result", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "COMPLETED",
            summary: reviewResult.summary,
            riskScore: reviewResult.riskScore,
            comments: reviewResult.comments,
            qualityMetrics: reviewResult.qualityMetrics ?? undefined,
          },
        });
      });

      await step.run("trigger-diagram-generation", async () => {
        const changedFilePaths = files.map((file) => file.filename);
        const matchedTypes = matchTriggerRules(changedFilePaths);
        if (matchedTypes.length === 0) {
          return;
        }

        for (const diagramType of matchedTypes) {
          const diagram = await db.diagram.upsert({
            where: { repositoryId_type: { repositoryId, type: diagramType } },
            create: { repositoryId, type: diagramType, status: "PENDING" },
            update: {
              status: "PENDING",
              definition: null,
              nodes: undefined,
              edges: undefined,
              error: null,
              generatedAt: null,
            },
          });

          await inngest.send({
            name: "diagram/generation.requested",
            data: {
              diagramId: diagram.id,
              reviewId,
              repositoryId,
              userId,
              prNumber,
              type: diagramType,
            },
          });
        }
      });

      await step.sendEvent("emit-review-completed", {
        name: "review/pr.completed",
        data: {
          reviewId,
          repositoryId,
          prNumber,
          userId,
          commitSha,
          status: "COMPLETED",
          hasHighSeverity: Array.isArray(reviewResult.comments)
            ? reviewResult.comments.some((comment) => {
                const value = comment as
                  | {
                      severity?: string;
                      severityLevel?: string;
                      text?: string;
                    }
                  | undefined;
                const severity = `${value?.severity ?? value?.severityLevel ?? ""}`.toUpperCase();
                if (severity === "HIGH" || severity === "CRITICAL") {
                  return true;
                }
                return `${value?.text ?? ""}`.toUpperCase().includes(
                  "CRITICAL",
                );
              })
            : false,
        },
      });

      await step.run("send-review-email", async () => {
        await sendReviewCompletedEmailNotification({
          db,
          reviewId,
        });
      });

      return { success: true, reviewId };
    } catch (error) {
      await step.run("mark-failed-error", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred during the review",
          },
        });
      });

      await step.sendEvent("emit-review-failed", {
        name: "review/pr.completed",
        data: {
          reviewId,
          repositoryId,
          prNumber,
          userId,
          commitSha,
          status: "FAILED",
          hasHighSeverity: false,
        },
      });

      return { success: false, error: String(error) };
    }
  },
);
