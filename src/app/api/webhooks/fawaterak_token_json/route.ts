import { NextRequest, NextResponse } from "next/server";
import pino from "pino";
import { db } from "@/server/db";
import {
  parseTokenizationWebhookBody,
  persistSavedCardFromTokenization,
} from "@/server/services/save-card-from-fawaterak";

export const runtime = "nodejs";

const log = pino({ name: "webhook.fawaterak.token" });

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseTokenizationWebhookBody(body);

    if (!payload) {
      log.warn({ bodyKeys: Object.keys(body) }, "token webhook malformed");
      return NextResponse.json({ error: "Malformed webhook" }, { status: 400 });
    }

    const headerHash = request.headers.get("x-fawaterak-hash");
    if (headerHash && !payload.hashKey) {
      payload.hashKey = headerHash;
    }

    const result = await persistSavedCardFromTokenization(db, payload, {
      requireValidHash: true,
    });

    if (!result.ok) {
      log.warn(
        { reason: result.reason, customerUniqueId: payload.customerUniqueId },
        "token webhook rejected",
      );
      if (result.reason === "invalid_signature") {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      if (result.reason === "billing_not_found") {
        return NextResponse.json({ error: "Billing info not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Malformed webhook" }, { status: 400 });
    }

    log.info(
      {
        customerUniqueId: payload.customerUniqueId,
        created: result.created,
        paymentMethodId: result.paymentMethodId,
      },
      "token webhook saved card",
    );

    return NextResponse.json({ received: true, created: result.created });
  } catch (error) {
    log.error({ err: error }, "token webhook failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
