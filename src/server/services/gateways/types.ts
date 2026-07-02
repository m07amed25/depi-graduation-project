/**
 * Gateway-agnostic payment adapter interface.
 *
 * Architectural note:
 *   All business logic depends on this interface, not on Fawaterak directly.
 *   Adding Stripe, Paymob, or PayPal only requires a new adapter — no core
 *   changes. The adapter pattern also makes it trivial to swap gateways in
 *   tests via a mock adapter.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared value types
// ─────────────────────────────────────────────────────────────────────────────

export interface GatewayCustomer {
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
  /** Stable, gateway-scoped unique customer ID (usually our userId). */
  externalId: string;
}

export interface GatewayCartItem {
  name: string;
  /** Amount in minor units (cents). */
  amountCents: number;
  quantity: number;
}

export interface GatewayRedirectUrls {
  success: string;
  failure: string;
  pending: string;
  webhook: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface CreatePaymentRequest {
  paymentMethodId: string | number;
  /** Total amount in minor units (cents). */
  amountCents: number;
  currency: string;
  customer: GatewayCustomer;
  items: GatewayCartItem[];
  redirectUrls: GatewayRedirectUrls;
  /** Our internal invoice ID — passed to gateway as reference. */
  internalInvoiceId: string;
}

export interface CreatePaymentResponse {
  /** Gateway-assigned invoice / order ID. */
  gatewayInvoiceId: string;
  /** Gateway secret key used to verify webhooks and fetch transaction data. */
  gatewayInvoiceKey: string;
  /** URL to redirect the customer to (null for direct-charge methods). */
  redirectUrl: string | null;
  /** Reference codes for cash / OTC methods (Fawry, Aman, Masary…). */
  referenceCode: string | null;
}

export interface PayWithSavedTokenRequest {
  token: string;
  amountCents: number;
  currency: string;
  customer: GatewayCustomer;
  items: GatewayCartItem[];
  redirectUrls: GatewayRedirectUrls;
  internalInvoiceId: string;
}

export interface PayWithSavedTokenResponse {
  gatewayInvoiceId: string;
  gatewayInvoiceKey: string;
  transactionId: string;
}

export type GatewayPaymentStatus =
  | "paid"
  | "pending"
  | "processing"
  | "failed"
  | "expired"
  | "refund"
  | "refunded"
  | "disputed"
  | "cancelled";

export interface GatewayTransactionStatus {
  gatewayInvoiceId: string;
  gatewayInvoiceKey: string;
  /** Amount in minor units (cents). */
  amountCents: number;
  currency: string;
  status: GatewayPaymentStatus;
  paymentMethod: string;
  paidAt: Date | null;
  referenceNumber: string | null;
}

export interface GatewayWebhookVerifyResult {
  valid: boolean;
  reason?: string;
}

export interface GatewayPaymentMethod {
  id: string | number;
  name: string;
  logoUrl: string;
  /** Whether this method supports redirect-based flow. */
  isRedirect: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter interface
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentGatewayAdapter {
  /** Human-readable gateway name (used in logging / audit). */
  readonly name: string;

  /** List available payment methods. */
  getPaymentMethods(): Promise<GatewayPaymentMethod[]>;

  /** Initiate a new payment and return gateway IDs + redirect URL. */
  createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResponse>;

  /** Charge a previously saved card token. */
  payWithSavedToken(req: PayWithSavedTokenRequest): Promise<PayWithSavedTokenResponse>;

  /** Fetch live transaction status from the gateway. */
  getTransactionStatus(gatewayInvoiceId: string): Promise<GatewayTransactionStatus>;

  /**
   * Verify the webhook signature against the raw body.
   * Must be called BEFORE parsing/trusting the payload.
   */
  verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
    payload: Record<string, unknown>,
  ): GatewayWebhookVerifyResult;

  /** Normalize raw webhook body to a canonical status string. */
  normalizeWebhookStatus(payload: Record<string, unknown>): GatewayPaymentStatus | null;
}
