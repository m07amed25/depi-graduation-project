import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";


export const profileRouter = createTRPCRouter({
  availableProviders: publicProcedure.query(() => {
    // Return the list of provider IDs that are actually configured on the server
    const available: string[] = ["github"]; // GitHub is always configured

    if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET)
      available.push("discord");
    if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)
      available.push("linkedin");
    if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET)
      available.push("twitch");
    if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET)
      available.push("apple");

    return available;
  }),

  // Lightweight onboarding state for the realtime "Getting Started" card.
  onboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        accounts: { where: { providerId: "github" }, select: { id: true } },
        _count: { select: { repositories: true, reviews: true } },
      },
    });

    return {
      hasGithub: (user?.accounts?.length ?? 0) > 0,
      hasRepos: (user?._count?.repositories ?? 0) > 0,
      hasReviews: (user?._count?.reviews ?? 0) > 0,
    };
  }),

  getCapabilities: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { planId: true, planExpiresAt: true },
    });
    const expired =
      user?.planExpiresAt && new Date(user.planExpiresAt) < new Date();
    const planId = expired ? "free" : (user?.planId ?? "free");

    const caps = await ctx.db.capability.findMany({
      orderBy: { sortOrder: "asc" },
      include: { plans: { where: { planId } } },
    });

    return caps.map((c) => ({
      key: c.key,
      label: c.label,
      description: c.description,
      kind: c.kind,
      enabled: c.plans[0]?.enabled ?? false,
    }));
  }),

  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        accounts: {
          select: {
            id: true,
            providerId: true,
            accountId: true,
            createdAt: true,
            updatedAt: true,
            scope: true,
          },
        },
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
        message: "User not found",
      });
    }

    const plan = await ctx.db.pricingPlan.findUnique({
      where: { id: user.planId },
    });

    const defaultPlan = {
      id: "free",
      name: "Free",
      tagline: "Perfect for individuals and small side projects.",
      monthlyPrice: 0,
      features: [
        "Up to 3 private repositories",
        "50 AI Reviews per month",
        "Basic Security Scanning",
      ],
      reposLimit: 3,
      reviewsLimit: 50,
      seatsLimit: 1,
      privateRepos: false,
      accentColor: "indigo",
    };

    const effectivePlan = plan ?? defaultPlan;

    // Calculate accurate seat usage
    const ownedTeams = await ctx.db.team.findMany({
      where: {
        members: {
          some: {
            userId: ctx.user.id,
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

    const seatsUsed = ownedTeams.reduce(
      (acc, team) => acc + team._count.members,
      0,
    );

    // Count reviews in current month (matches limit enforcement)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyReviews = await ctx.db.review.count({
      where: { userId: ctx.user.id, createdAt: { gte: startOfMonth } },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      accounts: user.accounts,
      planId: user.planId,
      planExpiresAt: user.planExpiresAt,
      pendingPlanId: user.pendingPlanId,
      pendingBillingCycle: user.pendingBillingCycle,
      accountCredit: user.accountCredit,
      // Overrides
      overrideReposLimit: user.overrideReposLimit,
      overrideReviewsLimit: user.overrideReviewsLimit,
      overrideSeatsLimit: user.overrideSeatsLimit,
      plan: effectivePlan,
      // Effective limits (override takes precedence if set)
      limits: {
        reposLimit: user.overrideReposLimit ?? effectivePlan.reposLimit,
        reviewsLimit: user.overrideReviewsLimit ?? effectivePlan.reviewsLimit,
        seatsLimit: user.overrideSeatsLimit ?? effectivePlan.seatsLimit,
      },
      stats: {
        repositories: user._count.repositories,
        reviews: monthlyReviews,
        teamMembers: seatsUsed,
      },
      isOwner: user.email === process.env.OWNER_MAIL,
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .max(255)
          .min(1, "Name is required")
          .max(100)
          .optional(),
        email: z
          .string()
          .email()
          .max(255)
          .email("Invalid email address")
          .optional(),
        image: z.string().min(1).or(z.literal("")).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // If email is being changed, check uniqueness
      if (input.email && input.email !== ctx.user.email) {
        const existing = await ctx.db.user.findUnique({
          where: { email: input.email },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A user with this email already exists.",
          });
        }
      }

      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.email !== undefined) {
        data.email = input.email;
        // When the email address changes, mark it as unverified so the
        // account doesn't stay verified with an email the user doesn't own.
        if (input.email !== ctx.user.email) {
          data.emailVerified = false;
        }
      }
      if (input.image !== undefined)
        data.image = input.image === "" ? null : input.image;

      const user = await ctx.db.user.update({
        where: { id: ctx.user.id },
        data,
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    }),

  disconnectAccount: protectedProcedure
    .input(
      z.object({
        accountId: z.string().max(255).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure the user has at least one other auth method
      // (either another linked account or a password)
      const accounts = await ctx.db.account.findMany({
        where: { userId: ctx.user.id },
      });

      const hasPassword = accounts.some(
        (a) => a.providerId === "credential" && a.password,
      );
      const otherAccounts = accounts.filter((a) => a.id !== input.accountId);

      if (!hasPassword && otherAccounts.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot disconnect your only authentication method. Add a password or connect another provider first.",
        });
      }

      // Verify account belongs to user
      const account = await ctx.db.account.findFirst({
        where: {
          id: input.accountId,
          userId: ctx.user.id,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found.",
        });
      }

      await ctx.db.account.delete({
        where: { id: input.accountId },
      });

      return { success: true, providerId: account.providerId };
    }),
});
