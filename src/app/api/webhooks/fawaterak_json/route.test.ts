import { NextRequest } from "next/server";

jest.mock("@/server/db", () => ({
  db: {
    invoice: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    webhookDedup: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    paymentEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/server/inngest", () => ({
  inngest: { send: jest.fn() },
}));

jest.mock("@/server/services/gateways/fawaterak-adapter", () => ({
  fawaterakAdapter: {
    verifyWebhookSignature: jest.fn(),
    normalizeWebhookStatus: jest.fn(),
  },
}));

jest.mock("@/server/services/payment-workflow", () => ({
  activatePaidInvoice: jest.fn(),
  invoiceAmountMatches: jest.fn().mockReturnValue(true),
}));

jest.mock("pino", () => () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

import { db } from "@/server/db";
import { inngest } from "@/server/inngest";
import { fawaterakAdapter } from "@/server/services/gateways/fawaterak-adapter";

// ── Import handler after mocks are registered ─────────────────────────────────
// eslint-disable-next-line import/first
import { POST } from "./route";

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildRequest(body: Record<string, unknown>): NextRequest {
  const json = JSON.stringify(body);
  return new NextRequest("https://devreview.ai/api/webhooks/fawaterak_json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
  });
}

const INVOICE_ID = "inv_test_001";
const FAWATERAK_INVOICE_ID = 12345;
const validPayload = {
  invoice_id: FAWATERAK_INVOICE_ID,
  invoice_key: "key_abc",
  invoice_status: "paid",
  amount: 99,
  payment_method: "credit_card",
  invoice_hash: "signature",
  ref: "REF-123",
};

const mockInvoice = {
  id: INVOICE_ID,
  userId: "user_1",
  status: "INITIATED",
  version: 1,
  amount: 99,
  fawaterakInvoiceKey: "key_abc",
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/webhooks/fawaterak_json", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Signature validation ───────────────────────────────────────────────────
  it("returns 401 when signature is invalid", async () => {
    (fawaterakAdapter.verifyWebhookSignature as jest.Mock).mockReturnValue({ valid: false, reason: "Invalid signature" });

    const req = buildRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  // ── Duplicate detection ────────────────────────────────────────────────────
  it("returns 200 without processing when duplicate dedup record exists", async () => {
    (fawaterakAdapter.verifyWebhookSignature as jest.Mock).mockReturnValue({ valid: true });
    (fawaterakAdapter.normalizeWebhookStatus as jest.Mock).mockReturnValue("paid");

    (db.webhookDedup.findUnique as jest.Mock).mockResolvedValue({ id: "dup" });

    const req = buildRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  // ── Successful payment flow ────────────────────────────────────────────────
  it("processes a valid paid webhook and returns 200", async () => {
    (fawaterakAdapter.verifyWebhookSignature as jest.Mock).mockReturnValue({ valid: true });
    (fawaterakAdapter.normalizeWebhookStatus as jest.Mock).mockReturnValue("paid");

    (db.webhookDedup.findUnique as jest.Mock).mockResolvedValue(null);
    (db.invoice.findFirst as jest.Mock).mockResolvedValue(mockInvoice);

    (db.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        webhookDedup: {
          create: jest.fn().mockResolvedValue({}),
        },
        invoice: {
          update: jest.fn().mockResolvedValue({ ...mockInvoice, version: 2 }),
        },
        paymentEvent: {
          create: jest.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const { activatePaidInvoice } = await import("@/server/services/payment-workflow");
    (activatePaidInvoice as jest.Mock).mockResolvedValue(undefined);

    (inngest.send as jest.Mock).mockResolvedValue(undefined);

    const req = buildRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  // ── Invoice not found ──────────────────────────────────────────────────────
  it("returns 200 (soft reject) when invoice is not found", async () => {
    (fawaterakAdapter.verifyWebhookSignature as jest.Mock).mockReturnValue({ valid: true });
    (fawaterakAdapter.normalizeWebhookStatus as jest.Mock).mockReturnValue("paid");

    (db.webhookDedup.findUnique as jest.Mock).mockResolvedValue(null);
    (db.invoice.findFirst as jest.Mock).mockResolvedValue(null);

    const req = buildRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  // ── Unknown status ─────────────────────────────────────────────────────────
  it("returns 200 (soft reject) for unknown normalised status", async () => {
    (fawaterakAdapter.verifyWebhookSignature as jest.Mock).mockReturnValue({ valid: true });
    (fawaterakAdapter.normalizeWebhookStatus as jest.Mock).mockReturnValue("unknown");

    (db.webhookDedup.findUnique as jest.Mock).mockResolvedValue(null);
    (db.invoice.findFirst as jest.Mock).mockResolvedValue(mockInvoice);

    const req = buildRequest({ ...validPayload, invoice_status: "unknown" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
