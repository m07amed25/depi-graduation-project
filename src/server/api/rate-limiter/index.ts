/**
 * Rate Limiter Factory and Registry
 *
 * This module provides the factory function to create rate limiters
 * based on configuration, and manages the singleton instances.
 */

import type {
  RateLimiterConfig,
  IRateLimiter,
  RateLimitRule,
  EndpointRateLimitConfig,
  UserTier,
} from "./types";
import {
  DEFAULT_DEV_CONFIG,
  DEFAULT_PROD_CONFIG,
  DEFAULT_TIER_RULES,
} from "./types";
import {
  InMemoryRateLimiter,
  getInMemoryRateLimiter,
} from "./memory-rate-limiter";
import { RedisRateLimiter, getRedisRateLimiter } from "./redis-rate-limiter";

/**
 * Determine if rate limiting is enabled based on environment
 */
export function getDefaultConfig(
  env: NodeEnv = process.env.NODE_ENV as NodeEnv,
): RateLimiterConfig {
  const isProduction = env === "production";

  return isProduction ? DEFAULT_PROD_CONFIG : DEFAULT_DEV_CONFIG;
}

type NodeEnv = "development" | "production" | "test";

/**
 * Rate limiter factory
 * Creates and returns the appropriate rate limiter based on configuration
 */
export class RateLimiterFactory {
  private static instance: IRateLimiter | null = null;
  private static config: RateLimiterConfig | null = null;

  /**
   * Initialize the rate limiter with the given configuration
   */
  static initialize(config: RateLimiterConfig): IRateLimiter {
    this.config = config;

    if (!config.enabled) {
      // Return a no-op rate limiter when disabled
      return this.createNoOpRateLimiter();
    }

    if (config.useRedis) {
      if (!config.redisUrl || !config.redisToken) {
        console.warn(
          "[RateLimiter] Redis is configured but URL/token is missing. Falling back to in-memory.",
        );
        this.instance = getInMemoryRateLimiter();
      } else {
        this.instance = getRedisRateLimiter(config);
      }
    } else {
      this.instance = getInMemoryRateLimiter();
    }

    return this.instance;
  }

  /**
   * Get the current rate limiter instance
   */
  static getInstance(): IRateLimiter {
    if (!this.instance) {
      // Auto-initialize with default config if not initialized
      return this.initialize(getDefaultConfig());
    }
    return this.instance;
  }

  /**
   * Reset the rate limiter instance (useful for testing)
   */
  static async reset(): Promise<void> {
    // Dynamic imports to avoid circular dependencies
    const { resetInMemoryRateLimiter } = await import("./memory-rate-limiter");
    const { resetRedisRateLimiter } = await import("./redis-rate-limiter");

    if (this.instance instanceof InMemoryRateLimiter) {
      resetInMemoryRateLimiter();
    }
    if (this.instance instanceof RedisRateLimiter) {
      resetRedisRateLimiter();
    }
    this.instance = null;
    this.config = null;
  }

  /**
   * Create a no-op rate limiter that allows all requests
   */
  private static createNoOpRateLimiter(): IRateLimiter {
    return {
      async check(_identifier: string, _endpoint: string, rule: RateLimitRule) {
        return {
          success: true,
          limit: rule.limit,
          remaining: rule.limit,
          reset: Math.floor(Date.now() / 1000) + 3600,
          retryAfter: undefined,
          rule,
        };
      },
      async reset(_identifier: string) {},
      async getStatus(_identifier: string, rule: RateLimitRule) {
        return {
          success: true,
          limit: rule.limit,
          remaining: rule.limit,
          reset: Math.floor(Date.now() / 1000) + 3600,
          retryAfter: undefined,
          rule,
        };
      },
      async isHealthy() {
        return true;
      },
    };
  }
}

/**
 * Rate limit rule matcher
 * Matches endpoint patterns to rate limit rules
 */
export class RateLimitMatcher {
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Find the matching rate limit rule for an endpoint
   */
  findRule(endpoint: string): RateLimitRule | null {
    // Check endpoint-specific rules first
    if (this.config.endpoints) {
      for (const [pattern, rule] of Object.entries(this.config.endpoints)) {
        if (this.matchPattern(pattern, endpoint)) {
          return rule;
        }
      }
    }

    // Fall back to default rule
    return this.config.defaultRule || null;
  }

  /**
   * Match an endpoint pattern (supports wildcards)
   * Examples: "trpc.review.*" matches "trpc.review.getAll"
   */
  private matchPattern(pattern: string, endpoint: string): boolean {
    if (pattern === endpoint) return true;

    if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      return endpoint.startsWith(prefix);
    }

    return false;
  }

  /**
   * Get tier-based rule for a user
   */
  getTierRule(tier: UserTier): RateLimitRule | null {
    return this.config.tiers?.[tier] || DEFAULT_TIER_RULES[tier] || null;
  }
}

/**
 * IP whitelist checker
 */
export class WhitelistChecker {
  private ipWhitelist: Set<string>;
  private endpointWhitelist: string[];

  constructor(config: RateLimiterConfig) {
    this.ipWhitelist = new Set(config.whitelistIPs || []);
    this.endpointWhitelist = config.whitelistEndpoints || [];
  }

  /**
   * Check if an IP is whitelisted
   */
  isIPWhitelisted(ip: string): boolean {
    return this.ipWhitelist.has(ip);
  }

  /**
   * Check if an endpoint is whitelisted
   */
  isEndpointWhitelisted(endpoint: string): boolean {
    for (const pattern of this.endpointWhitelist) {
      if (this.matchPattern(pattern, endpoint)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if request should be rate limited
   */
  shouldRateLimit(ip: string, endpoint: string): boolean {
    return !this.isIPWhitelisted(ip) && !this.isEndpointWhitelisted(endpoint);
  }

  /**
   * Match endpoint pattern
   */
  private matchPattern(pattern: string, endpoint: string): boolean {
    if (pattern === endpoint) return true;
    if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      return endpoint.startsWith(prefix);
    }
    return false;
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(headers: Headers): string | null {
  // Check various headers for client IP (common in proxy setups)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return null;
}

/**
 * Get API key from request headers
 */
export function getAPIKey(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  const apiKey = headers.get("x-api-key");
  return apiKey;
}

/**
 * Build identifier based on configuration
 */
export function buildIdentifier(
  ip: string | null,
  apiKey: string | null,
  identifierType: "ip" | "apiKey" | "ip+apiKey",
): string {
  switch (identifierType) {
    case "ip":
      return ip || "unknown";
    case "apiKey":
      return apiKey || "unknown";
    case "ip+apiKey":
      return `${ip || "unknown"}:${apiKey || "unknown"}`;
  }
}

// Re-export types and utilities
export * from "./types";
export { InMemoryRateLimiter } from "./memory-rate-limiter";
export { RedisRateLimiter } from "./redis-rate-limiter";
