/**
 * Fawaterak webhook verification
 * @see https://fawaterk.com/docs
 */

import crypto from "crypto";
import { fawaterakConfig } from "./config";
import type { WebhookPayload } from "./types";

export const webhook = {
  /**
   * Verify webhook HMAC SHA256 hash
   */
  verifyWebhookHash(payload: string, receivedHash: string): boolean {
    const expectedHash = crypto
      .createHmac("sha256", fawaterakConfig.vendorKey)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  },

  /**
   * Parse and validate webhook payload
   */
  parseWebhookPayload(payload: string): WebhookPayload {
    return JSON.parse(payload);
  },

  /**
   * Verify and parse webhook in one step
   * @throws Error if verification fails
   */
  verifyAndParse(payload: string, hash: string): WebhookPayload {
    if (!this.verifyWebhookHash(payload, hash)) {
      throw new Error("Invalid webhook signature");
    }
    return this.parseWebhookPayload(payload);
  },
} as const;
