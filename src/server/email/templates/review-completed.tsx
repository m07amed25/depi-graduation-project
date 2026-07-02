import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { ReviewCompletionEmailParams } from "@/types/email";

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export interface ReviewCompletedEmailProps {
  params: ReviewCompletionEmailParams;
}

/**
 * Enhanced Review Completed Email Template
 * Sent when a code review is completed
 * Includes detailed review results, metrics, and actionable insights
 */
export function ReviewCompletedEmail({ params }: ReviewCompletedEmailProps) {
  const {
    recipientName,
    reviewerName,
    prTitle,
    prNumber,
    prUrl,
    repositoryName,
    repositoryFullName,
    reviewStatus,
    summary,
    issuesFound = 0,
    viewReviewUrl,
  } = params;

  const statusLabel = reviewStatus.label;
  const statusColor = reviewStatus.color;
  const previewText = `Review completed for ${repositoryName} PR #${prNumber}`;

  // Determine emoji and message based on status
  const statusConfig = {
    APPROVED: {
      emoji: "🎉",
      message: "Great news! Your code has been approved and is ready to merge.",
      bgColor: "#ecfdf5",
      borderColor: "#d1fae5",
      textColor: "#065f46",
    },
    CHANGES_REQUESTED: {
      emoji: "🔄",
      message: "Please address the feedback before merging your changes.",
      bgColor: "#fffbeb",
      borderColor: "#fef3c7",
      textColor: "#92400e",
    },
    COMMENTED: {
      emoji: "💬",
      message: "Check out the review comments for insights and suggestions.",
      bgColor: "#eff6ff",
      borderColor: "#dbeafe",
      textColor: "#1e40af",
    },
  };

  const config = statusConfig[reviewStatus.status] || statusConfig.COMMENTED;

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-[560px] rounded-lg bg-white p-8 shadow-md">
            {/* Logo Section */}
            <Section className="mb-6 text-center">
              <Img
                src={`${baseUrl}/file.svg`}
                width="56"
                height="56"
                alt="Code Catch"
                className="mx-auto"
              />
            </Section>

            {/* Header */}
            <Heading className="mb-2 text-center text-2xl font-bold text-gray-900">
              Code Review Complete {config.emoji}
            </Heading>

            <Text className="mb-6 text-center text-gray-500">
              Your pull request has been reviewed
            </Text>

            {/* Greeting */}
            <Text className="mb-4 text-base text-gray-700">
              Hi {recipientName || "there"},
            </Text>

            {/* Main Content */}
            <Text className="mb-4 text-base leading-6 text-gray-700">
              <strong>{reviewerName}</strong> has completed a review on your
              pull request.
            </Text>

            {/* PR Details Card */}
            <Section className="mb-6 rounded-lg border border-gray-200 p-5">
              <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                {repositoryFullName}
              </Text>
              <Text className="mb-3 text-xl font-bold text-gray-900">
                {prTitle}
              </Text>
              <Text className="mb-0 text-sm text-gray-600">
                Pull Request #{prNumber}
              </Text>
            </Section>

            {/* Status Banner */}
            <Section
              className="mb-6 rounded-lg p-4"
              style={{
                backgroundColor: config.bgColor,
                borderLeft: `4px solid ${statusColor}`,
              }}
            >
              <Text
                className="mb-1 text-base font-bold"
                style={{ color: config.textColor }}
              >
                Status: {statusLabel}
              </Text>
              <Text
                className="mb-0 text-sm"
                style={{ color: config.textColor }}
              >
                {config.message}
              </Text>
            </Section>

            {/* Issues Summary */}
            {issuesFound > 0 && (
              <Section className="mb-6 rounded-lg bg-amber-50 p-5 border border-amber-200">
                <Text className="mb-2 text-base font-semibold text-amber-800">
                  🔍 Issues Identified: {issuesFound}
                </Text>
                <Text className="mb-3 text-sm text-amber-700">
                  The reviewer has flagged {issuesFound} issue
                  {issuesFound !== 1 ? "s" : ""} that may need your attention.
                </Text>
                <Button
                  className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white no-underline"
                  href={viewReviewUrl}
                >
                  View Detailed Review
                </Button>
              </Section>
            )}

            {/* Summary Section */}
            {summary && (
              <Section className="mb-6 rounded-lg bg-gray-50 p-5">
                <Text className="mb-3 text-base font-semibold text-gray-900">
                  📝 Review Summary
                </Text>
                <Text className="mb-0 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {summary.length > 500
                    ? summary.substring(0, 500) + "..."
                    : summary}
                </Text>
                {summary.length > 500 && (
                  <Text className="mt-2 text-sm text-blue-600">
                    <Link href={viewReviewUrl}>Read full summary →</Link>
                  </Text>
                )}
              </Section>
            )}

            {/* Key Metrics (if available) */}
            <Section className="mb-6 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-5">
              <Text className="mb-4 text-base font-semibold text-gray-900">
                📊 Review Details
              </Text>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text className="mb-0 text-xs text-gray-500">Reviewer</Text>
                  <Text className="mb-0 text-sm font-medium text-gray-900">
                    {reviewerName}
                  </Text>
                </div>
                <div>
                  <Text className="mb-0 text-xs text-gray-500">Repository</Text>
                  <Text className="mb-0 text-sm font-medium text-gray-900">
                    {repositoryName}
                  </Text>
                </div>
                <div>
                  <Text className="mb-0 text-xs text-gray-500">PR Number</Text>
                  <Text className="mb-0 text-sm font-medium text-gray-900">
                    #{prNumber}
                  </Text>
                </div>
                <div>
                  <Text className="mb-0 text-xs text-gray-500">
                    Issues Found
                  </Text>
                  <Text className="mb-0 text-sm font-medium text-gray-900">
                    {issuesFound}
                  </Text>
                </div>
              </div>
            </Section>

            {/* CTA Buttons */}
            <Section className="mb-6 text-center">
              <Button
                className="mr-3 rounded-md bg-gray-900 px-6 py-3 text-base font-semibold text-white no-underline"
                href={prUrl}
              >
                View on GitHub
              </Button>
              <Button
                className="rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 no-underline"
                href={viewReviewUrl}
              >
                View Full Review
              </Button>
            </Section>

            {/* Next Steps */}
            <Section className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-5">
              <Text className="mb-3 text-base font-semibold text-blue-900">
                📌 Next Steps
              </Text>
              {reviewStatus.status === "APPROVED" && (
                <>
                  <Text className="mb-2 text-sm text-blue-800">
                    ✓ Your code looks good! You can proceed to merge this PR.
                  </Text>
                  <Text className="mb-0 text-sm text-blue-800">
                    ✓ Remember to delete the branch after merging.
                  </Text>
                </>
              )}
              {reviewStatus.status === "CHANGES_REQUESTED" && (
                <>
                  <Text className="mb-2 text-sm text-blue-800">
                    1. Review the feedback and make necessary changes
                  </Text>
                  <Text className="mb-2 text-sm text-blue-800">
                    2. Push updates to your branch
                  </Text>
                  <Text className="mb-0 text-sm text-blue-800">
                    3. The reviewer will be notified of your changes
                  </Text>
                </>
              )}
              {reviewStatus.status === "COMMENTED" && (
                <>
                  <Text className="mb-2 text-sm text-blue-800">
                    1. Review the comments at your convenience
                  </Text>
                  <Text className="mb-2 text-sm text-blue-800">
                    2. Respond to questions or start discussions
                  </Text>
                  <Text className="mb-0 text-sm text-blue-800">
                    3. Address any suggestions you find helpful
                  </Text>
                </>
              )}
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* Footer */}
            <Text className="text-sm text-gray-500">
              You&apos;re receiving this email because you&apos;re the author of
              this pull request or have enabled notifications for{" "}
              <strong>{repositoryFullName}</strong>.
            </Text>

            <Text className="mt-4 text-sm text-gray-500">
              <Link
                href={`${baseUrl}/settings`}
                className="text-gray-700 underline"
              >
                Manage email preferences
              </Link>{" "}
              to control what notifications you receive.
            </Text>
          </Container>

          {/* Footer Links */}
          <Container className="mx-auto max-w-[560px] py-4 text-center">
            <Text className="text-xs text-gray-400">
              © 2024 Code Catch. All rights reserved.
            </Text>
            <Text className="mt-1 text-xs text-gray-400">
              <Link href={baseUrl} className="text-gray-500 underline">
                Privacy Policy
              </Link>{" "}
              •{" "}
              <Link
                href={`${baseUrl}/settings`}
                className="text-gray-500 underline"
              >
                Email Settings
              </Link>{" "}
              •{" "}
              <Link
                href={`${baseUrl}/docs`}
                className="text-gray-500 underline"
              >
                Documentation
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

/**
 * Generate the HTML content for the review completed email
 */
export async function renderReviewCompletedEmail(
  params: ReviewCompletionEmailParams,
): Promise<string> {
  return render(<ReviewCompletedEmail params={params} />);
}
