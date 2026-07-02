/**
 * Central write path for PaymentEvent ledger entries.
 *
 * All payment state transitions MUST go through appendPaymentEvent() inside
 * the same Prisma transaction as the corresponding Invoice update.
 *
 * Architectural note:
 *   Colocating both writes in one transaction guarantees that the snapshot
 *   (Invoice.status) and the ledger (PaymentEvent) are never out of sync —
 *   even if the process crashes between the two operations.
 */

import type { Prisma } from "@/server/db/client";
import type { PaymentEventType } from "./payment-state-machine";

export type AppendPaymentEventInput = {
  invoiceId: string;
  eventType: PaymentEventType;
  source?: string;
  metadata?: Prisma.InputJsonValue;
  rawPayload?: Prisma.InputJsonValue;
};

/**
 * Appends an immutable PaymentEvent row.
 * Must be called inside a Prisma transaction (tx).
 *
 * @example
 * await db.$transaction(async (tx) => {
 *   await tx.invoice.update({ where: { id }, data: { status: "PAID" } });
 *   await appendPaymentEvent(tx, { invoiceId: id, eventType: "PAYMENT_SUCCEEDED", source: "fawaterak" });
 * });
 */
export async function appendPaymentEvent(
  tx: Prisma.TransactionClient,
  input: AppendPaymentEventInput,
): Promise<void> {
  await tx.paymentEvent.create({
    data: {
      invoiceId: input.invoiceId,
      eventType: input.eventType,
      source: input.source ?? "system",
      metadata: input.metadata as unknown as Prisma.InputJsonValue,
      rawPayload: input.rawPayload as unknown as Prisma.InputJsonValue,
    },
  });
}
