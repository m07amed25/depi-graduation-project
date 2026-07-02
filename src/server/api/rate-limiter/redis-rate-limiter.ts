/**
 * Redis Rate Limiter Implementation (Upstash)
 *
 * This implementation provides distributed rate limiting using Upstash Redis.
 * It's suitable for production deployments with multiple instances.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type {
  RateLimitRule,
  RateLimitResult,
  IRateLimiter,
  RateLimiterConfig,
  RateLimitWindow,
} from "./types";

/**
 * Redis-based rate limiter using Upstash
 * Provides distributed rate limiting with automatic cleanup
 */
export class RedisRateLimiter implements IRateLimiter {
  private redis: Redis | null = null;
  private config: RateLimiterConfig;
  private isInitialized: boolean = false;
  private initError: Error | null = null;

  /**
   * Create a new Redis rate limiter
   * @param config - Rate limiter configuration
   */
  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize the Redis client and rate limiter
   */
  private initialize(): void {
    try {
      if (!this.config.redisUrl || !this.config.redisToken) {
        throw new Error("Redis URL and token are required");
      }

      // Create Redis client
      this.redis = new Redis({
        url: this.config.redisUrl,
        token: this.config.redisToken,
      });

      this.isInitialized = true;
    } catch (error) {
      this.initError =
        error instanceof Error
          ? error
          : new Error("Failed to initialize Redis rate limiter");
      this.isInitialized = false;
    }
  }

  /**
   * Convert window to Upstash duration format
   */
  private getDuration(window: RateLimitWindow): string {
    switch (window) {
      case "second":
        return "1 s";
      case "minute":
        return "1 m";
      case "hour":
        return "1 h";
      case "day":
        return "1 d";
    }
  }

  /**
   * Get or create a rate limiter for a specific rule
   */
  private getRatelimit(rule: RateLimitRule): Ratelimit {
    const prefix = this.config.redisPrefix || "ratelimit";
    const duration = this.getDuration(rule.window);

    return new Ratelimit({
      redis: this.redis!,
      limiter: Ratelimit.slidingWindow(
        rule.limit + (rule.burst || 0),
        duration as unknown as Parameters<typeof Ratelimit.slidingWindow>[1],
      ),
      prefix: `${prefix}:${rule.name}`,
    });
  }

  /**
   * Check if a request is allowed and record it
   */
  async check(
    identifier: string,
    _endpoint: string,
    rule: RateLimitRule,
  ): Promise<RateLimitResult> {
    if (!this.isInitialized || !this.redis) {
      // Return a degraded response if Redis is not available
      const resetTime = this.getResetTime(rule.window);
      return {
        success: true,
        limit: rule.limit,
        remaining: rule.limit,
        reset: resetTime,
        retryAfter: undefined,
        rule,
        error: "Rate limiter unavailable, allowing request",
      };
    }

    try {
      const ratelimit = this.getRatelimit(rule);
      const result = await ratelimit.limit(identifier);

      const resetTime = this.getResetTime(rule.window);
      const effectiveLimit = rule.limit + (rule.burst || 0);

      return {
        success: result.success,
        limit: effectiveLimit,
        remaining: result.remaining,
        reset: resetTime,
        retryAfter: result.reset
          ? Math.ceil((result.reset - Date.now()) / 1000)
          : undefined,
        rule,
        error: result.success
          ? undefined
          : `Rate limit exceeded. Try again later.`,
      };
    } catch (error) {
      // Log error but don't block requests if Redis fails
      console.error("[RateLimiter] Redis error:", error);

      const resetTime = this.getResetTime(rule.window);
      return {
        success: true,
        limit: rule.limit,
        remaining: rule.limit,
        reset: resetTime,
        retryAfter: undefined,
        rule,
        error: "Rate limiter error, allowing request",
      };
    }
  }

  /**
   * Get reset time in seconds from now
   */
  private getResetTime(window: RateLimitWindow): number {
    const now = Math.floor(Date.now() / 1000);
    switch (window) {
      case "second":
        return now + 1;
      case "minute":
        return now + 60;
      case "hour":
        return now + 3600;
      case "day":
        return now + 86400;
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    if (!this.redis || !this.isInitialized) {
      return;
    }

    try {
      // Delete keys matching the identifier pattern
      const pattern = `ratelimit:*:${identifier}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error("[RateLimiter] Error resetting rate limit:", error);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    identifier: string,
    rule: RateLimitRule,
  ): Promise<RateLimitResult> {
    if (!this.redis || !this.isInitialized) {
      const resetTime = this.getResetTime(rule.window);
      return {
        success: true,
        limit: rule.limit,
        remaining: rule.limit,
        reset: resetTime,
        retryAfter: undefined,
        rule,
      };
    }

    try {
      const prefix = this.config.redisPrefix || "ratelimit";
      const key = `${prefix}:${rule.name}:${identifier}`;
      const data = await this.redis.get<{ count: number; resetTime: number }>(
        key,
      );

      if (!data) {
        const resetTime = this.getResetTime(rule.window);
        return {
          success: true,
          limit: rule.limit,
          remaining: rule.limit,
          reset: resetTime,
          retryAfter: undefined,
          rule,
        };
      }

      const effectiveLimit = rule.limit + (rule.burst || 0);
      const remaining = Math.max(0, effectiveLimit - data.count);

      return {
        success: remaining > 0,
        limit: effectiveLimit,
        remaining,
        reset: data.resetTime,
        retryAfter:
          remaining === 0
            ? Math.ceil((data.resetTime * 1000 - Date.now()) / 1000)
            : undefined,
        rule,
      };
    } catch (error) {
      console.error("[RateLimiter] Error getting rate limit status:", error);

      const resetTime = this.getResetTime(rule.window);
      return {
        success: true,
        limit: rule.limit,
        remaining: rule.limit,
        reset: resetTime,
        retryAfter: undefined,
        rule,
      };
    }
  }

  /**
   * Check if the rate limiter is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.redis || !this.isInitialized) {
      return false;
    }

    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get Redis connection info
   */
  getRedisInfo(): { connected: boolean; error?: string } {
    return {
      connected: this.isInitialized,
      error: this.initError?.message,
    };
  }

  /**
   * Re-initialize the rate limiter (useful after Redis connection drops)
   */
  reinitialize(config?: RateLimiterConfig): void {
    if (config) {
      this.config = config;
    }
    this.initialize();
  }
}

/**
 * Create a singleton instance for the application
 */
let singletonInstance: RedisRateLimiter | null = null;

/**
 * Get or create the singleton Redis rate limiter instance
 */
export function getRedisRateLimiter(
  config: RateLimiterConfig,
): RedisRateLimiter {
  if (!singletonInstance) {
    singletonInstance = new RedisRateLimiter(config);
  }
  return singletonInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetRedisRateLimiter(): void {
  singletonInstance = null;
}
