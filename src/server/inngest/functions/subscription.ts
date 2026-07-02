import { inngest } from "../client";
import { db } from "@/server/db";
import {
  activatePaidInvoice,
  calculateCheckoutAmount,
  checkoutCurrency,
  resolveExpiredSubscription,
  toAmountString,
} from "@/server/services/payment-workflow";
import { fawaterakConfig } from "@/server/services/fawaterak/config";
import { tokenization } from "@/server/services/fawaterak";
import { decryptPaymentToken } from "@/server/services/payment-tokens";

export const processPaymentSuccess = inngest.createFunction(
  {
    id: "process-payment-success",
    triggers: [{ event: "payment.paid" }],
  },
  async ({ event, step }) => {
    const { invoiceId } = event.data;

    const invoice = await step.run("fetch-invoice", async () => {
      return db.invoice.findUnique({
        where: { id: invoiceId },
        include: { user: true },
      });
    });

    if (!invoice || !invoice.planId) {
      throw new Error("Invoice or plan not found");
    }

    // Skip if already processed (idempotency)
    if (invoice.status !== "PAID") {
      return { skipped: true, reason: "Invoice not in PAID state" };
    }

    const plan = await step.run("fetch-plan", async () => {
      return db.pricingPlan.findUnique({ where: { id: invoice.planId! } });
    });

    if (!plan) {
      throw new Error("Plan not found");
    }

    // Ensure subscription state matches the paid invoice.
    await step.run("activate-subscription", async () => {
      await activatePaidInvoice(db, invoice);
      return { success: true };
    });

    // Send confirmation email (if Resend is configured)
    await step.run("send-confirmation-email", async () => {
      if (!process.env.RESEND_API_KEY) {
        return { skipped: true, reason: "RESEND_API_KEY not configured" };
      }

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.SMTP_FROM ?? "noreply@example.com",
            to: invoice.user.email,
            subject: `Payment Confirmed - ${plan.name} Plan`,
            html: `
              <h1>Payment Successful</h1>
              <p>Thank you for subscribing to the ${plan.name} plan!</p>
              <p><strong>Amount:</strong> ${invoice.amount} ${invoice.currency}</p>
              <p><strong>Plan:</strong> ${plan.name}</p>
            `,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error("Failed to send email:", error);
          return { success: false, error };
        }

        return { success: true };
      } catch (error) {
        console.error("Email error:", error);
        return { success: false, error: String(error) };
      }
    });

    return { success: true, invoiceId, planId: invoice.planId };
  }
);

export const processPaymentFailed = inngest.createFunction(
  {
    id: "process-payment-failed",
    triggers: [{ event: "payment.failed" }],
  },
  async ({ event, step }) => {
    const { invoiceId, userMessage } = event.data;

    // Log for analytics
    await step.run("log-failed-payment", async () => {
      console.log("Payment failed for invoice:", invoiceId, "Reason:", userMessage);
      return { logged: true };
    });

    return { success: true };
  }
);

export const processRefund = inngest.createFunction(
  {
    id: "process-refund",
    triggers: [{ event: "payment.refund" }],
  },
  async ({ event, step }) => {
    const { invoiceId } = event.data;

    const invoice = await step.run("fetch-invoice", async () => {
      return db.invoice.findUnique({
        where: { id: invoiceId },
        include: { user: true },
      });
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Downgrade to free plan
    await step.run("downgrade-subscription", async () => {
      return db.user.update({
        where: { id: invoice.userId },
        data: {
          planId: "free",
          planExpiresAt: null,
        },
      });
    });

    return { success: true, invoiceId };
  }
);


const FREE_PLAN_RESET = {
  planId: "free",
  planExpiresAt: null,
  planStartedAt: null,
  billingCycle: null,
  pendingPlanId: null,
  pendingBillingCycle: null,
} as const;

type ExpiredBillingInfo = {
  fullName: string;
  email: string;
  paymentMethods: { fawaterakToken: string | null; cardBrand: string }[];
} | null;

/**
 * Charges the saved default card for a scheduled paid downgrade and activates it.
 * If the amount is fully covered (credit/discount) it activates without charging.
 * Clears the pending change on success. Returns false on any failure.
 */
async function chargeAndActivatePending(
  userId: string,
  planId: string,
  billingCycle: "monthly" | "yearly",
  billingInfo: ExpiredBillingInfo,
): Promise<boolean> {
  const plan = await db.pricingPlan.findUnique({ where: { id: planId } });
  if (!plan) return false;

  const { finalAmount, creditUsed } = await calculateCheckoutAmount(db, userId, plan, billingCycle);
  const invoice = await db.invoice.create({
    data: {
      userId,
      amount: finalAmount,
      planId,
      billingCycle,
      description: `${plan.name} - ${billingCycle}`,
      currency: checkoutCurrency,
      status: finalAmount === 0 ? "PAID" : "PENDING",
      paidAt: finalAmount === 0 ? new Date() : null,
    },
  });

  if (finalAmount === 0) {
    await activatePaidInvoice(db, invoice, { paidAt: new Date(), creditUsed });
    await db.user.update({ where: { id: userId }, data: { pendingPlanId: null, pendingBillingCycle: null } });
    return true;
  }

  const card = billingInfo?.paymentMethods[0];
  if (!billingInfo || !card?.fawaterakToken) {
    await db.invoice.update({ where: { id: invoice.id }, data: { status: "FAILED" } });
    return false;
  }

  try {
    const chargeCurrency = fawaterakConfig.savedCardChargeCurrency;
    const amountMajor = toAmountString(finalAmount);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const result = await tokenization.payWithToken({
      cartTotal: amountMajor,
      currency: chargeCurrency,
      customer: {
        first_name: billingInfo.fullName.split(" ")[0] ?? billingInfo.fullName,
        last_name: billingInfo.fullName.split(" ").slice(1).join(" ") || "User",
        email: billingInfo.email,
        customer_unique_id: userId,
      },
      cartItems: [{ name: plan.name, price: amountMajor, quantity: "1" }],
      redirectionUrls: { webhookUrl: `${baseUrl}/api/webhooks/fawaterak_json` },
      card_token: decryptPaymentToken(card.fawaterakToken),
      invoice_number: invoice.id,
    });

    const paid = await db.invoice.update({
      where: { id: invoice.id },
      data: {
        fawaterakInvoiceId: result.invoice_id,
        fawaterakInvoiceKey: result.invoice_key,
        paymentMethodUsed: card.cardBrand,
        status: "PAID",
        paidAt: new Date(),
      },
    });

    await activatePaidInvoice(db, paid, {
      paymentMethodUsed: card.cardBrand,
      paidAt: paid.paidAt ?? new Date(),
      creditUsed,
    });
    await db.user.update({ where: { id: userId }, data: { pendingPlanId: null, pendingBillingCycle: null } });
    return true;
  } catch (error) {
    console.error("Scheduled downgrade charge failed:", error);
    await db.invoice.update({ where: { id: invoice.id }, data: { status: "FAILED" } }).catch(() => {});
    return false;
  }
}

export const processExpiredSubscriptions = inngest.createFunction(
  { id: "process-expired-subscriptions", retries: 1, triggers: [{ cron: "0 6 * * *" }] },
  async ({ step }) => {
    const expired = await step.run("find-expired", async () =>
      db.user.findMany({
        where: { planId: { not: "free" }, planExpiresAt: { lte: new Date() } },
        select: {
          id: true,
          pendingPlanId: true,
          pendingBillingCycle: true,
          billingInfo: {
            select: {
              fullName: true,
              email: true,
              paymentMethods: {
                where: { isDefault: true },
                select: { fawaterakToken: true, cardBrand: true },
              },
            },
          },
        },
      }),
    );

    for (const user of expired) {
      await step.run(`resolve-${user.id}`, async () => {
        const result = await resolveExpiredSubscription(user, {
          chargeAndActivatePending: (u, pendingPlanId, billingCycle) =>
            chargeAndActivatePending(u.id, pendingPlanId, billingCycle, user.billingInfo),
          revertToFree: async (userId) => {
            await db.user.update({ where: { id: userId }, data: FREE_PLAN_RESET });
          },
        });
        return { userId: user.id, result };
      });
    }

    return { processed: expired.length };
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Handle disputed payments — flag invoice, notify user, alert team.
// ─────────────────────────────────────────────────────────────────────────────
export const handlePaymentDisputed = inngest.createFunction(
  {
    id: "handle-payment-disputed",
    triggers: [{ event: "payment.disputed" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { invoiceId, gatewayEventId } = event.data as {
      invoiceId: string;
      gatewayEventId: string;
    };

    const invoice = await step.run("fetch-disputed-invoice", async () => {
      return db.invoice.findUnique({
        where: { id: invoiceId },
        include: { user: true },
      });
    });

    if (!invoice) {
      throw new Error(`Disputed invoice not found: ${invoiceId}`);
    }

    await step.run("update-invoice-disputed", async () => {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { status: "DISPUTED" },
      });
    });

    // TODO: integrate with email/notification service when available
    await step.run("log-dispute-alert", async () => {
      console.warn("[payment.disputed] Dispute received", {
        invoiceId,
        gatewayEventId,
        userId: invoice.userId,
        amount: invoice.amount,
        currency: invoice.currency,
      });
      return { alerted: true };
    });

    return { invoiceId, handled: true };
  },
);
