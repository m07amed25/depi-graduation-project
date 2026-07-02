import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { payments, tokenization, FawaterakError } from "../../services/fawaterak";
import { fawaterakConfig } from "../../services/fawaterak/config";
import { decryptPaymentToken } from "../../services/payment-tokens";
import {
  activateInvoiceWithAccountCredit,
  activatePaidInvoice,
  calculateCheckoutAmount,
  checkoutCurrency,
  invoiceAmountMatches,
  timingSafeStringEqual,
  toAmountString,
} from "../../services/payment-workflow";
import {
  getPublicAppBaseUrl,
  parseTokenizationWebhookBody,
  persistSavedCardFromTokenization,
} from "../../services/save-card-from-fawaterak";
import {
  acquireIdempotencyLock,
  releaseIdempotencyLock,
} from "../../services/payment-idempotency";
import { appendPaymentEvent } from "../../services/payment-ledger";

const safeInvoiceSelect = {
  id: true,
  amount: true,
  status: true,
  planId: true,
  description: true,
  currency: true,
  paidAt: true,
  createdAt: true,
  idempotencyKey: true,
} as const;

export const paymentRouter = createTRPCRouter({
  getPaymentMethods: protectedProcedure.query(async () => {
    try {
      const methods = await payments.getPaymentMethods();
      return methods;
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      return [];
    }
  }),

  initiatePayment: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        billingCycle: z.enum(["monthly", "yearly"]),
        paymentMethodId: z.number(),
        /** UUID v4 — client must generate and store for retry-safe idempotency. */
        idempotencyKey: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ── Idempotency: return existing invoice if already created ──
      const existingInvoice = await ctx.db.invoice.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existingInvoice && existingInvoice.userId === ctx.user.id) {
        return {
          invoiceId: existingInvoice.id,
          redirectTo: null,
          referenceCode: null,
          paidWithCredit: existingInvoice.status === "PAID",
        };
      }

      // ── Distributed lock to prevent concurrent duplicate initiations ──
      const lockAcquired = await acquireIdempotencyLock(ctx.user.id, input.idempotencyKey);
      if (!lockAcquired) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "A payment with this idempotency key is already in progress. Please retry in a moment.",
        });
      }

      try {
        const billing = await ctx.db.billingInfo.findUnique({
          where: { userId: ctx.user.id },
        });
        if (!billing) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Please add billing information first.",
          });
        }

        const plan = await ctx.db.pricingPlan.findUnique({
          where: { id: input.planId },
        });
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

        const { finalAmount, creditUsed } = await calculateCheckoutAmount(
          ctx.db,
          ctx.user.id,
          plan,
          input.billingCycle,
        );

        // If credit covers the full amount, activate immediately without payment gateway
        if (finalAmount === 0 && creditUsed > 0) {
          const invoiceId = await activateInvoiceWithAccountCredit(ctx.db, {
            userId: ctx.user.id,
            planId: input.planId,
            billingCycle: input.billingCycle,
            planName: plan.name,
            creditUsed,
            idempotencyKey: input.idempotencyKey,
          });

          await releaseIdempotencyLock(ctx.user.id, input.idempotencyKey);
          return { invoiceId, redirectTo: null, referenceCode: null, paidWithCredit: true };
        }

        const amountMajor = toAmountString(finalAmount);

        const successToken = crypto.randomBytes(32).toString("hex");
        const invoice = await ctx.db.invoice.create({
          data: {
            userId: ctx.user.id,
            amount: finalAmount,
            planId: input.planId,
            billingCycle: input.billingCycle,
            description: `${plan.name} - ${input.billingCycle}`,
            currency: checkoutCurrency,
            successToken,
            idempotencyKey: input.idempotencyKey,
          },
        });

        // Record initiation in the append-only event ledger
        await ctx.db.$transaction(async (tx) => {
          await appendPaymentEvent(tx, {
            invoiceId: invoice.id,
            eventType: "PAYMENT_INITIATED",
            source: "tRPC.initiatePayment",
          });
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: "INITIATED", version: { increment: 1 } },
          });
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        try {
          const result = await payments.executePayment({
            payment_method_id: input.paymentMethodId,
            cartTotal: amountMajor,
            currency: checkoutCurrency,
            customer: {
              first_name: billing.fullName.split(" ")[0] ?? billing.fullName,
              last_name: billing.fullName.split(" ").slice(1).join(" ") || "User",
              email: billing.email,
              address: billing.address ?? undefined,
              customer_unique_id: ctx.user.id,
            },
            cartItems: [{ name: plan.name, price: amountMajor, quantity: "1" }],
            redirectionUrls: {
              successUrl: `${baseUrl}/billing/success?invoice=${invoice.id}&token=${successToken}`,
              failUrl: `${baseUrl}/billing/failed?invoice=${invoice.id}`,
              pendingUrl: `${baseUrl}/billing/pending?invoice=${invoice.id}`,
              webhookUrl: `${baseUrl}/api/webhooks/fawaterak_json`,
            },
            invoice_number: invoice.id,
          });

          await ctx.db.invoice.update({
            where: { id: invoice.id },
            data: {
              fawaterakInvoiceId: result.invoice_id,
              fawaterakInvoiceKey: result.invoice_key,
            },
          }).catch(async (err) => {
            if (err?.code === "P2002") {
              await ctx.db.invoice.updateMany({
                where: { fawaterakInvoiceId: result.invoice_id, id: { not: invoice.id } },
                data: { fawaterakInvoiceId: null, fawaterakInvoiceKey: null },
              });
              await ctx.db.invoice.update({
                where: { id: invoice.id },
                data: { fawaterakInvoiceId: result.invoice_id, fawaterakInvoiceKey: result.invoice_key },
              });
            } else throw err;
          });

          await releaseIdempotencyLock(ctx.user.id, input.idempotencyKey);

          return {
            invoiceId: invoice.id,
            redirectTo: result.payment_data.redirectTo,
            referenceCode:
              result.payment_data.fawryCode ??
              result.payment_data.amanCode ??
              result.payment_data.masaryCode ??
              result.payment_data.meezaReference?.toString(),
          };
        } catch (error) {
          await ctx.db.invoice.update({
            where: { id: invoice.id },
            data: { status: "FAILED" },
          });
          throw error;
        }
      } finally {
        // Always release the lock (no-op if already released above)
        await releaseIdempotencyLock(ctx.user.id, input.idempotencyKey).catch(() => undefined);
      }
    }),

  // Called by the success page to activate the plan after payment
  activatePlan: protectedProcedure
    .input(z.object({ invoiceId: z.string(), token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findFirst({
        where: { id: input.invoiceId, userId: ctx.user.id },
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      if (!invoice.planId) throw new TRPCError({ code: "BAD_REQUEST", message: "Invoice has no plan" });

      if (invoice.status === "PAID") {
        return { success: true, planId: invoice.planId };
      }

      if (invoice.status === "FAILED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This payment failed." });
      }

      // Verify the secret token — only Fawaterak's redirect has this
      if (!invoice.successToken || input.token.length !== invoice.successToken.length ||
          !timingSafeStringEqual(input.token, invoice.successToken)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invalid token." });
      }

      if (!invoice.fawaterakInvoiceId || !invoice.fawaterakInvoiceKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Payment has not been initialized with the provider.",
        });
      }

      const transaction = await payments.getTransactionData(invoice.fawaterakInvoiceId);
      if (
        transaction.invoice_key !== invoice.fawaterakInvoiceKey ||
        transaction.status_text !== "paid" ||
        !invoiceAmountMatches(invoice.amount, transaction.total_paid)
      ) {
        // Re-check DB in case webhook arrived while we were calling Fawaterak
        const freshInvoice = await ctx.db.invoice.findFirst({
          where: { id: input.invoiceId, userId: ctx.user.id },
        });
        if (freshInvoice?.status === "PAID") {
          return { success: true, planId: freshInvoice.planId! };
        }

        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Payment is not confirmed yet.",
        });
      }

      await activatePaidInvoice(ctx.db, invoice, {
        paymentMethodUsed: transaction.payment_method,
        paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
      });

      return { success: true, planId: invoice.planId };
    }),

  getPaymentStatus: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findFirst({
        where: { id: input.invoiceId, userId: ctx.user.id },
        select: safeInvoiceSelect,
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      return { status: invoice.status === "PAID" ? "paid" : invoice.status, invoice };
    }),

  saveCardScreen: protectedProcedure.mutation(async ({ ctx }) => {
    const billing = await ctx.db.billingInfo.findUnique({
      where: { userId: ctx.user.id },
    });
    if (!billing) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Please add billing information first.",
      });
    }

    const baseUrl = getPublicAppBaseUrl();
    const tokenWebhookUrl = `${baseUrl}/api/webhooks/fawaterak_token_json`;

    const tokenCurrency = fawaterakConfig.tokenizationCurrency;
    const phoneDigits = billing.phone?.replace(/\D/g, "") ?? "";
    const phone = /^01[0-9]{9}$/.test(phoneDigits)
      ? phoneDigits
      : fawaterakConfig.fallbackCustomerPhone;

    const result = await tokenization.createCardTokenScreen({
      deduct_total_amount: false,
      customerData: {
        customer_unique_id: ctx.user.id,
        customer_first_name: billing.fullName.split(" ")[0] ?? billing.fullName,
        customer_last_name: billing.fullName.split(" ").slice(1).join(" ") || "User",
        customer_email: billing.email,
        customer_phone: phone,
      },
      order: {
        currency: tokenCurrency,
      },
      allowedCardTypes: [],
      redirectionUrls: {
        success_url: `${baseUrl}/billing/cards/saved`,
        fail_url: `${baseUrl}/billing/cards/failed`,
        webhook_url: tokenWebhookUrl,
        webhookUrl: tokenWebhookUrl,
      },
    });

    return { url: result.redirectUrl };
  }),

  /** Fallback when Fawaterak returns token fields on the success redirect URL. */
  confirmSavedCard: protectedProcedure
    .input(
      z.object({
        customerCardToken: z.string().min(1),
        customerCard: z.string().optional(),
        hashKey: z.string().optional(),
        cardBrand: z.string().optional(),
        cardTokenUniqueId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!billing) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Please add billing information first.",
        });
      }

      const payload = parseTokenizationWebhookBody({
        customerUniqueId: ctx.user.id,
        customerCardToken: input.customerCardToken,
        customerCard: input.customerCard ?? "",
        hashKey: input.hashKey ?? "",
        cardBrand: input.cardBrand ?? "",
        cardTokenUniqueId: input.cardTokenUniqueId ?? "",
      });

      if (!payload) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid card data." });
      }

      const result = await persistSavedCardFromTokenization(ctx.db, payload, {
        requireValidHash: Boolean(input.hashKey),
      });

      if (!result.ok) {
        if (result.reason === "invalid_signature") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Invalid card verification." });
        }
        throw new TRPCError({ code: "BAD_REQUEST", message: "Could not save card." });
      }

      return { success: true, created: result.created };
    }),

  payWithSavedCard: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        billingCycle: z.enum(["monthly", "yearly"]),
        cardId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
        include: { paymentMethods: true },
      });
      if (!billing) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Please add billing information first.",
        });
      }

      const card = billing.paymentMethods.find((c) => c.id === input.cardId);
      if (!card || !card.fawaterakToken) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Card not found or not tokenized" });
      }

      const plan = await ctx.db.pricingPlan.findUnique({ where: { id: input.planId } });
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const { finalAmount, creditUsed } = await calculateCheckoutAmount(
        ctx.db,
        ctx.user.id,
        plan,
        input.billingCycle,
      );

      if (finalAmount === 0 && creditUsed > 0) {
        const invoiceId = await activateInvoiceWithAccountCredit(ctx.db, {
          userId: ctx.user.id,
          planId: input.planId,
          billingCycle: input.billingCycle,
          planName: plan.name,
          creditUsed,
        });
        return { invoiceId, transactionId: null, paidWithCredit: true as const };
      }

      if (finalAmount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No card payment is required for this plan.",
        });
      }

      const chargeCurrency = fawaterakConfig.savedCardChargeCurrency;
      const amountMajor = toAmountString(finalAmount);

      const invoice = await ctx.db.invoice.create({
        data: {
          userId: ctx.user.id,
          amount: finalAmount,
          planId: input.planId,
          billingCycle: input.billingCycle,
          description: `${plan.name} - ${input.billingCycle}`,
          currency: chargeCurrency,
        },
      });

      const baseUrl = getPublicAppBaseUrl();

      try {
        const result = await tokenization.payWithToken({
          cartTotal: amountMajor,
          currency: chargeCurrency,
          customer: {
            first_name: billing.fullName.split(" ")[0] ?? billing.fullName,
            last_name: billing.fullName.split(" ").slice(1).join(" ") || "User",
            email: billing.email,
            customer_unique_id: ctx.user.id,
          },
          cartItems: [{ name: plan.name, price: amountMajor, quantity: "1" }],
          redirectionUrls: {
            webhookUrl: `${baseUrl}/api/webhooks/fawaterak_json`,
          },
          card_token: decryptPaymentToken(card.fawaterakToken),
          invoice_number: invoice.id,
        });

        const paidInvoice = await ctx.db.invoice.update({
          where: { id: invoice.id },
          data: {
            fawaterakInvoiceId: result.invoice_id,
            fawaterakInvoiceKey: result.invoice_key,
            paymentMethodUsed: card.cardBrand,
            status: "PAID",
            paidAt: new Date(),
          },
        });

        await activatePaidInvoice(ctx.db, paidInvoice, {
          paymentMethodUsed: card.cardBrand,
          paidAt: paidInvoice.paidAt ?? new Date(),
          creditUsed,
        });

        return { invoiceId: invoice.id, transactionId: result.transaction_id };
      } catch (error) {
        await ctx.db.invoice
          .update({ where: { id: invoice.id }, data: { status: "FAILED" } })
          .catch(() => undefined);

        if (error instanceof FawaterakError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw error;
      }
    }),

  removeSavedCard: protectedProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
        include: { paymentMethods: true },
      });
      if (!billing) throw new TRPCError({ code: "NOT_FOUND" });

      const card = billing.paymentMethods.find((c) => c.id === input.cardId);
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      if (card.customerUniqueId && card.cardTokenUniqueId) {
        await tokenization.deleteCustomerToken(card.customerUniqueId, card.cardTokenUniqueId);
      }

      await ctx.db.paymentMethod.delete({ where: { id: input.cardId } });

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

  getSavedCards: protectedProcedure.query(async ({ ctx }) => {
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
    return billing?.paymentMethods ?? [];
  }),

  freeUpgrade: protectedProcedure
    .input(z.object({ planId: z.string(), billingCycle: z.enum(["monthly", "yearly"]) }))
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.db.pricingPlan.findUnique({ where: { id: input.planId } });
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const { finalAmount } = await calculateCheckoutAmount(
        ctx.db,
        ctx.user.id,
        plan,
        input.billingCycle,
      );

      if (finalAmount !== 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This plan is not free with your current discount." });
      }

      const planExpiresAt = new Date();
      planExpiresAt.setMonth(planExpiresAt.getMonth() + (input.billingCycle === "yearly" ? 12 : 1));

      await ctx.db.invoice.create({
        data: { userId: ctx.user.id, amount: 0, planId: input.planId, billingCycle: input.billingCycle, description: `${plan.name} - ${input.billingCycle} (100% discount)`, currency: checkoutCurrency, status: "PAID", paidAt: new Date() },
      });

      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { planId: input.planId, planExpiresAt, planStartedAt: new Date(), billingCycle: input.billingCycle },
      });

      return { success: true };
    }),

  getCheckoutSummary: protectedProcedure
    .input(z.object({ planId: z.string(), billingCycle: z.enum(["monthly", "yearly"]) }))
    .query(async ({ ctx, input }) => {
      const plan = await ctx.db.pricingPlan.findUnique({ where: { id: input.planId } });
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { accountCredit: true },
      });

      const { basePrice, finalAmount, creditUsed } = await calculateCheckoutAmount(
        ctx.db, ctx.user.id, plan, input.billingCycle,
      );

      return {
        basePrice,
        finalAmount,
        creditUsed,
        accountCredit: user?.accountCredit ?? 0,
        canPayWithCredit: finalAmount === 0 && (creditUsed > 0),
      };
    }),

  payWithCredit: protectedProcedure
    .input(z.object({ planId: z.string(), billingCycle: z.enum(["monthly", "yearly"]) }))
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.db.pricingPlan.findUnique({ where: { id: input.planId } });
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const { finalAmount, creditUsed } = await calculateCheckoutAmount(
        ctx.db, ctx.user.id, plan, input.billingCycle,
      );

      if (finalAmount !== 0 || creditUsed <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient credit to cover this plan." });
      }

      const invoiceId = await activateInvoiceWithAccountCredit(ctx.db, {
        userId: ctx.user.id,
        planId: input.planId,
        billingCycle: input.billingCycle,
        planName: plan.name,
        creditUsed,
      });

      return { success: true, invoiceId };
    }),

  getUpgradePlans: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({ where: { id: ctx.user.id }, select: { planId: true } });
    return ctx.db.pricingPlan.findMany({
      where: { visible: true, monthlyPrice: { gt: 0 }, id: { not: user?.planId ?? "free" } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, monthlyPrice: true, tagline: true, features: true },
    });
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: payment history — returns all invoices with their event ledger.
  // ─────────────────────────────────────────────────────────────────────────
  getHistory: protectedProcedure
    .input(
      z.object({
        limit:  z.number().int().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const invoices = await ctx.db.invoice.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          planId: true,
          billingCycle: true,
          description: true,
          paidAt: true,
          createdAt: true,
          paymentMethodUsed: true,
          referenceNumber: true,
        },
      });

      let nextCursor: string | undefined;
      if (invoices.length > input.limit) {
        const next = invoices.pop();
        nextCursor = next?.id;
      }

      return { invoices, nextCursor };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: invoice detail — returns full Invoice + PaymentEvent ledger.
  // ─────────────────────────────────────────────────────────────────────────
  getInvoiceDetail: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findFirst({
        where: { id: input.invoiceId, userId: ctx.user.id },
        include: {
          paymentEvents: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              eventType: true,
              source: true,
              metadata: true,
              createdAt: true,
            },
          },
        },
      });

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      return invoice;
    }),
});
