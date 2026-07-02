import crypto from "crypto";
import type { PricingPlan, PrismaClient } from "@/server/db/client";
import { appendPaymentEvent } from "./payment-ledger";

export type BillingCycle = "monthly" | "yearly";

export type PlanRelation = "current" | "upgrade" | "downgrade" | "cancel";

/**
 * Classifies a target plan/cycle relative to the user's current plan/cycle.
 * "cancel" = moving to Free from a paid plan. Plan price dominates; for the
 * same plan, yearly ranks above monthly.
 */
export function classifyPlanChange(
  current: { planId: string; monthlyPrice: number; billingCycle: string | null },
  target: { planId: string; monthlyPrice: number; billingCycle: string },
): PlanRelation {
  const currentlyFree = current.planId === "free" || current.monthlyPrice === 0;
  if (target.planId === "free" || target.monthlyPrice === 0) {
    return currentlyFree ? "current" : "cancel";
  }
  if (target.planId === current.planId && target.billingCycle === current.billingCycle) {
    return "current";
  }
  const rank = (price: number, cycle: string | null) =>
    price * 100 + (cycle === "yearly" ? 1 : 0);
  const targetRank = rank(target.monthlyPrice, target.billingCycle);
  const currentRank = currentlyFree ? -1 : rank(current.monthlyPrice, current.billingCycle);
  return targetRank >= currentRank ? "upgrade" : "downgrade";
}

export type ResolveExpiredDeps = {
  /** Charge the saved default card for the pending paid plan and activate it. Returns success. */
  chargeAndActivatePending: (
    user: { id: string },
    pendingPlanId: string,
    billingCycle: BillingCycle,
  ) => Promise<boolean>;
  /** Revert the user to the Free plan and clear any pending change. */
  revertToFree: (userId: string) => Promise<void>;
};

/**
 * Decides the transition for a subscription whose period has ended.
 * A paid pending downgrade is charged + activated (revert to Free if the charge
 * fails); "free"/no pending reverts to Free. Side effects are delegated to deps.
 */
export async function resolveExpiredSubscription(
  user: { id: string; pendingPlanId: string | null; pendingBillingCycle: string | null },
  deps: ResolveExpiredDeps,
): Promise<"activated" | "reverted"> {
  if (user.pendingPlanId && user.pendingPlanId !== "free") {
    const ok = await deps.chargeAndActivatePending(
      { id: user.id },
      user.pendingPlanId,
      user.pendingBillingCycle === "yearly" ? "yearly" : "monthly",
    );
    if (ok) return "activated";
  }
  await deps.revertToFree(user.id);
  return "reverted";
}

type InvoiceForActivation = {
  id: string;
  userId: string;
  amount: number;
  planId: string | null;
  description: string | null;
  paidAt: Date | string | null;
};

type ActivateInvoiceOptions = {
  paidAt?: Date;
  paymentMethodUsed?: string | null;
  referenceNumber?: string | null;
  /** Profile account credit applied at checkout (deducted once on activation). */
  creditUsed?: number;
};

export const checkoutCurrency = "USD";

export const ACCOUNT_CREDIT_PAYMENT_METHOD = "Credits";

export function toAmountString(amount: number) {
  return amount.toFixed(2);
}

export function timingSafeStringEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function getInvoiceDurationMonths(description?: string | null) {
  return /\byearly\b/i.test(description ?? "") ? 12 : 1;
}

export function invoiceAmountMatches(invoiceAmount: number, received: unknown) {
  const amount = typeof received === "number" ? received : Number(received);
  return Number.isFinite(amount) && Math.abs(amount - invoiceAmount) < 0.01;
}

function toValidDate(value: Date | string | null | undefined) {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export async function calculateCheckoutAmount(
  db: PrismaClient,
  userId: string,
  plan: PricingPlan,
  billingCycle: BillingCycle,
) {
  const settings = await db.pricingSettings.findUnique({
    where: { id: "global" },
  });
  const annualDiscount =
    Math.min(Math.max(settings?.annualDiscount ?? 20, 0), 80) / 100;
  const basePrice =
    billingCycle === "monthly"
      ? plan.monthlyPrice
      : Math.round(plan.monthlyPrice * 12 * (1 - annualDiscount));

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { accountCredit: true },
  });
  const accountCredit = user?.accountCredit ?? 0;

  const appliedPromos = await db.userDiscount.findMany({
    where: { userId },
    orderBy: { appliedAt: "desc" },
    take: 10,
  });

  const discounts = await db.discount.findMany({
    where: {
      id: { in: appliedPromos.map((promo) => promo.discountId) },
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      AND: [{ OR: [{ planId: null }, { planId: plan.id }] }],
    },
  });

  const discountsById = new Map(discounts.map((discount) => [discount.id, discount]));
  const discount = appliedPromos
    .map((promo) => discountsById.get(promo.discountId))
    .find((candidate) => {
      if (!candidate) return false;
      return !candidate.maxUses || candidate.usedCount <= candidate.maxUses;
    });

  let afterDiscount = basePrice;
  let discountId: string | null = null;

  if (discount) {
    afterDiscount =
      discount.type === "PERCENTAGE"
        ? Math.round(basePrice * (1 - Math.min(Math.max(discount.value, 0), 100) / 100))
        : Math.max(0, Math.round(basePrice - Math.max(discount.value, 0)));
    discountId = discount.id;
  }

  const creditUsed = Math.min(accountCredit, afterDiscount);
  const finalAmount = Math.max(0, afterDiscount - creditUsed);

  return { basePrice, finalAmount, discountId, creditUsed };
}

export async function activateInvoiceWithAccountCredit(
  db: PrismaClient,
  params: {
    userId: string;
    planId: string;
    billingCycle: BillingCycle;
    planName: string;
    creditUsed: number;
    idempotencyKey?: string;
  },
) {
  const invoice = await db.invoice.create({
    data: {
      userId: params.userId,
      amount: params.creditUsed,
      planId: params.planId,
      billingCycle: params.billingCycle,
      description: `${params.planName} - ${params.billingCycle} (paid with credit)`,
      currency: checkoutCurrency,
      paymentMethodUsed: ACCOUNT_CREDIT_PAYMENT_METHOD,
      ...(params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}),
    },
  });

  await activatePaidInvoice(db, invoice, {
    paymentMethodUsed: ACCOUNT_CREDIT_PAYMENT_METHOD,
    paidAt: new Date(),
    creditUsed: params.creditUsed,
  });

  return invoice.id;
}

export async function activatePaidInvoice(
  db: PrismaClient,
  invoice: InvoiceForActivation,
  options: ActivateInvoiceOptions = {},
) {
  const planId = invoice.planId;
  if (!planId) return;

  const paidAt =
    toValidDate(options.paidAt) ?? toValidDate(invoice.paidAt) ?? new Date();
  const durationMonths = getInvoiceDurationMonths(invoice.description);
  const billingCycle: BillingCycle = durationMonths >= 12 ? "yearly" : "monthly";
  const planExpiresAt = new Date(paidAt);
  planExpiresAt.setMonth(planExpiresAt.getMonth() + durationMonths);

  await db.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt,
        billingCycle,
        successToken: null,
        paymentMethodUsed: options.paymentMethodUsed ?? undefined,
        referenceNumber: options.referenceNumber ?? undefined,
      },
    });

    const creditToDeduct = Math.max(0, options.creditUsed ?? 0);

    await tx.user.update({
      where: { id: invoice.userId },
      data: {
        planId,
        planExpiresAt,
        planStartedAt: paidAt,
        billingCycle,
        ...(creditToDeduct > 0 ? { accountCredit: { decrement: creditToDeduct } } : {}),
      },
    });

    await appendPaymentEvent(tx, {
      invoiceId: invoice.id,
      eventType: "PAYMENT_SUCCEEDED",
      source: "system",
    });
  });
}
