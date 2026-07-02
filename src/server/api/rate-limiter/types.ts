/**
 * Rate Limiter Configuration Types
 *
 * This module defines the core types and interfaces for the rate limiting system.
 * It supports both in-memory and Redis-based rate limiting with flexible configuration.
 */

/** Custom fetch type for Redis client */
export type RedisFetch = (
  url: string,
  options?: RequestInit,
) => Promise<Response>;

/**
 * Time window options for rate limiting
 * Each window represents the duration for which request counts are tracked
 */
export type RateLimitWindow = "second" | "minute" | "hour" | "day";

/**
 * Converts a window string to seconds
 */
export function windowToSeconds(window: RateLimitWindow): number {
  switch (window) {
    case "second":
      return 1;
    case "minute":
      return 60;
    case "hour":
      return 3600;
    case "day":
      return 86400;
  }
}

/**
 * Identifier type for rate limiting
 * Can track by IP address, API key, or both
 */
export type RateLimitIdentifier = "ip" | "apiKey" | "ip+apiKey";

/**
 * User tier levels for tiered rate limiting
 */
export type UserTier = "free" | "basic" | "premium" | "enterprise";

/**
 * Configuration for a specific rate limit rule
 */
export interface RateLimitRule {
  /** Human-readable name for this rule */
  name: string;
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window for this rule */
  window: RateLimitWindow;
  /** Burst allowance - additional requests allowed beyond the limit */
  burst?: number;
  /** Which identifier to use for tracking */
  identifier: RateLimitIdentifier;
}

/**
 * Rate limit configuration for different endpoints
 * Key is the endpoint pattern (e.g., "trpc.review.*", "trpc.repository.list")
 */
export interface EndpointRateLimitConfig {
  [endpointPattern: string]: RateLimitRule;
}

/**
 * Tier-based rate limit configuration
 * Different limits for different user tiers
 */
export interface TierRateLimitConfig {
  free?: RateLimitRule;
  basic?: RateLimitRule;
  premium?: RateLimitRule;
  enterprise?: RateLimitRule;
}

/**
 * Complete rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Enable/disable rate limiting globally */
  enabled: boolean;
  /** Use Redis backend instead of in-memory */
  useRedis: boolean;
  /** Redis URL for Upstash Redis (required if useRedis is true) */
  redisUrl?: string;
  /** Redis token for Upstash Redis (required if useRedis is true) */
  redisToken?: string;
  /** Custom fetch implementation for Redis */
  redisFetch?: RedisFetch;
  /** Custom Redis prefix for keys */
  redisPrefix?: string;
  /** Endpoint-specific rate limit rules */
  endpoints?: EndpointRateLimitConfig;
  /** Default rate limit rule if no endpoint matches */
  defaultRule?: RateLimitRule;
  /** Tier-based rate limit configuration */
  tiers?: {
    free?: RateLimitRule;
    basic?: RateLimitRule;
    premium?: RateLimitRule;
    enterprise?: RateLimitRule;
  };
  /** Whitelisted IP addresses (bypass rate limiting) */
  whitelistIPs?: string[];
  /** Whitelisted endpoints (bypass rate limiting) */
  whitelistEndpoints?: string[];
  /** Callback for rate limit violations */
  onViolation?: (data: RateLimitViolationData) => void;
  /** Callback for threshold breaches (approaching limit) */
  onThreshold?: (data: RateLimitThresholdData) => void;
  /** Threshold percentage to trigger onThreshold (0-100) */
  thresholdPercentage?: number;
}

/**
 * Data passed to the violation callback
 */
export interface RateLimitViolationData {
  /** The identifier that triggered the violation */
  identifier: string;
  /** The identifier type used */
  identifierType: RateLimitIdentifier;
  /** The endpoint that was rate limited */
  endpoint: string;
  /** The rule that was violated */
  rule: RateLimitRule;
  /** The number of requests attempted */
  requested: number;
  /** The limit that was exceeded */
  limit: number;
  /** The time when the limit will reset */
  resetTime: Date;
  /** Client IP address */
  clientIP?: string;
  /** API key if used */
  apiKey?: string;
}

/**
 * Data passed to the threshold callback
 */
export interface RateLimitThresholdData {
  /** The identifier being tracked */
  identifier: string;
  /** The identifier type used */
  identifierType: RateLimitIdentifier;
  /** The endpoint */
  endpoint: string;
  /** Current request count */
  currentCount: number;
  /** The limit */
  limit: number;
  /** Percentage of limit used */
  percentage: number;
  /** Time until reset */
  resetTime: Date;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** The limit that was applied */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Timestamp when the rate limit resets */
  reset: number;
  /** Number of seconds until reset */
  retryAfter?: number;
  /** The rule that was applied */
  rule?: RateLimitRule;
  /** Error message if request was denied */
  error?: string;
}

/**
 * Rate limiter interface
 * Both in-memory and Redis implementations must conform to this interface
 */
export interface IRateLimiter {
  /**
   * Check if a request is allowed and record it
   * @param identifier - The unique identifier for the client
   * @param endpoint - The endpoint being accessed
   * @param rule - The rate limit rule to apply
   */
  check(
    identifier: string,
    endpoint: string,
    rule: RateLimitRule,
  ): Promise<RateLimitResult>;

  /**
   * Reset the rate limit for a specific identifier
   * Useful for testing or admin operations
   */
  reset(identifier: string): Promise<void>;

  /**
   * Get current rate limit status without incrementing
   */
  getStatus(identifier: string, rule: RateLimitRule): Promise<RateLimitResult>;

  /**
   * Check if the rate limiter is healthy
   */
  isHealthy(): Promise<boolean>;
}

/**
 * Default rate limit rules for different tiers
 */
export const DEFAULT_TIER_RULES: TierRateLimitConfig = {
  free: {
    name: "free-tier",
    limit: 100,
    window: "minute",
    burst: 10,
    identifier: "ip",
  },
  basic: {
    name: "basic-tier",
    limit: 500,
    window: "minute",
    burst: 50,
    identifier: "ip+apiKey",
  },
  premium: {
    name: "premium-tier",
    limit: 2000,
    window: "minute",
    burst: 200,
    identifier: "ip+apiKey",
  },
  enterprise: {
    name: "enterprise-tier",
    limit: 10000,
    window: "minute",
    burst: 1000,
    identifier: "ip+apiKey",
  },
};

/**
 * Default configuration for development
 */
export const DEFAULT_DEV_CONFIG: RateLimiterConfig = {
  enabled: true,
  useRedis: false,
  defaultRule: {
    name: "default",
    limit: 100,
    window: "minute",
    burst: 10,
    identifier: "ip",
  },
  whitelistIPs: ["127.0.0.1", "::1", "localhost"],
  thresholdPercentage: 80,
};

/**
 * Default configuration for production
 */
export const DEFAULT_PROD_CONFIG: RateLimiterConfig = {
  enabled: true,
  useRedis: true,
  defaultRule: {
    name: "default",
    limit: 60,
    window: "minute",
    burst: 10,
    identifier: "ip",
  },
  whitelistIPs: [],
  thresholdPercentage: 80,
};

/**
 * Built-in endpoint-specific rules
 */
export const ENDPOINT_SPECIFIC_RULES: EndpointRateLimitConfig = {
  "trpc.review.*": {
    name: "review-endpoint",
    limit: 30,
    window: "minute",
    burst: 5,
    identifier: "ip+apiKey",
  },
  "trpc.collaboration.*": {
    name: "collaboration-endpoint",
    limit: 100,
    window: "minute",
    burst: 20,
    identifier: "ip+apiKey",
  },
  "trpc.notification.*": {
    name: "notification-endpoint",
    limit: 200,
    window: "minute",
    burst: 30,
    identifier: "ip",
  },
};
