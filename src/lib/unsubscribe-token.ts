import { createHmac } from "crypto";

export function createUnsubscribeToken(userId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "fallback";
  return createHmac("sha256", secret).update(userId).digest("hex");
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  return createUnsubscribeToken(userId) === token;
}
