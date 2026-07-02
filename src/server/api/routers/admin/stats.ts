import { createTRPCRouter, adminProcedure } from "../../trpc";

export const adminStatsRouter = createTRPCRouter({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalRepositories,
      totalReviews,
      totalTeams,
      reviewsByStatus,
      recentSignups,
      reviewsLast7Days,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.repository.count(),
      ctx.db.review.count(),
      ctx.db.team.count(),
      ctx.db.review.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      ctx.db.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      ctx.db.review.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(
      reviewsByStatus.map((r) => [r.status, r._count.status]),
    );

    return {
      totalUsers,
      totalRepositories,
      totalReviews,
      totalTeams,
      recentSignups,
      reviewsLast7Days,
      reviewsByStatus: {
        PENDING: statusMap.PENDING ?? 0,
        PROCESSING: statusMap.PROCESSING ?? 0,
        COMPLETED: statusMap.COMPLETED ?? 0,
        FAILED: statusMap.FAILED ?? 0,
      },
    };
  }),

  getFullReport: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, totalRepos, totalReviews, totalTeams,
      usersThisWeek, usersThisMonth,
      reviewsThisWeek, reviewsThisMonth,
      reviewsByStatus,
      totalInvoices, paidInvoices, pendingInvoices, failedInvoices, refundedInvoices,
      totalRevenue,
      topPlans,
      recentUsers,
      recentInvoices,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.repository.count(),
      ctx.db.review.count(),
      ctx.db.team.count(),
      ctx.db.user.count({ where: { createdAt: { gte: weekAgo } } }),
      ctx.db.user.count({ where: { createdAt: { gte: monthAgo } } }),
      ctx.db.review.count({ where: { createdAt: { gte: weekAgo } } }),
      ctx.db.review.count({ where: { createdAt: { gte: monthAgo } } }),
      ctx.db.review.groupBy({ by: ["status"], _count: { status: true } }),
      ctx.db.invoice.count(),
      ctx.db.invoice.count({ where: { status: "PAID" } }),
      ctx.db.invoice.count({ where: { status: "PENDING" } }),
      ctx.db.invoice.count({ where: { status: "FAILED" } }),
      ctx.db.invoice.count({ where: { status: "REFUNDED" } }),
      ctx.db.invoice.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      ctx.db.user.groupBy({ by: ["planId"], _count: { planId: true }, orderBy: { _count: { planId: "desc" } } }),
      ctx.db.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { name: true, email: true, planId: true, createdAt: true } }),
      ctx.db.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { email: true } } } }),
    ]);

    const statusMap = Object.fromEntries(reviewsByStatus.map((r) => [r.status, r._count.status]));

    return {
      generatedAt: now.toISOString(),
      platform: {
        totalUsers, totalRepos, totalReviews, totalTeams,
        usersThisWeek, usersThisMonth,
        reviewsThisWeek, reviewsThisMonth,
      },
      reviews: {
        completed: statusMap.COMPLETED ?? 0,
        processing: statusMap.PROCESSING ?? 0,
        pending: statusMap.PENDING ?? 0,
        failed: statusMap.FAILED ?? 0,
      },
      billing: {
        totalInvoices, paidInvoices, pendingInvoices, failedInvoices, refundedInvoices,
        totalRevenue: totalRevenue._sum.amount ?? 0,
      },
      plans: topPlans.map((p) => ({ planId: p.planId, count: p._count.planId })),
      recentUsers,
      recentInvoices: recentInvoices.map((i) => ({
        id: i.id, amount: i.amount, currency: i.currency, status: i.status,
        planId: i.planId, email: i.user.email, createdAt: i.createdAt,
      })),
    };
  }),

  getGrowthData: adminProcedure.query(async ({ ctx }) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [users, reviews] = await Promise.all([
      ctx.db.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      ctx.db.review.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const buckets: Record<
      string,
      { date: string; users: number; reviews: number }
    > = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, users: 0, reviews: 0 };
    }

    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].users++;
    }
    for (const r of reviews) {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].reviews++;
    }

    return Object.values(buckets);
  }),
});
