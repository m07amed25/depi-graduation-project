/**
 * Fawaterak webhook handler — production-hardened.
 *
 * Delivery semantics:
 *   Return 200 for: duplicate events, stale events, invalid transitions,
 *                   already-processed events.
 *   Return non-2xx only for: signature failures, DB failures, infra failures.
 *
 * Architectural note:
 *   Webhook handlers must return 200 for all business rejections so the
 *   gateway does not retry legitimate (but stale/duplicate) events forever.
 *   Non-2xx responses should only signal genuine infra failures where a
 *   retry is warranted.
 */

import { NextRequest, NextResponse } from "next/server";
import { type Prisma } from "@/server/db/client";
import { db } from "@/server/db";
import { inngest } from "@/server/inngest";
import {
  activatePaidInvoice,
  invoiceAmountMatches,
} from "@/server/services/payment-workflow";
import { appendPaymentEvent } from "@/server/services/payment-ledger";
import {
  isValidTransition,
  type InvoiceStatus,
  type PaymentEventType,
} from "@/server/services/payment-state-machine";
import { fawaterakAdapter } from "@/server/services/gateways/fawaterak-adapter";
import pino from "pino";

const log = pino({ name: "webhook.fawaterak" });

// ─────────────────────────────────────────────────────────────────────────────
// Status → event type mapping
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_TO_EVENT: Record<string, PaymentEventType> = {
  paid:     "PAYMENT_SUCCEEDED",
  failed:   "PAYMENT_FAILED",
  expired:  "PAYMENT_FAILED",
  refund:   "REFUND_SUCCEEDED",
  refunded: "REFUND_SUCCEEDED",
  disputed: "DISPUTE_OPENED",
};

function statusToInvoiceStatus(s: string): InvoiceStatus | null {
  switch (s) {
    case "paid":              return "PAID";
    case "failed":
    case "expired":           return "FAILED";
    case "refund":
    case "refunded":          return "REFUNDED";
    case "disputed":          return "DISPUTED";
    default:                  return null;
  }
}

function getString(body: Record<string, unknown>, key: string): string | null {
  const v = body[key];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

function getUserFacingError(errorMessage: string, gatewayCode: string): string {
  if (errorMessage.includes("3D Secure authentication failed")) {
    return "Card authentication failed. Please try again or use a different card.";
  }
  if (errorMessage.includes("cancelled")) {
    return "Payment was cancelled. You can try again when ready.";
  }
  if (gatewayCode === "DECLINED") {
    return "Your card was declined. Please try a different card or contact your bank.";
  }
  return "Payment could not be processed. Please try again or use a different payment method.";
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Read raw body BEFORE parsing — required for HMAC verification.
  const rawBody = await request.text();
  let body: Record<string, unknown>;

  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    log.warn("Fawaterak webhook: invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Convert headers to plain object for the adapter
  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  // 2. Verify HMAC signature — always required, 401 on failure.
  const sigResult = fawaterakAdapter.verifyWebhookSignature(rawBody, headers, body);
  if (!sigResult.valid) {
    log.error(
      { reason: sigResult.reason, invoiceId: body.invoice_id },
      "Fawaterak webhook signature invalid",
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Parse required fields.
  const invoice_id     = Number(body.invoice_id);
  const invoice_key    = getString(body, "invoice_key");
  const payment_method = getString(body, "payment_method");
  const normalizedStatus = fawaterakAdapter.normalizeWebhookStatus(body);

  if (
    !Number.isFinite(invoice_id) ||
    !invoice_key ||
    !payment_method ||
    !normalizedStatus
  ) {
    log.warn({ invoice_id, invoice_key, payment_method, normalizedStatus }, "Fawaterak webhook malformed");
    return NextResponse.json({ error: "Malformed webhook" }, { status: 400 });
  }

  // 4. Deduplication — idempotency key: "fawaterak:{invoice_id}:{status}"
  const dedupKey = `fawaterak:${invoice_id}:${normalizedStatus}`;
  const existing = await db.webhookDedup.findUnique({ where: { gatewayEventId: dedupKey } });
  if (existing) {
    log.info({ dedupKey }, "Fawaterak webhook duplicate — skipping");
    return NextResponse.json({ received: true });
  }

  // 5. Look up invoice.
  const invoice = await db.invoice.findFirst({
    where: { fawaterakInvoiceId: invoice_id },
  });

  if (!invoice) {
    log.warn({ invoice_id }, "Fawaterak webhook: invoice not found — returning 200");
    return NextResponse.json({ received: true });
  }

  if (invoice.fawaterakInvoiceKey !== invoice_key) {
    log.warn({ invoice_id }, "Fawaterak webhook: invoice key mismatch");
    return NextResponse.json({ received: true });
  }

  // 6. State machine guard — check transition is valid.
  const eventType    = STATUS_TO_EVENT[normalizedStatus];
  const targetStatus = statusToInvoiceStatus(normalizedStatus);

  if (!eventType || !targetStatus) {
    log.warn({ normalizedStatus }, "Fawaterak webhook: unknown status — ignored");
    return NextResponse.json({ received: true });
  }

  const currentStatus = invoice.status as InvoiceStatus;

  if (!isValidTransition(currentStatus, eventType)) {
    log.info(
      { invoiceId: invoice.id, currentStatus, eventType },
      "Fawaterak webhook: invalid transition — returning 200 (stale/duplicate)",
    );
    // Record dedup so we never re-process this exact event.
    await db.webhookDedup.create({
      data: { gatewayEventId: dedupKey, eventType },
    });
    return NextResponse.json({ received: true });
  }

  // 7. Process in a single transaction: update Invoice snapshot + append ledger.
  try {
    await db.$transaction(async (tx) => {
      // Dedup row inside transaction — rolls back if the transaction fails.
      await tx.webhookDedup.create({
        data: { gatewayEventId: dedupKey, eventType },
      });

      switch (normalizedStatus) {
        case "paid": {
          if (
            body.amount !== undefined &&
            !invoiceAmountMatches(invoice.amount, body.amount)
          ) {
            log.warn({ invoiceId: invoice.id }, "Fawaterak webhook: amount mismatch — skipping activation");
            return;
          }

          const paidCurrency = getString(body, "paidCurrency") ?? getString(body, "currency");
          if (paidCurrency && paidCurrency !== invoice.currency) {
            log.warn({ invoiceId: invoice.id }, "Fawaterak webhook: currency mismatch — skipping activation");
            return;
          }

          await activatePaidInvoice(db, invoice, {
            paymentMethodUsed: payment_method,
            referenceNumber:
              getString(body, "referenceNumber") ?? getString(body, "reference_number"),
          });

          await appendPaymentEvent(tx, {
            invoiceId: invoice.id,
            eventType: "PAYMENT_SUCCEEDED",
            source: "fawaterak",
            rawPayload: body as unknown as Prisma.InputJsonValue,
          });
          break;
        }

        case "failed":
        case "expired": {
          await tx.invoice.update({
            where: { id: invoice.id, version: invoice.version },
            data: {
              status: "FAILED",
              paymentMethodUsed: payment_method,
              version: { increment: 1 },
            },
          });

          await appendPaymentEvent(tx, {
            invoiceId: invoice.id,
            eventType: "PAYMENT_FAILED",
            source: "fawaterak",
            rawPayload: body as unknown as Prisma.InputJsonValue,
          });
          break;
        }

        case "refund":
        case "refunded": {
          await tx.invoice.update({
            where: { id: invoice.id, version: invoice.version },
            data: {
              status: "REFUNDED",
              version: { increment: 1 },
            },
          });

          await appendPaymentEvent(tx, {
            invoiceId: invoice.id,
            eventType: "REFUND_SUCCEEDED",
            source: "fawaterak",
            rawPayload: body as unknown as Prisma.InputJsonValue,
          });
          break;
        }

        case "disputed": {
          await tx.invoice.update({
            where: { id: invoice.id, version: invoice.version },
            data: {
              status: "DISPUTED",
              version: { increment: 1 },
            },
          });

          await appendPaymentEvent(tx, {
            invoiceId: invoice.id,
            eventType: "DISPUTE_OPENED",
            source: "fawaterak",
            rawPayload: body as unknown as Prisma.InputJsonValue,
          });
          break;
        }
      }
    });
  } catch (err) {
    log.error(
      { err, invoiceId: invoice.id, normalizedStatus },
      "Fawaterak webhook: DB transaction failed",
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // 8. Offload post-processing to Inngest (best-effort, non-blocking).
  try {
    switch (normalizedStatus) {
      case "paid":
        await inngest.send({ name: "payment.paid", data: { invoiceId: invoice.id } });
        break;
      case "failed":
      case "expired": {
        const errorMessage = getString(body, "errorMessage") ?? "";
        const resp =
          typeof body.response === "object" && body.response !== null
            ? (body.response as Record<string, unknown>)
            : {};
        const gatewayCode = getString(resp, "gatewayCode") ?? "";
        await inngest.send({
          name: "payment.failed",
          data: { invoiceId: invoice.id, userMessage: getUserFacingError(errorMessage, gatewayCode) },
        });
        break;
      }
      case "refund":
      case "refunded":
        await inngest.send({ name: "payment.refund", data: { invoiceId: invoice.id } });
        break;
      case "disputed":
        await inngest.send({ name: "payment.disputed", data: { invoiceId: invoice.id } });
        break;
    }
  } catch (inngestErr) {
    log.error({ err: inngestErr, invoiceId: invoice.id }, "Fawaterak webhook: Inngest send failed");
  }

  log.info(
    { invoiceId: invoice.id, normalizedStatus, userId: invoice.userId },
    "Fawaterak webhook processed successfully",
  );

  return NextResponse.json({ received: true });
}
