/**
 * Simple in-memory rate limiter.
 * Stores the timestamp of the last allowed request per key.
 * Works for single-instance servers (Next.js dev / single Vercel function).
 */
const store = new Map<string, number>();

/**
 * Returns true if the key is allowed through; false if it's rate-limited.
 * @param key       Unique key to rate-limit (e.g. email address)
 * @param windowMs  Minimum milliseconds that must pass between requests
 */
export function checkRateLimit(key: string, windowMs: number): boolean {
  const now = Date.now();
  const last = store.get(key);
  if (last !== undefined && now - last < windowMs) {
    return false; // rate-limited
  }
  store.set(key, now);
  return true;
}

/** How many milliseconds remain before the key is allowed again (0 if allowed). */
export function getRateLimitRemaining(key: string, windowMs: number): number {
  const last = store.get(key);
  if (last === undefined) return 0;
  const remaining = windowMs - (Date.now() - last);
  return remaining > 0 ? remaining : 0;
}
