import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@/server/db/client";

export type LimitType = "reposLimit" | "reviewsLimit" | "seatsLimit";

/**
 * Checks if a user has exceeded their current plan's resource limit.
 * Takes overrides into account.
 */
export async function checkUserLimit(
  db: PrismaClient,
  userId: string,
  limitType: LimitType,
  additionalCount = 1,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          repositories: true,
          reviews: true,
          teamMembers: true,
        },
      },
    },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found during limit check",
    });
  }

  // If plan has expired, treat as free plan
  const planExpired = user.planExpiresAt && new Date(user.planExpiresAt) < new Date();
  const effectivePlanId = planExpired ? "free" : user.planId;

  const plan = await db.pricingPlan.findUnique({
    where: { id: effectivePlanId },
  });

  // Fallback for free plan if not in DB
  const defaultPlan = {
    reposLimit: 3,
    reviewsLimit: 50,
    seatsLimit: 1,
  };

  const effectivePlan = plan ?? defaultPlan;

  let limit: number | null = 0;
  let currentUsage = 0;

  switch (limitType) {
    case "reposLimit":
      limit = user.overrideReposLimit ?? effectivePlan.reposLimit ?? null;
      currentUsage = user._count.repositories;
      break;
    case "reviewsLimit": {
      limit =
        user.overrideReviewsLimit ?? effectivePlan.reviewsLimit ?? null;
      // Count only reviews created in the current calendar month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      currentUsage = await db.review.count({
        where: { userId: userId, createdAt: { gte: startOfMonth } },
      });
      break;
    }
    case "seatsLimit": {
      limit = user.overrideSeatsLimit ?? effectivePlan.seatsLimit ?? null;

      // Count total members across all teams where this user is an OWNER
      const ownedTeams = await db.team.findMany({
        where: {
          members: {
            some: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
        select: {
          _count: {
            select: { members: true },
          },
        },
      });

      currentUsage = ownedTeams.reduce(
        (acc, team) => acc + team._count.members,
        0,
      );
      break;
    }
  }

  if (limit !== null && limit !== 0 && currentUsage + additionalCount > limit) {
    const resourceMap: Record<LimitType, string> = {
      reposLimit: "repository",
      reviewsLimit: "review",
      seatsLimit: "team member",
    };
    const resourceName = resourceMap[limitType];
    const pluralName =
      additionalCount > 1 || limit > 1 ? `${resourceName}s` : resourceName;

    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Limit reached: You have ${currentUsage}/${limit} ${pluralName}. Upgrade your plan for more.`,
    });
  }

  return { limit, usage: currentUsage };
}
