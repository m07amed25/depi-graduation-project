import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { logAudit } from "../../../services/audit";
import { sendRefundEmail } from "../../../email/service";

export const adminInvoicesRouter = createTRPCRouter({
  invoiceList: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(["", "PAID", "PENDING", "FAILED", "REFUNDED"]).default(""),
        search: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.status ? { status: input.status as "PAID" | "PENDING" | "FAILED" | "REFUNDED" } : {}),
        ...(input.search
          ? {
              OR: [
                { id: { contains: input.search, mode: "insensitive" as const } },
                { user: { email: { contains: input.search, mode: "insensitive" as const } } },
                { user: { name: { contains: input.search, mode: "insensitive" as const } } },
                { planId: { contains: input.search, mode: "insensitive" as const } },
                { referenceNumber: { contains: input.search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      const [invoices, total] = await Promise.all([
        ctx.db.invoice.findMany({
          where,
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.invoice.count({ where }),
      ]);

      return { invoices, total, pages: Math.ceil(total / input.limit) };
    }),

  invoiceStats: adminProcedure.query(async ({ ctx }) => {
    const [total, paid, pending, failed, refunded, revenue] = await Promise.all([
      ctx.db.invoice.count(),
      ctx.db.invoice.count({ where: { status: "PAID" } }),
      ctx.db.invoice.count({ where: { status: "PENDING" } }),
      ctx.db.invoice.count({ where: { status: "FAILED" } }),
      ctx.db.invoice.count({ where: { status: "REFUNDED" } }),
      ctx.db.invoice.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    ]);
    return { total, paid, pending, failed, refunded, revenue: revenue._sum.amount ?? 0 };
  }),

  invoiceMarkPaid: adminProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({ where: { id: input.invoiceId } });
      if (!invoice) throw new Error("Invoice not found");

      await ctx.db.invoice.update({
        where: { id: input.invoiceId },
        data: { status: "PAID", paidAt: new Date() },
      });

      if (invoice.planId) {
        const planExpiresAt = new Date();
        planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
        await ctx.db.user.update({
          where: { id: invoice.userId },
          data: { planId: invoice.planId, planExpiresAt },
        });
      }

      void logAudit({
        actorId: ctx.user.id,
        action: "INVOICE_MARKED_PAID",
        resource: "INVOICE",
        resourceId: input.invoiceId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { userId: invoice.userId, planId: invoice.planId, amount: invoice.amount },
      });

      return { success: true };
    }),

  invoiceCancel: adminProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({ where: { id: input.invoiceId } });
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === "PAID") throw new Error("Cannot cancel a paid invoice");

      await ctx.db.invoice.update({
        where: { id: input.invoiceId },
        data: { status: "FAILED" },
      });

      void logAudit({
        actorId: ctx.user.id,
        action: "INVOICE_CANCELLED",
        resource: "INVOICE",
        resourceId: input.invoiceId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { userId: invoice.userId, planId: invoice.planId, amount: invoice.amount, previousStatus: invoice.status },
      });

      return { success: true };
    }),

  invoiceRefund: adminProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.invoiceId },
        include: { user: { select: { id: true, email: true, name: true, accountCredit: true } } },
      });
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status !== "PAID") throw new Error("Can only refund paid invoices");

      await ctx.db.$transaction(async (tx) => {
        await tx.invoice.update({
          where: { id: input.invoiceId },
          data: { status: "REFUNDED" },
        });

        // Add refund as non-withdrawable account credit
        await tx.user.update({
          where: { id: invoice.userId },
          data: {
            planId: "free",
            planExpiresAt: null,
            planStartedAt: null,
            billingCycle: null,
            accountCredit: { increment: invoice.amount },
          },
        });
      });

      // Send refund notification email
      void sendRefundEmail({
        to: invoice.user.email,
        userName: invoice.user.name ?? "User",
        amount: invoice.amount,
        currency: invoice.currency,
        planName: invoice.planId ?? "Unknown",
      });

      void logAudit({
        actorId: ctx.user.id,
        action: "INVOICE_REFUNDED",
        resource: "INVOICE",
        resourceId: input.invoiceId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { userId: invoice.userId, planId: invoice.planId, amount: invoice.amount, creditAdded: invoice.amount },
      });

      return { success: true };
    }),

  invoiceDelete: adminProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({ where: { id: input.invoiceId } });
      if (!invoice) throw new Error("Invoice not found");

      await ctx.db.invoice.delete({ where: { id: input.invoiceId } });

      void logAudit({
        actorId: ctx.user.id,
        action: "INVOICE_DELETED",
        resource: "INVOICE",
        resourceId: input.invoiceId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { userId: invoice.userId, planId: invoice.planId, amount: invoice.amount, status: invoice.status },
      });

      return { success: true };
    }),

  invoiceDeleteAll: adminProcedure
    .input(z.object({ confirm: z.literal("DELETE_ALL_INVOICES") }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.invoice.count();
      await ctx.db.invoice.deleteMany();

      void logAudit({
        actorId: ctx.user.id,
        action: "ALL_INVOICES_DELETED",
        resource: "INVOICE",
        resourceId: "ALL",
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { deletedCount: count },
      });

      return { success: true, deletedCount: count };
    }),

  invoiceBulkCancel: adminProcedure
    .input(z.object({ status: z.enum(["PENDING"]) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.invoice.updateMany({
        where: { status: input.status },
        data: { status: "FAILED" },
      });

      void logAudit({
        actorId: ctx.user.id,
        action: "INVOICES_BULK_CANCELLED",
        resource: "INVOICE",
        resourceId: "BULK",
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { cancelledCount: result.count, fromStatus: input.status },
      });

      return { success: true, cancelledCount: result.count };
    }),
});
