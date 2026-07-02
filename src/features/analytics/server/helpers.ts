import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@/server/db/client";
import { protectedProcedure } from "@/server/api/trpc";
import { checkFeature } from "@/lib/capabilities";

/** Protected procedure gated by the `advanced_analytics` capability. */
export const analyticsProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  await checkFeature(ctx.db, ctx.user.id, "advanced_analytics");
  return next();
});

export const DateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const TimePeriodSchema = z.enum(["7d", "30d", "90d", "6m", "1y"]);

/**
 * Guard: verify the requesting user is a member of the specified team.
 */
export async function assertTeamMembership(
  db: PrismaClient,
  userId: string,
  teamId: string,
) {
  const membership = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this team.",
    });
  }
}

export function getStartDate(period: string, now: Date): Date {
  const startDate = new Date(now);

  switch (period) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "6m":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return startDate;
}

interface TrendDataPoint {
  date: string;
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

export function groupReviewsByTime(
  reviews: Array<{ createdAt: Date; status: string }>,
  granularity: "daily" | "weekly" | "monthly",
  startDate: Date,
  endDate: Date,
): TrendDataPoint[] {
  const trendMap = new Map<string, TrendDataPoint>();

  const current = new Date(startDate);
  while (current <= endDate) {
    const key = getDateKey(current, granularity);
    trendMap.set(key, {
      date: key,
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
    });
    incrementDate(current, granularity);
  }

  reviews.forEach((review) => {
    const key = getDateKey(review.createdAt, granularity);
    const existing = trendMap.get(key);
    if (existing) {
      existing.total++;
      if (review.status === "COMPLETED") {
        existing.completed++;
      } else if (
        review.status === "PENDING" ||
        review.status === "PROCESSING"
      ) {
        existing.pending++;
      } else if (review.status === "FAILED") {
        existing.failed++;
      }
    }
  });

  return Array.from(trendMap.values());
}

function getDateKey(
  date: Date,
  granularity: "daily" | "weekly" | "monthly",
): string {
  if (granularity === "daily") {
    return date.toISOString().split("T")[0];
  } else if (granularity === "weekly") {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split("T")[0];
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
}

function incrementDate(
  date: Date,
  granularity: "daily" | "weekly" | "monthly",
): void {
  if (granularity === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (granularity === "weekly") {
    date.setDate(date.getDate() + 7);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
}
