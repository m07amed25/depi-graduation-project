import { db } from "@/server/db";
import { inngest } from "../client";
import {
  getGitHubAccessToken,
  listOpenPullRequests,
} from "@/server/services/github";
import type { Prisma } from "@/server/db/client";

type ScanCadence = "DAILY" | "WEEKLY";
type ScheduledScanConfigWithRepository = Prisma.ScheduledScanConfigGetPayload<{
  include: { repository: true };
}>;

async function runScheduledScan(
  cadence: ScanCadence,
  step: {
    run: <T>(id: string, fn: () => Promise<T>) => Promise<unknown>;
    sendEvent: (
      id: string,
      payload: { name: string; data: Record<string, unknown> },
    ) => Promise<unknown>;
  },
) {
  const activeConfigs = (await step.run("get-active-configs", async () => {
    return db.scheduledScanConfig.findMany({
      where: { enabled: true, cadence },
      include: { repository: true },
    });
  })) as ScheduledScanConfigWithRepository[];

  const completedRuns: Array<{
    scanRunId: string;
    repositoryId: string;
    userId: string;
    cadence: ScanCadence;
    reviewsQueued: number;
  }> = [];

  for (const config of activeConfigs) {
    await step.run(`scan-repo-${config.repositoryId}`, async () => {
      const running = await db.scheduledScanRun.findFirst({
        where: {
          configId: config.id,
          status: "RUNNING",
        },
      });

      if (running) {
        return;
      }

      const scanRun = await db.scheduledScanRun.create({
        data: {
          configId: config.id,
          status: "RUNNING",
          summary: `Scheduled ${cadence.toLowerCase()} scan started`,
        },
      });

      try {
        const accessToken = await getGitHubAccessToken(
          config.repository.userId,
        );
        if (!accessToken) {
          await db.scheduledScanRun.update({
            where: { id: scanRun.id },
            data: {
              status: "FAILED",
              completedAt: new Date(),
              summary: "Missing GitHub access token for repository owner",
            },
          });
          return;
        }

        const openPrs = await listOpenPullRequests(
          accessToken,
          config.repository.fullName,
        );

        let reviewsQueued = 0;

        for (const pr of openPrs) {
          // Skip PRs that already have a recent COMPLETED review to avoid duplicates.
          // Use the scan cadence to define "recent": 24 h for DAILY, 7 days for WEEKLY.
          const recentWindowMs =
            cadence === "DAILY" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

          const latestReview = await db.review.findFirst({
            where: {
              repositoryId: config.repositoryId,
              prNumber: pr.number,
              status: "COMPLETED",
              createdAt: { gte: new Date(Date.now() - recentWindowMs) },
            },
            select: { id: true },
          });

          if (latestReview) continue;
          const review = await db.review.create({
            data: {
              repositoryId: config.repositoryId,
              userId: config.repository.userId,
              prNumber: pr.number,
              prTitle: pr.title,
              prUrl: pr.html_url,
              status: "PENDING",
            },
          });

          await step.sendEvent(`queue-review-${review.id}`, {
            name: "review/pr.requested",
            data: {
              reviewId: review.id,
              repositoryId: config.repositoryId,
              prNumber: pr.number,
              userId: config.repository.userId,
            },
          });

          reviewsQueued++;
        }

        await db.scheduledScanRun.update({
          where: { id: scanRun.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            reviewsQueued,
            summary: `Queued ${reviewsQueued} review(s)`,
          },
        });

        completedRuns.push({
          scanRunId: scanRun.id,
          repositoryId: config.repositoryId,
          userId: config.repository.userId,
          cadence,
          reviewsQueued,
        });
      } catch (error) {
        await db.scheduledScanRun.update({
          where: { id: scanRun.id },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            summary:
              error instanceof Error ? error.message : "Scheduled scan failed",
          },
        });
      }
    });
  }

  for (const completed of completedRuns) {
    await step.sendEvent(`scan-completed-${completed.scanRunId}`, {
      name: "scan/completed",
      data: completed,
    });
  }

  return {
    scannedRepositories: activeConfigs.length,
    completedRuns: completedRuns.length,
  };
}

export const dailyScheduledScan = inngest.createFunction(
  { id: "scheduled-scan-daily", retries: 1, triggers: [{ cron: "0 6 * * *" }] },
  async ({ step }) => runScheduledScan("DAILY", step),
);

export const weeklyScheduledScan = inngest.createFunction(
  { id: "scheduled-scan-weekly", retries: 1, triggers: [{ cron: "0 6 * * 0" }] },
  async ({ step }) => runScheduledScan("WEEKLY", step),
);

export const handleScanCompleted = inngest.createFunction(
  { id: "scheduled-scan-notify-owner", retries: 1, triggers: [{ event: "scan/completed" }] },
  async ({ event, step }) => {
    await step.run("create-notification", async () => {
      const data = event.data as {
        repositoryId: string;
        userId: string;
        cadence: ScanCadence;
        reviewsQueued: number;
      };

      await db.notification.create({
        data: {
          userId: data.userId,
          type: "SCHEDULED_SCAN_COMPLETED",
          title: `${data.cadence} scan completed`,
          message: `Scheduled scan queued ${data.reviewsQueued} review(s).`,
          link: `/repo/${data.repositoryId}`,
        },
      });

      // Email notification integration can be added when user-level email notification
      // preferences are available in the settings model.
    });

    return { success: true };
  },
);
