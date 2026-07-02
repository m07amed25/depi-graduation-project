import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { tokenization } from "../../services/fawaterak";
import { classifyPlanChange } from "../../services/payment-workflow";

const billingInfoSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z
    .string()
    .max(20)
    .optional()
    .refine(
      (v) => !v || /^01[0-9]{9}$/.test(v.replace(/\D/g, "")),
      "Enter a valid Egyptian mobile (01xxxxxxxxx)",
    ),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().length(2).default("US"),
});

export const billingRouter = createTRPCRouter({
  getInfo: protectedProcedure.query(async ({ ctx }) => {
    const billing = await ctx.db.billingInfo.findUnique({
      where: { userId: ctx.user.id },
      include: {
        paymentMethods: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            cardBrand: true,
            lastFour: true,
            expiryMonth: true,
            expiryYear: true,
            isDefault: true,
            createdAt: true,
          },
        },
      },
    });
    return billing;
  }),

  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.invoice.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, amount: true, status: true, planId: true, description: true, createdAt: true },
    });
  }),

  getPlanOptions: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { planId: true, billingCycle: true },
    });
    const plans = await ctx.db.pricingPlan.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, monthlyPrice: true, tagline: true, features: true },
    });
    const currentPlan = plans.find((p) => p.id === user?.planId);
    const settings = await ctx.db.pricingSettings.findUnique({
      where: { id: "global" },
      select: { annualDiscount: true },
    });
    const annualDiscount = Math.min(Math.max(settings?.annualDiscount ?? 20, 0), 80);
    const current = {
      planId: user?.planId ?? "free",
      monthlyPrice: currentPlan?.monthlyPrice ?? 0,
      billingCycle: user?.billingCycle ?? null,
    };
    return {
      currentPlanId: current.planId,
      currentBillingCycle: (user?.billingCycle as "monthly" | "yearly" | null) ?? null,
      annualDiscount,
      options: plans.map((p) => ({
        ...p,
        relationMonthly: classifyPlanChange(current, { planId: p.id, monthlyPrice: p.monthlyPrice, billingCycle: "monthly" }),
        relationYearly: classifyPlanChange(current, { planId: p.id, monthlyPrice: p.monthlyPrice, billingCycle: "yearly" }),
      })),
    };
  }),

  // Self-service: schedule a revert to Free at period end. Silent (no email/Pusher).
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { planId: true, planExpiresAt: true },
    });
    if (!user || user.planId === "free" || !user.planExpiresAt || user.planExpiresAt <= new Date()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No active paid subscription to cancel." });
    }
    await ctx.db.user.update({
      where: { id: ctx.user.id },
      data: { pendingPlanId: "free", pendingBillingCycle: null },
    });
    return { success: true };
  }),

  // Self-service: undo any scheduled plan change. Silent.
  resumeSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.user.update({
      where: { id: ctx.user.id },
      data: { pendingPlanId: null, pendingBillingCycle: null },
    });
    return { success: true };
  }),

  // Self-service: schedule a lower paid tier to take effect at period end.
  // Charges nothing now; the daily cron charges the saved card at expiry. Silent.
  scheduleDowngrade: protectedProcedure
    .input(z.object({ planId: z.string().min(1), billingCycle: z.enum(["monthly", "yearly"]) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          planId: true,
          billingCycle: true,
          planExpiresAt: true,
          billingInfo: {
            select: { paymentMethods: { where: { isDefault: true }, select: { fawaterakToken: true } } },
          },
        },
      });
      if (!user || user.planId === "free" || !user.planExpiresAt || user.planExpiresAt <= new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active paid subscription." });
      }
      const [target, currentPlan] = await Promise.all([
        ctx.db.pricingPlan.findUnique({ where: { id: input.planId } }),
        ctx.db.pricingPlan.findUnique({ where: { id: user.planId } }),
      ]);
      if (!target || !target.visible) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
      }
      const relation = classifyPlanChange(
        { planId: user.planId, monthlyPrice: currentPlan?.monthlyPrice ?? 0, billingCycle: user.billingCycle },
        { planId: target.id, monthlyPrice: target.monthlyPrice, billingCycle: input.billingCycle },
      );
      if (relation !== "downgrade") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This change is not a downgrade. Use checkout to upgrade." });
      }
      if (!user.billingInfo?.paymentMethods[0]?.fawaterakToken) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Add a saved card before scheduling a downgrade." });
      }
      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { pendingPlanId: target.id, pendingBillingCycle: input.billingCycle },
      });
      return { success: true };
    }),

  upsertInfo: protectedProcedure
    .input(billingInfoSchema)
    .mutation(async ({ ctx, input }) => {
      const { phone: rawPhone, ...rest } = input;
      const phone = rawPhone?.replace(/\D/g, "") || null;
      return ctx.db.billingInfo.upsert({
        where: { userId: ctx.user.id },
        create: { ...rest, phone, userId: ctx.user.id },
        update: { ...rest, phone },
      });
    }),

  setDefaultCard: protectedProcedure
    .input(z.object({ cardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!billing) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify card belongs to user
      const card = await ctx.db.paymentMethod.findFirst({
        where: { id: input.cardId, billingInfoId: billing.id },
      });
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.paymentMethod.updateMany({
        where: { billingInfoId: billing.id },
        data: { isDefault: false },
      });
      await ctx.db.paymentMethod.update({
        where: { id: input.cardId },
        data: { isDefault: true },
      });

      return { success: true };
    }),

  removeCard: protectedProcedure
    .input(z.object({ cardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
        include: { paymentMethods: true },
      });
      if (!billing) throw new TRPCError({ code: "NOT_FOUND" });

      const card = billing.paymentMethods.find((c) => c.id === input.cardId);
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete token from Fawaterak if it exists
      if (card.cardTokenUniqueId && card.customerUniqueId) {
        await tokenization.deleteCustomerToken(
          card.customerUniqueId,
          card.cardTokenUniqueId
        );
      }

      await ctx.db.paymentMethod.delete({ where: { id: input.cardId } });

      // If deleted card was default, promote next card
      if (card.isDefault) {
        const next = billing.paymentMethods.find((c) => c.id !== input.cardId);
        if (next) {
          await ctx.db.paymentMethod.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }

      return { success: true };
    }),

  getAppliedPromos: protectedProcedure.query(async ({ ctx }) => {
    const used = await ctx.db.userDiscount.findMany({
      where: { userId: ctx.user.id },
      orderBy: { appliedAt: "desc" },
    });
    if (used.length === 0) return [];
    const discounts = await ctx.db.discount.findMany({
      where: {
        id: { in: used.map((u) => u.discountId) },
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true, code: true, type: true, value: true, description: true, planId: true },
    });
    const map = new Map(discounts.map((d) => [d.id, d]));
    return used
      .filter((u) => map.has(u.discountId))
      .map((u) => {
        const d = map.get(u.discountId)!;
        return { code: d.code, type: d.type, value: d.value, description: d.description, planId: d.planId, appliedAt: u.appliedAt };
      });
  }),


  applyPromo: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const discount = await ctx.db.discount.findUnique({
        where: { code: input.code.toUpperCase() },
      });

      if (!discount || !discount.active) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired promo code." });
      }

      if (discount.expiresAt && discount.expiresAt < new Date()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This promo code has expired." });
      }

      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This promo code has reached its usage limit." });
      }

      // Check if user already used this code
      const alreadyUsed = await ctx.db.userDiscount.findUnique({
        where: { userId_discountId: { userId: ctx.user.id, discountId: discount.id } },
      });
      if (alreadyUsed) {
        throw new TRPCError({ code: "CONFLICT", message: "You have already used this promo code." });
      }

      // Record usage and increment count atomically so limited-use codes cannot be oversubscribed.
      await ctx.db.$transaction(async (tx) => {
        const update = await tx.discount.updateMany({
          where: {
            id: discount.id,
            active: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            ...(discount.maxUses
              ? { usedCount: { lt: discount.maxUses } }
              : {}),
          },
          data: { usedCount: { increment: 1 } },
        });

        if (update.count !== 1) {
          throw new TRPCError({ code: "CONFLICT", message: "This promo code is no longer available." });
        }

        await tx.userDiscount.create({
          data: { userId: ctx.user.id, discountId: discount.id },
        });
      });

      const label =
        discount.type === "PERCENTAGE"
          ? `${discount.value}% off`
          : `$${discount.value} off`;

      return {
        success: true,
        message: `Promo code applied! ${label} your next bill.`,
        type: discount.type,
        value: discount.value,
      };
    }),
});
