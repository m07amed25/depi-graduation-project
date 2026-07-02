import {
  sendReviewCompletedEmail,
  getAppUrl,
  REVIEW_STATUS_CONFIG,
} from "../index";
import type { PrismaClient } from "@/server/db/client";

const ALLOWED_DOMAINS = [
  "dev-review-ai-silk.vercel.app",
  "localhost",
  "localhost:3000",
];

function isValidCUID(value: string): boolean {
  // CUID pattern: c + 24 alphanumeric characters
  const cuidRegex = /^c[a-z0-9]{24}$/i;
  return cuidRegex.test(value);
}

function buildReviewUrl(
  appUrl: string,
  repositoryId: string,
  prNumber: number,
): string {
  if (!isValidCUID(repositoryId)) {
    throw new Error(`Invalid repository ID format: ${repositoryId}`);
  }

  const url = new URL(
    `${appUrl}/repo/${encodeURIComponent(repositoryId)}/pr/${prNumber}`,
  );

  if (
    !ALLOWED_DOMAINS.includes(url.hostname) &&
    !url.hostname.endsWith(".localhost")
  ) {
    throw new Error(`Invalid URL domain: ${url.hostname}`);
  }

  url.searchParams.set("utm_source", "email");
  url.searchParams.set("utm_medium", "notification");

  return url.toString();
}

interface SendReviewCompletedEmailParams {
  db: PrismaClient;
  reviewId: string;
}

export async function sendReviewCompletedEmailNotification({
  db,
  reviewId,
}: SendReviewCompletedEmailParams): Promise<void> {
  try {
    // Get the review with related data
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        repository: {
          select: { fullName: true, name: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!review) {
      console.warn(
        `⚠️  Cannot send review completed email: review ${reviewId} not found`,
      );
      return;
    }

    if (!review.user?.email) {
      console.warn(
        `⚠️  Cannot send review completed email: reviewer has no email`,
      );
      return;
    }

    const reviewStatus = determineReviewStatus(review.status);

    const comments = review.comments as Array<{ issues?: unknown[] }> | null;
    const issuesFound =
      comments?.reduce((acc, c) => acc + (c.issues?.length ?? 0), 0) ?? 0;

    const appUrl = getAppUrl();

    const viewReviewUrl = buildReviewUrl(appUrl, review.repositoryId, review.prNumber);

    const result = await sendReviewCompletedEmail({
      to: review.user.email,
      recipientName: review.user.name || "Developer",
      reviewerName: review.user.name || "Reviewer",
      reviewerEmail: review.user.email,
      prTitle: review.prTitle,
      prNumber: review.prNumber,
      prUrl: review.prUrl,
      repositoryName: review.repository.name,
      repositoryFullName: review.repository.fullName,
      reviewStatus,
      summary: review.summary || undefined,
      issuesFound,
      viewReviewUrl,
    });

    if (!result.success) {
      console.error(
        `❌ Failed to send review completed email to ${review.user.email}:`,
        result.error,
      );
    }
  } catch (error) {
    console.error("❌ Error in sendReviewCompletedEmailNotification:", error);
  }
}

function determineReviewStatus(status: string) {
  // Map Prisma ReviewStatus to our email status
  switch (status) {
    case "COMPLETED":
      // For completed, we default to COMMENTED - you might want to determine
      // APPROVED vs CHANGES_REQUESTED based on quality metrics or comments
      return REVIEW_STATUS_CONFIG.COMMENTED;
    case "FAILED":
      return REVIEW_STATUS_CONFIG.COMMENTED;
    case "PENDING":
    case "PROCESSING":
      // These shouldn't trigger completion emails
      return REVIEW_STATUS_CONFIG.COMMENTED;
    default:
      return REVIEW_STATUS_CONFIG.COMMENTED;
  }
}

interface SendReviewCompletedEmailExplicitParams {
  to: string;
  recipientName: string;
  reviewerName: string;
  reviewerEmail: string;
  prTitle: string;
  prNumber: number;
  prUrl: string;
  repositoryName: string;
  repositoryFullName: string;
  repositoryId: string;
  reviewStatus: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED";
  summary?: string;
  issuesFound?: number;
}

export async function sendReviewCompletedEmailExplicit({
  to,
  recipientName,
  reviewerName,
  reviewerEmail,
  prTitle,
  prNumber,
  prUrl,
  repositoryName,
  repositoryFullName,
  repositoryId,
  reviewStatus,
  summary,
  issuesFound = 0,
}: SendReviewCompletedEmailExplicitParams): Promise<void> {
  try {
    const appUrl = getAppUrl();

    // Use safe URL construction to prevent injection attacks
    const viewReviewUrl = buildReviewUrl(appUrl, repositoryId, prNumber);

    const statusConfig =
      REVIEW_STATUS_CONFIG[reviewStatus] || REVIEW_STATUS_CONFIG.COMMENTED;

    const result = await sendReviewCompletedEmail({
      to,
      recipientName,
      reviewerName,
      reviewerEmail,
      prTitle,
      prNumber,
      prUrl,
      repositoryName,
      repositoryFullName,
      reviewStatus: statusConfig,
      summary,
      issuesFound,
      viewReviewUrl,
    });

    if (!result.success) {
      console.error(
        `❌ Failed to send review completed email to ${to}:`,
        result.error,
      );
    }
  } catch (error) {
    console.error("❌ Error in sendReviewCompletedEmailExplicit:", error);
  }
}
