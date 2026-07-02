import { hasFeature } from "@/lib/capabilities";
import { generateRepositoryRecommendations } from "@/features/settings/server/automation-router";
import { db } from "@/server/db";
import { inngest } from "@/server/inngest/client";
import {
  dismissGitHubReview,
  getGitHubAccessToken,
  postCommitStatus,
  submitPullRequestReview,
} from "@/server/services/github";
import { mapFindingsToReviewPayload } from "./post-review-to-github-helpers";

export type { ReviewPayloadOptions } from "./post-review-to-github-helpers";
export { mapFindingsToReviewPayload } from "./post-review-to-github-helpers";

type ReviewCompletedEvent = {
  name: "review/pr.completed";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
    commitSha: string;
    status: "COMPLETED" | "FAILED";
    hasHighSeverity: boolean;
  };
};

type PostReviewStep = {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<unknown>;
};

type PostReviewDeps = {
  dbClient: typeof db;
  getGitHubAccessTokenFn: typeof getGitHubAccessToken;
  dismissGitHubReviewFn: typeof dismissGitHubReview;
  submitPullRequestReviewFn: typeof submitPullRequestReview;
  postCommitStatusFn: typeof postCommitStatus;
  generateRepositoryRecommendationsFn: typeof generateRepositoryRecommendations;
};

const defaultDeps: PostReviewDeps = {
  dbClient: db,
  getGitHubAccessTokenFn: getGitHubAccessToken,
  dismissGitHubReviewFn: dismissGitHubReview,
  submitPullRequestReviewFn: submitPullRequestReview,
  postCommitStatusFn: postCommitStatus,
  generateRepositoryRecommendationsFn: generateRepositoryRecommendations,
};

export async function runPostReviewToGitHub(
  completedEvent: ReviewCompletedEvent,
  step: PostReviewStep,
  deps: PostReviewDeps = defaultDeps,
) {
  const {
    dbClient,
    getGitHubAccessTokenFn,
    dismissGitHubReviewFn,
    submitPullRequestReviewFn,
    postCommitStatusFn,
    generateRepositoryRecommendationsFn,
  } = deps;

  const reviewData = (await step.run("get-review", async () => {
    const review = await dbClient.review.findUnique({
      where: { id: completedEvent.data.reviewId },
      include: {
        repository: {
          include: { webhookConfig: { select: { scoreThreshold: true } } },
        },
        user: true,
      },
    });

    if (!review) {
      return null;
    }

    const accessToken = await getGitHubAccessTokenFn(review.repository.userId);
    return { review, accessToken };
  })) as {
    review: {
      id: string;
      repositoryId: string;
      prNumber: number;
      prTitle: string;
      summary: string | null;
      riskScore: number | null;
      comments: unknown;
      qualityMetrics: unknown;
      repository: {
        fullName: string;
        userId: string;
        webhookConfig: { scoreThreshold: number | null } | null;
      };
      user: { id: string };
    };
    accessToken: string | null;
  } | null;

  if (!reviewData || !reviewData.accessToken) {
    return { success: false, reason: "Missing review or token" };
  }

  const { review, accessToken } = reviewData;

  if (completedEvent.data.status === "FAILED") {
    await step.run("update-status-check-failed", async () => {
      await postCommitStatusFn(
        accessToken,
        review.repository.fullName,
        completedEvent.data.commitSha,
        "error",
        review.repositoryId,
        review.prNumber,
        "Code Catch — review processing failed",
      );

      await dbClient.gitHubStatusCheck.upsert({
        where: { reviewId: review.id },
        create: {
          reviewId: review.id,
          commitSha: completedEvent.data.commitSha,
          state: "ERROR",
        },
        update: {
          commitSha: completedEvent.data.commitSha,
          state: "ERROR",
        },
      });
    });
    return { success: true, skippedDueToFailure: true };
  }

  await step.run("dismiss-previous-review", async () => {
    const previous = await dbClient.gitHubComment.findFirst({
      where: {
        repositoryId: review.repositoryId,
        prNumber: review.prNumber,
        reviewId: { not: review.id },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!previous) {
      return;
    }

    try {
      await dismissGitHubReviewFn(
        accessToken,
        review.repository.fullName,
        review.prNumber,
        Number(previous.githubReviewId),
        `Superseded by a new Code Catch review after commit ${completedEvent.data.commitSha}`,
      );
    } catch (error) {
      console.warn(
        `[dismiss-previous-review] Could not dismiss review ${previous.githubReviewId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  });

  await step.run("post-pr-review", async () => {
    const canInline = await hasFeature(
      dbClient,
      completedEvent.data.userId,
      "pr_inline_comments",
    );
    const payload = mapFindingsToReviewPayload(
      review.comments,
      review.repositoryId,
      review.id,
      {
        prTitle: review.prTitle,
        commitSha: completedEvent.data.commitSha,
        prNumber: review.prNumber,
        summary: review.summary,
        riskScore: review.riskScore,
        qualityMetrics: review.qualityMetrics,
        overallStatus: completedEvent.data.status,
        hasHighSeverity: completedEvent.data.hasHighSeverity,
        includeInline: canInline,
      },
    );

    const githubReviewId = await submitPullRequestReviewFn(
      accessToken,
      review.repository.fullName,
      completedEvent.data.prNumber,
      completedEvent.data.commitSha,
      payload.body,
      payload.inlineComments,
    );

    await dbClient.gitHubComment.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        githubReviewId: BigInt(githubReviewId),
        prNumber: completedEvent.data.prNumber,
        repositoryId: review.repositoryId,
        commitSha: completedEvent.data.commitSha,
        findingCount: payload.inlineComments.length,
      },
      update: {
        githubReviewId: BigInt(githubReviewId),
        commitSha: completedEvent.data.commitSha,
        findingCount: payload.inlineComments.length,
      },
    });
  });

  await step.run("update-status-check", async () => {
    const scoreThreshold = review.repository.webhookConfig?.scoreThreshold;
    const reviewFails =
      scoreThreshold !== null && scoreThreshold !== undefined
        ? (review.riskScore ?? 0) >= scoreThreshold
        : completedEvent.data.hasHighSeverity;

    const state: "success" | "failure" | "error" =
      completedEvent.data.status === "FAILED"
        ? "error"
        : reviewFails
          ? "failure"
          : "success";

    const description =
      state === "success"
        ? scoreThreshold !== null && scoreThreshold !== undefined
          ? `Code Catch — risk score ${review.riskScore ?? 0}/100 (threshold ${scoreThreshold})`
          : "Code Catch — no critical issues"
        : state === "failure"
          ? scoreThreshold !== null && scoreThreshold !== undefined
            ? `Code Catch — risk score ${review.riskScore ?? 0}/100 exceeds threshold ${scoreThreshold}`
            : "Code Catch — critical issues found"
          : "Code Catch — review processing failed";

    await postCommitStatusFn(
      accessToken,
      review.repository.fullName,
      completedEvent.data.commitSha,
      state,
      review.repositoryId,
      review.prNumber,
      description,
    );

    await dbClient.gitHubStatusCheck.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        commitSha: completedEvent.data.commitSha,
        state:
          state === "success"
            ? "SUCCESS"
            : state === "failure"
              ? "FAILURE"
              : "ERROR",
      },
      update: {
        commitSha: completedEvent.data.commitSha,
        state:
          state === "success"
            ? "SUCCESS"
            : state === "failure"
              ? "FAILURE"
              : "ERROR",
      },
    });
  });

  await step.run("generate-recommendations", async () => {
    const completedCount = await dbClient.review.count({
      where: { repositoryId: review.repositoryId, status: "COMPLETED" },
    });

    if (completedCount < 3) {
      return;
    }

    await generateRepositoryRecommendationsFn(dbClient, review.repositoryId);
  });

  return { success: true };
}

export const postReviewToGitHub = inngest.createFunction(
  {
    id: "post-review-to-github",
    retries: 3,
    triggers: [{ event: "review/pr.completed" }],
  },
  async ({ event, step }) =>
    runPostReviewToGitHub(
      event as unknown as ReviewCompletedEvent,
      step,
      defaultDeps,
    ),
);
