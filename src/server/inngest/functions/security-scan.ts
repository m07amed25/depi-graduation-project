/**
 * Security Scanning Inngest Function
 * Performs comprehensive security scanning on pull requests
 */

import { inngest } from "../client";
import { db } from "@/server/db";
import { securityScanner } from "@/server/services/security/security-scanner";
import {
  fetchPullRequestFiles,
  getGitHubAccessToken,
} from "@/server/services/github";
import { Octokit } from "octokit";
import { sendSecurityAlertEmail } from "@/server/email";
import { getAppUrl } from "@/server/email/transporter";

export type SecurityScanEvent = {
  name: "security/scan.requested";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
  };
};

export const securityScan = inngest.createFunction(
  {
    id: "security-scan",
    retries: 2,
    triggers: [{ event: "security/scan.requested" }],
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
      console.error(`Security scan failed for review ${reviewId}:`, error);
      // Optionally mark the review with an error
      if (reviewId) {
        await db.review.update({
          where: { id: reviewId },
          data: {
            error: `Security scan failed: ${error?.message || "Unknown error"}`,
          },
        });
      }
    },
  },
  async ({ event, step }) => {
    const { reviewId, repositoryId, prNumber, userId } = event.data;

    // Get repository details
    const repository = await step.run("fetch-repository", async () => {
      return db.repository.findUnique({
        where: { id: repositoryId },
        include: {
          user: true,
        },
      });
    });

    if (!repository) {
      throw new Error(`Repository not found: ${repositoryId}`);
    }

    // Get GitHub access token
    const accessToken = await step.run("get-access-token", async () => {
      return getGitHubAccessToken(repository.userId);
    });

    if (!accessToken) {
      throw new Error("GitHub access token not available");
    }

    // Fetch PR files
    const files = await step.run("fetch-pr-files", async () => {
      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new Error("Invalid repository name format");
      }

      return fetchPullRequestFiles(accessToken, owner, repo, prNumber);
    });

    // Check if package.json or lock files were modified
    const hasPackageChanges = files.some(
      (file) =>
        file.filename === "package.json" ||
        file.filename === "package-lock.json" ||
        file.filename === "yarn.lock" ||
        file.filename === "pnpm-lock.yaml"
    );

    // Fetch package.json content if it exists
    let dependencies = undefined;
    if (hasPackageChanges) {
      dependencies = await step.run("fetch-dependencies", async () => {
        try {
          const octokit = new Octokit({ auth: accessToken });
          const [owner, repo] = repository.fullName.split("/");

          if (!owner || !repo) {
            return undefined;
          }

          const { data: packageJson } = await octokit.request(
            "GET /repos/{owner}/{repo}/contents/{path}",
            { owner, repo, path: "package.json" }
          );

          if ("content" in packageJson && packageJson.content) {
            const content = Buffer.from(
              packageJson.content,
              "base64"
            ).toString("utf-8");
            return {
              package_json: JSON.parse(content),
            };
          }
        } catch (error) {
          console.error("Failed to fetch package.json:", error);
        }
        return undefined;
      });
    }

    // Run security scan
    const scanResult = await step.run("run-security-scan", async () => {
      return securityScanner.scanPullRequest({
        reviewId,
        repositoryFullName: repository.fullName,
        prNumber,
        changedFiles: files.map((f) => ({
          filename: f.filename,
          patch: f.patch,
          additions: f.additions,
          deletions: f.deletions,
          status: f.status,
        })),
        dependencies: (dependencies ?? undefined) as
          | { package_json?: Record<string, unknown> }
          | undefined,
      });
    });

    // Update review with security metrics
    await step.run("update-review-metrics", async () => {
      const currentReview = await db.review.findUnique({
        where: { id: reviewId },
        select: { qualityMetrics: true, riskScore: true },
      });

      // Calculate risk score based on security issues
      const securityRiskScore = Math.min(
        100,
        scanResult.criticalCount * 25 +
          scanResult.highCount * 15 +
          scanResult.mediumCount * 5 +
          scanResult.lowCount
      );

      // Merge with existing risk score if available
      const existingRiskScore =
        typeof currentReview?.riskScore === "number"
          ? currentReview.riskScore
          : 0;
      const newRiskScore = Math.max(existingRiskScore, securityRiskScore);

      // Update quality metrics
      const existingMetrics =
        (currentReview?.qualityMetrics as Record<string, unknown>) || {};
      const updatedMetrics = {
        ...existingMetrics,
        security: {
          totalIssues: scanResult.issueCount,
          criticalCount: scanResult.criticalCount,
          highCount: scanResult.highCount,
          mediumCount: scanResult.mediumCount,
          lowCount: scanResult.lowCount,
          scannedAt: new Date().toISOString(),
        },
      };

      await db.review.update({
        where: { id: reviewId },
        data: {
          riskScore: newRiskScore,
          qualityMetrics: updatedMetrics,
        },
      });
    });

    // Send notification if critical/high issues found
    if (scanResult.criticalCount > 0 || scanResult.highCount > 0) {
      await step.run("send-security-alert", async () => {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (user?.email) {
          const appUrl = getAppUrl();
          const viewReviewUrl = `${appUrl}/repo/${encodeURIComponent(repositoryId)}/pr/${prNumber}`;

          await sendSecurityAlertEmail({
            to: user.email,
            recipientName: user.name ?? "",
            repositoryName: repository.name,
            repositoryFullName: repository.fullName,
            prNumber,
            criticalCount: scanResult.criticalCount,
            highCount: scanResult.highCount,
            viewReviewUrl,
          });
        }
      });
    }

    return {
      success: true,
      scanResult,
    };
  }
);
