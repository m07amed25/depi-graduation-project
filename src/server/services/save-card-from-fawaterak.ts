import crypto from "crypto";
import type { PrismaClient } from "@/server/db/client";
import { fawaterakConfig } from "@/server/services/fawaterak/config";
import {
  encryptPaymentToken,
  fingerprintPaymentToken,
} from "@/server/services/payment-tokens";

export type TokenizationWebhookPayload = {
  customerUniqueId: string;
  customerCardToken: string;
  customerCard: string;
  cardTokenUniqueId: string;
  cardBrand: string;
  hashKey: string;
};

function readString(body: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string" && value.length > 0) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

export function parseTokenizationWebhookBody(
  body: Record<string, unknown>,
): TokenizationWebhookPayload | null {
  const customerUniqueId = readString(
    body,
    "customerUniqueId",
    "customer_unique_id",
  );
  const customerCardToken = readString(
    body,
    "customerCardToken",
    "customer_card_token",
    "customer_token",
  );
  const customerCard = readString(body, "customerCard", "customer_card", "cardNumber");
  const cardTokenUniqueId = readString(
    body,
    "cardTokenUniqueId",
    "card_token_unique_id",
  );
  const cardBrand = readString(body, "cardBrand", "card_brand");
  const hashKey = readString(body, "hashKey", "hash_key");

  if (!customerUniqueId || !customerCardToken) return null;

  return {
    customerUniqueId,
    customerCardToken,
    customerCard,
    cardTokenUniqueId,
    cardBrand,
    hashKey,
  };
}

function timingSafeHexEqual(expected: string, received: string) {
  if (!/^[a-f0-9]{64}$/i.test(received)) return false;
  const a = Buffer.from(expected.toLowerCase(), "hex");
  const b = Buffer.from(received.toLowerCase(), "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hmacSha256Hex(secret: string, message: string) {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

/** Verify Fawaterak tokenization webhook HMAC (vendor key, with API key fallback). */
export function verifyTokenizationWebhookHash(
  customerUniqueId: string,
  customerCardToken: string,
  receivedHash: string,
): boolean {
  if (!receivedHash) return false;

  const candidates = [
    `customerUniqueId=${customerUniqueId}&customerCardToken=${customerCardToken}`,
    `customer_unique_id=${customerUniqueId}&customer_card_token=${customerCardToken}`,
  ];

  const secrets = [fawaterakConfig.vendorKey, fawaterakConfig.apiKey];

  for (const secret of secrets) {
    for (const queryParam of candidates) {
      const expected = hmacSha256Hex(secret, queryParam);
      if (timingSafeHexEqual(expected, receivedHash)) return true;
    }
  }

  return false;
}

function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  const prefix = digits.slice(0, 6);
  if (/^4/.test(prefix)) return "Visa";
  if (/^5[1-5]/.test(prefix) || /^2[2-7]/.test(prefix)) return "Mastercard";
  return "Card";
}

function normalizeLastFour(customerCard: string): string {
  const digits = customerCard.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  const masked = customerCard.slice(-4);
  return /^[0-9]{4}$/.test(masked) ? masked : "****";
}

export function getPublicAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export type PersistSavedCardResult =
  | { ok: true; created: boolean; paymentMethodId: string }
  | { ok: false; reason: "billing_not_found" | "invalid_signature" | "missing_fields" };

export async function persistSavedCardFromTokenization(
  db: PrismaClient,
  payload: TokenizationWebhookPayload,
  options: { requireValidHash: boolean },
): Promise<PersistSavedCardResult> {
  if (!payload.customerUniqueId || !payload.customerCardToken) {
    return { ok: false, reason: "missing_fields" };
  }

  if (
    options.requireValidHash &&
    !verifyTokenizationWebhookHash(
      payload.customerUniqueId,
      payload.customerCardToken,
      payload.hashKey,
    )
  ) {
    return { ok: false, reason: "invalid_signature" };
  }

  const billing = await db.billingInfo.findUnique({
    where: { userId: payload.customerUniqueId },
  });
  if (!billing) {
    return { ok: false, reason: "billing_not_found" };
  }

  const fingerprint = fingerprintPaymentToken(payload.customerCardToken);

  const existingOnBilling = await db.paymentMethod.findFirst({
    where: { billingInfoId: billing.id, fingerprint },
  });
  if (existingOnBilling) {
    return { ok: true, created: false, paymentMethodId: existingOnBilling.id };
  }

  const existingCount = await db.paymentMethod.count({
    where: { billingInfoId: billing.id },
  });

  const cardBrand =
    payload.cardBrand || detectCardBrand(payload.customerCard || "");

  const created = await db.paymentMethod.create({
    data: {
      billingInfoId: billing.id,
      cardBrand: cardBrand.length > 0 ? cardBrand : "Card",
      lastFour: normalizeLastFour(payload.customerCard || ""),
      expiryMonth: 0,
      expiryYear: 0,
      isDefault: existingCount === 0,
      fingerprint,
      fawaterakToken: encryptPaymentToken(payload.customerCardToken),
      customerUniqueId: payload.customerUniqueId,
      cardTokenUniqueId:
        payload.cardTokenUniqueId || payload.customerCardToken,
    },
  });

  return { ok: true, created: true, paymentMethodId: created.id };
}
