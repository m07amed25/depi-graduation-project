import {
  isValidTransition,
  getNextStatus,
  rebuildPaymentState,
  InvalidTransitionError,
} from "./payment-state-machine";
import type { InvoiceStatus, PaymentEventType } from "./payment-state-machine";

describe("isValidTransition", () => {
  const validCases: [InvoiceStatus, PaymentEventType][] = [
    ["INITIATED", "PAYMENT_INITIATED"],
    ["INITIATED", "CREDIT_APPLIED"],
    ["INITIATED", "PAYMENT_CANCELLED"],
    ["PENDING", "PAYMENT_PROCESSING"],
    ["PENDING", "PAYMENT_SUCCEEDED"],
    ["PENDING", "PAYMENT_FAILED"],
    ["PENDING", "PAYMENT_CANCELLED"],
    ["PROCESSING", "PAYMENT_AUTHORIZED"],
    ["PROCESSING", "PAYMENT_SUCCEEDED"],
    ["PROCESSING", "PAYMENT_FAILED"],
    ["PROCESSING", "PAYMENT_CANCELLED"],
    ["AUTHORIZED", "PAYMENT_CAPTURED"],
    ["AUTHORIZED", "PAYMENT_SUCCEEDED"],
    ["AUTHORIZED", "PAYMENT_FAILED"],
    ["AUTHORIZED", "PAYMENT_CANCELLED"],
    ["PAID", "REFUND_REQUESTED"],
    ["PAID", "REFUND_SUCCEEDED"],
    ["PAID", "REFUND_FAILED"],
    ["PAID", "DISPUTE_OPENED"],
    ["REFUNDED", "DISPUTE_OPENED"],
    ["PARTIALLY_REFUNDED", "REFUND_REQUESTED"],
    ["PARTIALLY_REFUNDED", "REFUND_SUCCEEDED"],
    ["PARTIALLY_REFUNDED", "REFUND_FAILED"],
    ["PARTIALLY_REFUNDED", "DISPUTE_OPENED"],
    ["DISPUTED", "DISPUTE_RESOLVED"],
    ["DISPUTED", "REFUND_SUCCEEDED"],
    ["FAILED", "PAYMENT_INITIATED"],
  ];

  test.each(validCases)(
    "%s + %s should be valid",
    (status, event) => {
      expect(isValidTransition(status, event)).toBe(true);
    },
  );

  const invalidCases: [InvoiceStatus, PaymentEventType][] = [
    ["PAID", "PAYMENT_INITIATED"],
    ["PAID", "PAYMENT_SUCCEEDED"],
    ["PAID", "PAYMENT_FAILED"],
    ["PENDING", "PAYMENT_INITIATED"],
    ["CANCELLED", "PAYMENT_INITIATED"],
  ];

  test.each(invalidCases)(
    "%s + %s should be invalid",
    (status, event) => {
      expect(isValidTransition(status, event)).toBe(false);
    },
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// getNextStatus
// ──────────────────────────────────────────────────────────────────────────────
describe("getNextStatus", () => {
  it("transitions INITIATED → PENDING via PAYMENT_INITIATED", () => {
    expect(getNextStatus("INITIATED", "PAYMENT_INITIATED")).toBe("PENDING");
  });

  it("transitions PAID → REFUNDED via REFUND_SUCCEEDED", () => {
    expect(getNextStatus("PAID", "REFUND_SUCCEEDED")).toBe("REFUNDED");
  });

  it("transitions PAID → DISPUTED via DISPUTE_OPENED", () => {
    expect(getNextStatus("PAID", "DISPUTE_OPENED")).toBe("DISPUTED");
  });

  it("transitions DISPUTED → REFUNDED via REFUND_SUCCEEDED", () => {
    expect(getNextStatus("DISPUTED", "REFUND_SUCCEEDED")).toBe("REFUNDED");
  });

  it("allows retry: FAILED → PENDING via PAYMENT_INITIATED", () => {
    expect(getNextStatus("FAILED", "PAYMENT_INITIATED")).toBe("PENDING");
  });

  it("throws InvalidTransitionError for invalid transition", () => {
    expect(() => getNextStatus("PAID", "PAYMENT_INITIATED")).toThrow(InvalidTransitionError);
  });
});

describe("rebuildPaymentState", () => {
  it("starts from INITIATED with no events", () => {
    expect(rebuildPaymentState([])).toBe("INITIATED");
  });

  it("replays a happy-path flow", () => {
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
    ]);
    expect(result).toBe("PAID");
  });

  it("replays a full refund flow", () => {
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
      { eventType: "REFUND_SUCCEEDED", createdAt: new Date() },
    ]);
    expect(result).toBe("REFUNDED");
  });

  it("replays a retry flow (FAILED → retry → success)", () => {
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_FAILED", createdAt: new Date() },
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
    ]);
    expect(result).toBe("PAID");
  });

  it("skips invalid transitions instead of throwing", () => {
    // PAYMENT_SUCCEEDED after PAID is invalid — should be skipped silently
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() }, // duplicate — invalid
    ]);
    expect(result).toBe("PAID");
  });

  it("replays disputed flow", () => {
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
      { eventType: "DISPUTE_OPENED", createdAt: new Date() },
    ]);
    expect(result).toBe("DISPUTED");
  });
});
