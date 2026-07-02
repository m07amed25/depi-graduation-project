/**
 * Fawaterak payment gateway adapter.
 *
 * Wraps the existing Fawaterak client while implementing the gateway-agnostic
 * PaymentGatewayAdapter interface.  Business logic must NOT import this file
 * directly — import the interface from ./types.ts instead and inject this
 * adapter at the composition root.
 */

import crypto from "crypto";
import { payments, tokenization } from "@/server/services/fawaterak";
import { fawaterakConfig } from "@/server/services/fawaterak/config";
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  GatewayPaymentMethod,
  GatewayPaymentStatus,
  GatewayTransactionStatus,
  GatewayWebhookVerifyResult,
  PaymentGatewayAdapter,
  PayWithSavedTokenRequest,
  PayWithSavedTokenResponse,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function centsToMajor(cents: number): string {
  return (cents / 100).toFixed(2);
}

function getString(body: Record<string, unknown>, key: string): string | null {
  const v = body[key];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

function verifyTransactionHash(
  invoiceId: number | string,
  invoiceKey: string,
  paymentMethod: string,
  receivedHash: string,
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(receivedHash)) return false;
  const queryParam = `InvoiceId=${invoiceId}&InvoiceKey=${invoiceKey}&PaymentMethod=${paymentMethod}`;
  const expected = crypto
    .createHmac("sha256", fawaterakConfig.vendorKey)
    .update(queryParam)
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(receivedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function mapStatus(raw: string): GatewayPaymentStatus {
  const s = raw.toLowerCase();
  if (s === "paid") return "paid";
  if (s === "pending") return "pending";
  if (s === "failed" || s === "error") return "failed";
  if (s === "expired") return "expired";
  if (s === "refund" || s === "refunded") return "refunded";
  return "pending";
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter
// ─────────────────────────────────────────────────────────────────────────────

export const fawaterakAdapter: PaymentGatewayAdapter = {
  name: "fawaterak",

  async getPaymentMethods(): Promise<GatewayPaymentMethod[]> {
    const methods = await payments.getPaymentMethods();
    return methods.map((m) => ({
      id: m.paymentId,
      name: m.name_en,
      logoUrl: m.logo,
      isRedirect: m.redirect === "1" || m.redirect === "true",
    }));
  },

  async createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const amountMajor = centsToMajor(req.amountCents);
    const result = await payments.executePayment({
      payment_method_id: Number(req.paymentMethodId),
      cartTotal: amountMajor,
      currency: req.currency,
      customer: {
        first_name: req.customer.firstName,
        last_name: req.customer.lastName,
        email: req.customer.email,
        address: req.customer.address,
        customer_unique_id: req.customer.externalId,
      },
      cartItems: req.items.map((item) => ({
        name: item.name,
        price: centsToMajor(item.amountCents),
        quantity: String(item.quantity),
      })),
      redirectionUrls: {
        successUrl: req.redirectUrls.success,
        failUrl: req.redirectUrls.failure,
        pendingUrl: req.redirectUrls.pending,
        webhookUrl: req.redirectUrls.webhook,
      },
      invoice_number: req.internalInvoiceId,
    });

    const pd = result.payment_data;
    const referenceCode =
      pd.fawryCode ?? pd.amanCode ?? pd.masaryCode ??
      (pd.meezaReference != null ? String(pd.meezaReference) : null) ?? null;

    return {
      gatewayInvoiceId: String(result.invoice_id),
      gatewayInvoiceKey: result.invoice_key,
      redirectUrl: pd.redirectTo ?? null,
      referenceCode,
    };
  },

  async payWithSavedToken(req: PayWithSavedTokenRequest): Promise<PayWithSavedTokenResponse> {
    const amountMajor = centsToMajor(req.amountCents);
    const result = await tokenization.payWithToken({
      cartTotal: amountMajor,
      currency: req.currency,
      customer: {
        first_name: req.customer.firstName,
        last_name: req.customer.lastName,
        email: req.customer.email,
        address: req.customer.address,
        customer_unique_id: req.customer.externalId,
      },
      cartItems: req.items.map((item) => ({
        name: item.name,
        price: centsToMajor(item.amountCents),
        quantity: String(item.quantity),
      })),
      redirectionUrls: {
        successUrl: req.redirectUrls.success,
        failUrl: req.redirectUrls.failure,
        pendingUrl: req.redirectUrls.pending,
        webhookUrl: req.redirectUrls.webhook,
      },
      card_token: req.token,
      invoice_number: req.internalInvoiceId,
    });

    return {
      gatewayInvoiceId: String(result.invoice_id),
      gatewayInvoiceKey: result.invoice_key,
      transactionId: result.transaction_id,
    };
  },

  async getTransactionStatus(gatewayInvoiceId: string): Promise<GatewayTransactionStatus> {
    const data = await payments.getTransactionData(Number(gatewayInvoiceId));
    return {
      gatewayInvoiceId: String(data.id),
      gatewayInvoiceKey: data.invoice_key,
      amountCents: Math.round(Number(data.total_paid) * 100),
      currency: "USD",
      status: mapStatus(data.status_text),
      paymentMethod: data.payment_method,
      paidAt: data.paid_at ? new Date(data.paid_at) : null,
      referenceNumber: null,
    };
  },

  verifyWebhookSignature(
    _rawBody: string,
    headers: Record<string, string | string[] | undefined>,
    payload: Record<string, unknown>,
  ): GatewayWebhookVerifyResult {
    const invoiceId = payload.invoice_id;
    const invoiceKey = getString(payload, "invoice_key");
    const paymentMethod = getString(payload, "payment_method");

    const receivedHash =
      (typeof headers["x-fawaterak-hash"] === "string"
        ? headers["x-fawaterak-hash"]
        : Array.isArray(headers["x-fawaterak-hash"])
          ? headers["x-fawaterak-hash"][0]
          : null) ??
      getString(payload, "hashKey") ??
      "";

    if (!receivedHash) {
      return { valid: false, reason: "Missing signature header" };
    }
    if (!invoiceId || !invoiceKey || !paymentMethod) {
      return { valid: false, reason: "Missing required fields for signature verification" };
    }

    const valid = verifyTransactionHash(
      String(invoiceId),
      invoiceKey,
      paymentMethod,
      receivedHash,
    );
    return valid ? { valid: true } : { valid: false, reason: "HMAC mismatch" };
  },

  normalizeWebhookStatus(payload: Record<string, unknown>): GatewayPaymentStatus | null {
    const rawStatus = payload.invoice_status ?? payload.status;
    if (typeof rawStatus === "string") return mapStatus(rawStatus);
    if (typeof payload.errorMessage === "string" || payload.response) return "failed";
    return null;
  },
};
