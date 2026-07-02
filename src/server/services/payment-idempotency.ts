/**
 * Distributed idempotency lock using Upstash Redis.
 *
 * Architectural note:
 *   We prefer Redis SET NX (distributed lock) over SELECT FOR UPDATE on Neon
 *   because:
 *   1. Neon uses serverless connection pooling (pgBouncer). Long-held row locks
 *      tie up a connection slot and risk pool exhaustion under burst traffic.
 *   2. Redis NX+EX is a single round-trip with a deterministic TTL; SELECT FOR
 *      UPDATE requires a persistent transaction across multiple round-trips.
 *   3. The lock spans BOTH the DB check AND the gateway call — a window that
 *      can last several seconds and must not block a DB connection.
 */

import { Redis } from "@upstash/redis";

// ─────────────────────────────────────────────────────────────────────────────
// Singleton client
// ─────────────────────────────────────────────────────────────────────────────

let _client: Redis | null = null;
let _hasWarned = false;

// In-memory fallback lock store: key -> expiration timestamp (ms)
const _inMemoryLocks = new Map<string, number>();

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!_hasWarned) {
      console.warn(
        "[payment-idempotency] UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN are not set. " +
          "Falling back to in-memory idempotency locks for checkout flow."
      );
      _hasWarned = true;
    }
    return null;
  }
  if (!_client) {
    _client = new Redis({ url, token });
  }
  return _client;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lock API
// ─────────────────────────────────────────────────────────────────────────────

export const IDEMPOTENCY_LOCK_TTL_SECONDS = 30;

/**
 * Atomically acquires an idempotency lock.
 *
 * Key format: `idempotency:{userId}:{idempotencyKey}`
 * TTL: 30 seconds (enough for a gateway round-trip).
 *
 * Returns true if the lock was acquired (no concurrent request),
 * false if another request already holds the lock.
 */
export async function acquireIdempotencyLock(
  userId: string,
  idempotencyKey: string,
): Promise<boolean> {
  const redis = getRedisClient();
  const key = `idempotency:${userId}:${idempotencyKey}`;

  if (!redis) {
    const now = Date.now();
    // Clean up expired keys to avoid memory leaks
    for (const [k, exp] of _inMemoryLocks.entries()) {
      if (now >= exp) {
        _inMemoryLocks.delete(k);
      }
    }
    const expiresAt = _inMemoryLocks.get(key);
    if (expiresAt && now < expiresAt) {
      return false;
    }
    _inMemoryLocks.set(key, now + IDEMPOTENCY_LOCK_TTL_SECONDS * 1000);
    return true;
  }

  // SET NX EX — returns "OK" if set, null if already exists
  const result = await redis.set(key, "1", {
    nx: true,
    ex: IDEMPOTENCY_LOCK_TTL_SECONDS,
  });
  return result === "OK";
}

/**
 * Releases the idempotency lock early (e.g. after a DB write completes).
 * If the key already expired that is fine — deletion is a no-op.
 */
export async function releaseIdempotencyLock(
  userId: string,
  idempotencyKey: string,
): Promise<void> {
  const redis = getRedisClient();
  const key = `idempotency:${userId}:${idempotencyKey}`;

  if (!redis) {
    _inMemoryLocks.delete(key);
    return;
  }

  await redis.del(key);
}
