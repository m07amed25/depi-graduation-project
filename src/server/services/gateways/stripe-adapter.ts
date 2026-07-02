/**
 * Stripe payment gateway adapter — STUB.
 *
 * Fulfills the PaymentGatewayAdapter interface so the rest of the system
 * can be wired for Stripe without any core changes.  Replace the TODO stubs
 * with real Stripe SDK calls when adding Stripe support.
 */

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

export const stripeAdapter: PaymentGatewayAdapter = {
  name: "stripe",

  async getPaymentMethods(): Promise<GatewayPaymentMethod[]> {
    // TODO: return stripe.paymentMethods.list(...)
    return [
      { id: "card", name: "Card", logoUrl: "", isRedirect: false },
    ];
  },

  async createPayment(_req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    // TODO: const session = await stripe.checkout.sessions.create({ ... })
    throw new Error("Stripe adapter not yet implemented — createPayment");
  },

  async payWithSavedToken(_req: PayWithSavedTokenRequest): Promise<PayWithSavedTokenResponse> {
    // TODO: const intent = await stripe.paymentIntents.create({ customer: ..., payment_method: ... })
    throw new Error("Stripe adapter not yet implemented — payWithSavedToken");
  },

  async getTransactionStatus(_gatewayInvoiceId: string): Promise<GatewayTransactionStatus> {
    // TODO: const session = await stripe.checkout.sessions.retrieve(gatewayInvoiceId)
    throw new Error("Stripe adapter not yet implemented — getTransactionStatus");
  },

  verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
    _payload: Record<string, unknown>,
  ): GatewayWebhookVerifyResult {
    // TODO: stripe.webhooks.constructEvent(rawBody, headers['stripe-signature'], webhookSecret)
    void rawBody;
    void headers;
    return { valid: false, reason: "Stripe webhook verification not implemented" };
  },

  normalizeWebhookStatus(payload: Record<string, unknown>): GatewayPaymentStatus | null {
    // TODO: map payload.type (e.g. "checkout.session.completed") → GatewayPaymentStatus
    void payload;
    return null;
  },
};
