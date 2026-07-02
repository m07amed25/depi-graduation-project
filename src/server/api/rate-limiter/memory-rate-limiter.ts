/**
 * In-Memory Rate Limiter Implementation
 *
 * This implementation provides rate limiting using in-memory data structures.
 * It's suitable for development, testing, or single-instance deployments.
 * For production/distributed setups, use the Redis-based rate limiter instead.
 */

import type { RateLimitRule, RateLimitResult, IRateLimiter } from "./types";
import { windowToSeconds } from "./types";

interface RateLimitEntry {
  count: number;
  resetTime: number;
  burstUsed: number;
}

/**
 * In-memory rate limiter using a sliding window algorithm
 * with burst allowance support
 */
export class InMemoryRateLimiter implements IRateLimiter {
  private cache: Map<string, RateLimitEntry>;
  private readonly cleanupInterval: ReturnType<typeof setInterval>;
  private readonly maxCacheSize: number;

  /**
   * Create a new in-memory rate limiter
   * @param cleanupIntervalMs - How often to clean up expired entries (default: 5 minutes)
   * @param maxCacheSize - Maximum number of entries to store (default: 100,000)
   */
  constructor(
    cleanupIntervalMs: number = 5 * 60 * 1000,
    maxCacheSize: number = 100000,
  ) {
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;

    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);

    // Prevent interval from keeping process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Generate cache key from identifier and window
   */
  private getCacheKey(identifier: string, windowSeconds: number): string {
    const now = Math.floor(Date.now() / 1000 / windowSeconds);
    return `${identifier}:${windowSeconds}:${now}`;
  }

  /**
   * Clean up expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.resetTime < now) {
        this.cache.delete(key);
      }
    }

    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.maxCacheSize) {
      const entriesToRemove = this.cache.size - this.maxCacheSize;
      const iterator = this.cache.keys();
      let count = 0;

      for (const key of iterator) {
        if (count >= entriesToRemove) break;
        this.cache.delete(key);
        count++;
      }
    }
  }

  /**
   * Check if a request is allowed and record it
   */
  async check(
    identifier: string,
    _endpoint: string,
    rule: RateLimitRule,
  ): Promise<RateLimitResult> {
    const windowSeconds = windowToSeconds(rule.window);
    const cacheKey = this.getCacheKey(identifier, windowSeconds);
    const now = Date.now();
    const resetTime =
      Math.floor(now / 1000 / windowSeconds) * windowSeconds + windowSeconds;

    let entry = this.cache.get(cacheKey);

    // If no entry exists or window has reset, create new entry
    if (!entry || entry.resetTime * 1000 < now) {
      entry = {
        count: 0,
        resetTime: resetTime,
        burstUsed: 0,
      };
    }

    // Calculate effective limit (with burst)
    const effectiveLimit = rule.limit + (rule.burst || 0);

    // Check if request is allowed
    if (entry.count < rule.limit) {
      // Regular request - within normal limit
      entry.count++;
      this.cache.set(cacheKey, entry);

      return {
        success: true,
        limit: rule.limit,
        remaining: rule.limit - entry.count,
        reset: resetTime,
        retryAfter: undefined,
        rule,
      };
    } else if (entry.burstUsed < (rule.burst || 0)) {
      // Use burst allowance
      entry.burstUsed++;
      this.cache.set(cacheKey, entry);

      return {
        success: true,
        limit: effectiveLimit,
        remaining: effectiveLimit - entry.count - entry.burstUsed,
        reset: resetTime,
        retryAfter: undefined,
        rule,
      };
    } else {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime * 1000 - now) / 1000);

      return {
        success: false,
        limit: effectiveLimit,
        remaining: 0,
        reset: resetTime,
        retryAfter,
        rule,
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    // Remove all entries for this identifier
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (
        key.startsWith(identifier + ":") ||
        key.startsWith(identifier.split(":")[0] + ":")
      ) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    identifier: string,
    rule: RateLimitRule,
  ): Promise<RateLimitResult> {
    const windowSeconds = windowToSeconds(rule.window);
    const cacheKey = this.getCacheKey(identifier, windowSeconds);
    const now = Date.now();
    const resetTime =
      Math.floor(now / 1000 / windowSeconds) * windowSeconds + windowSeconds;

    const entry = this.cache.get(cacheKey);
    const effectiveLimit = rule.limit + (rule.burst || 0);

    if (!entry || entry.resetTime * 1000 < now) {
      return {
        success: true,
        limit: rule.limit,
        remaining: rule.limit,
        reset: resetTime,
        retryAfter: undefined,
        rule,
      };
    }

    const totalUsed = entry.count + entry.burstUsed;
    const remaining = Math.max(0, effectiveLimit - totalUsed);

    return {
      success: totalUsed < effectiveLimit,
      limit: effectiveLimit,
      remaining,
      reset: entry.resetTime,
      retryAfter:
        totalUsed >= effectiveLimit
          ? Math.ceil((entry.resetTime * 1000 - now) / 1000)
          : undefined,
      rule,
    };
  }

  /**
   * Check if the rate limiter is healthy
   */
  async isHealthy(): Promise<boolean> {
    // In-memory limiter is always healthy unless cache is corrupted
    try {
      const testKey = "__health_check__";
      this.cache.set(testKey, {
        count: 0,
        resetTime: Date.now() + 60000,
        burstUsed: 0,
      });
      this.cache.delete(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): { size: number; healthy: boolean } {
    return {
      size: this.cache.size,
      healthy: true,
    };
  }

  /**
   * Destroy the rate limiter and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * Create a singleton instance for the application
 */
let singletonInstance: InMemoryRateLimiter | null = null;

/**
 * Get or create the singleton in-memory rate limiter instance
 */
export function getInMemoryRateLimiter(): InMemoryRateLimiter {
  if (!singletonInstance) {
    singletonInstance = new InMemoryRateLimiter();
  }
  return singletonInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetInMemoryRateLimiter(): void {
  if (singletonInstance) {
    singletonInstance.destroy();
    singletonInstance = null;
  }
}
