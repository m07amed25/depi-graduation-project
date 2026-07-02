/**
 * Payment State Machine
 *
 * Pure functions — no Prisma, no I/O, fully deterministic.
 * Every state transition is validated before any DB write.
 *
 * Architectural note:
 *   Implemented as pure functions so the machine can be unit-tested
 *   in isolation, reused in both server routes and Inngest workers,
 *   and replayed from the PaymentEvent ledger without side effects.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "INITIATED"
  | "PENDING"
  | "PROCESSING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "DISPUTED"
  | "CANCELLED";

export type PaymentEventType =
  | "PAYMENT_INITIATED"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_CAPTURED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "REFUND_REQUESTED"
  | "REFUND_SUCCEEDED"
  | "REFUND_FAILED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED"
  | "PAYMENT_CANCELLED"
  | "CREDIT_APPLIED";

export interface PaymentEventRecord {
  eventType: PaymentEventType;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transition table
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps (currentStatus, eventType) → nextStatus.
 * Any combination not present here is an invalid transition.
 */
const TRANSITIONS: Readonly<
  Partial<Record<InvoiceStatus, Partial<Record<PaymentEventType, InvoiceStatus>>>>
> = {
  INITIATED: {
    PAYMENT_INITIATED:   "PENDING",
    CREDIT_APPLIED:      "PAID",
    PAYMENT_CANCELLED:   "CANCELLED",
  },
  PENDING: {
    PAYMENT_PROCESSING:  "PROCESSING",
    PAYMENT_SUCCEEDED:   "PAID",
    PAYMENT_FAILED:      "FAILED",
    PAYMENT_CANCELLED:   "CANCELLED",
  },
  PROCESSING: {
    PAYMENT_AUTHORIZED:  "AUTHORIZED",
    PAYMENT_SUCCEEDED:   "PAID",
    PAYMENT_FAILED:      "FAILED",
    PAYMENT_CANCELLED:   "CANCELLED",
  },
  AUTHORIZED: {
    PAYMENT_CAPTURED:    "PAID",
    PAYMENT_SUCCEEDED:   "PAID",
    PAYMENT_FAILED:      "FAILED",
    PAYMENT_CANCELLED:   "CANCELLED",
  },
  PAID: {
    REFUND_REQUESTED:    "PAID",       // status stays PAID while refund is in-flight
    REFUND_SUCCEEDED:    "REFUNDED",
    REFUND_FAILED:       "PAID",
    DISPUTE_OPENED:      "DISPUTED",
  },
  REFUNDED: {
    DISPUTE_OPENED:      "DISPUTED",   // edge case: dispute after full refund
  },
  PARTIALLY_REFUNDED: {
    REFUND_REQUESTED:    "PARTIALLY_REFUNDED",
    REFUND_SUCCEEDED:    "REFUNDED",
    REFUND_FAILED:       "PARTIALLY_REFUNDED",
    DISPUTE_OPENED:      "DISPUTED",
  },
  DISPUTED: {
    DISPUTE_RESOLVED:    "PAID",
    REFUND_SUCCEEDED:    "REFUNDED",
  },
  FAILED: {
    PAYMENT_INITIATED:   "PENDING",   // retry allowed
  },
  CANCELLED: {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Core functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the (current → event) transition is allowed.
 */
export function isValidTransition(
  current: InvoiceStatus,
  event: PaymentEventType,
): boolean {
  return TRANSITIONS[current]?.[event] !== undefined;
}

/**
 * Returns the next status for a valid transition.
 * @throws {InvalidTransitionError} when the transition is not allowed.
 */
export function getNextStatus(
  current: InvoiceStatus,
  event: PaymentEventType,
): InvoiceStatus {
  const next = TRANSITIONS[current]?.[event];
  if (next === undefined) {
    throw new InvalidTransitionError(current, event);
  }
  return next;
}

/**
 * Rebuilds the canonical InvoiceStatus by replaying an ordered event list.
 * Starts from INITIATED.
 *
 * Architectural note:
 *   Because PaymentEvent is an append-only ledger the full payment state
 *   can always be reconstructed from events alone — useful for audits,
 *   debugging, and disaster recovery without relying on the Invoice snapshot.
 */
export function rebuildPaymentState(
  events: ReadonlyArray<PaymentEventRecord>,
): InvoiceStatus {
  let status: InvoiceStatus = "INITIATED";

  for (const event of events) {
    if (!isValidTransition(status, event.eventType)) {
      // Stale / out-of-order event — skip rather than throw so replay is resilient
      continue;
    }
    status = getNextStatus(status, event.eventType);
  }

  return status;
}

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

export class InvalidTransitionError extends Error {
  readonly current: InvoiceStatus;
  readonly event: PaymentEventType;

  constructor(current: InvoiceStatus, event: PaymentEventType) {
    super(
      `Invalid payment transition: ${current} + ${event} has no defined next state`,
    );
    this.name = "InvalidTransitionError";
    this.current = current;
    this.event = event;
  }
}
