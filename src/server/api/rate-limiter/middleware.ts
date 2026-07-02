/**
 * Rate Limiting Middleware for tRPC
 *
 * This middleware integrates the rate limiter with tRPC, providing
 * protection for API endpoints from abuse and ensuring fair usage.
 */

import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import {
  RateLimiterFactory,
  RateLimitMatcher,
  WhitelistChecker,
  getClientIP,
  getAPIKey,
  buildIdentifier,
  getDefaultConfig,
  type RateLimiterConfig,
  type RateLimitResult,
  type UserTier,
} from "./index";

/**
 * Context for rate limiting
 */
export interface RateLimitContext {
  clientIP: string | null;
  apiKey: string | null;
  userTier?: UserTier;
  session?: {
    user?: {
      id?: string;
    };
  };
}

/**
 * Options for the rate limiting middleware
 */
export interface RateLimitMiddlewareOptions {
  /** Rate limiter configuration */
  config?: RateLimiterConfig;
  /** Get user tier from the request context */
  getUserTier?: (ctx: RateLimitContext) => UserTier | undefined;
  /** Custom error message for rate limit exceeded */
  errorMessage?: string;
  /** Skip rate limiting for certain operations */
  skip?: (ctx: RateLimitContext, path: string) => boolean;
}

/**
 * Default rate limiting middleware
 *
 * This middleware:
 * 1. Extracts client IP and API key from headers
 * 2. Checks if the request should be rate limited (whitelist)
 * 3. Finds the appropriate rate limit rule for the endpoint
 * 4. Checks the rate limit and throws an error if exceeded
 * 5. Adds rate limit headers to successful responses
 */
export function createRateLimitMiddleware(
  options: RateLimitMiddlewareOptions = {},
) {
  const { config: providedConfig, getUserTier, errorMessage, skip } = options;

  // Initialize rate limiter
  const config = providedConfig || getDefaultConfig();
  const matcher = new RateLimitMatcher(config);
  const whitelistChecker = new WhitelistChecker(config);

  // Initialize the rate limiter
  const rateLimiter = RateLimiterFactory.initialize(config);

  return async (opts: {
    ctx: { headers?: Headers | unknown; [key: string]: unknown };
    next: () => Promise<unknown>;
    path: string;
  }) => {
    const { ctx, next, path } = opts;

    // Get client information from headers
    const headers = (ctx.headers as Headers) || new Headers();
    const clientIP = getClientIP(headers) || "unknown";
    const apiKey = getAPIKey(headers);

    // Check if should skip rate limiting
    if (skip && skip({ clientIP, apiKey } as RateLimitContext, path)) {
      return next();
    }

    // Check whitelist
    if (!whitelistChecker.shouldRateLimit(clientIP, path)) {
      return next();
    }

    // Get the appropriate rate limit rule
    const tier = getUserTier?.({ clientIP, apiKey } as RateLimitContext);
    let rule = matcher.findRule(path);

    // If user has a tier, try to use tier-based rule
    if (tier && !rule) {
      const tierRule = matcher.getTierRule(tier);
      if (tierRule) {
        rule = tierRule;
      }
    }

    // Fall back to default rule if no specific rule found
    if (!rule) {
      rule = config.defaultRule || {
        name: "default",
        limit: 100,
        window: "minute",
        identifier: "ip",
      };
    }

    // Build identifier based on rule
    const identifier = buildIdentifier(clientIP, apiKey, rule.identifier);

    // Check rate limit
    const result = await rateLimiter.check(identifier, path, rule);

    // Log threshold breaches if configured
    if (config.onThreshold && result.remaining > 0) {
      const percentage = ((rule.limit - result.remaining) / rule.limit) * 100;
      if (percentage >= (config.thresholdPercentage || 80)) {
        config.onThreshold({
          identifier,
          identifierType: rule.identifier,
          endpoint: path,
          currentCount: rule.limit - result.remaining,
          limit: rule.limit,
          percentage,
          resetTime: new Date(result.reset * 1000),
        });
      }
    }

    // If rate limit exceeded
    if (!result.success) {
      // Log violation if configured
      if (config.onViolation) {
        config.onViolation({
          identifier,
          identifierType: rule.identifier,
          endpoint: path,
          rule,
          requested: 1,
          limit: result.limit,
          resetTime: new Date(result.reset * 1000),
          clientIP,
          apiKey: apiKey || undefined,
        });
      }

      // Throw a simple error that tRPC will handle
      const error = new Error(result.error || "Too many requests") as Error & {
        code?: string;
        cause?: unknown;
      };
      error.code = "TOO_MANY_REQUESTS";
      error.cause = {
        retryAfter: result.retryAfter,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
      throw error;
    }

    // Proceed with the request
    return next();
  };
}

/**
 * Create rate limit context from fetch request
 */
export function createRateLimitContext(
  opts: FetchCreateContextFnOptions,
): RateLimitContext {
  const headers = opts.req.headers;

  return {
    clientIP: getClientIP(headers),
    apiKey: getAPIKey(headers),
  };
}

/**
 * Helper to add rate limit headers to response
 * This should be used in the responseMeta of your tRPC router
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
    ...(result.retryAfter ? { "Retry-After": String(result.retryAfter) } : {}),
  };
}

/**
 * Pre-configured rate limit middleware for different scenarios
 */

// Strict rate limiting for public endpoints
export const publicEndpointRateLimit = createRateLimitMiddleware({
  config: {
    enabled: true,
    useRedis: false,
    defaultRule: {
      name: "public",
      limit: 30,
      window: "minute",
      burst: 5,
      identifier: "ip",
    },
    whitelistIPs: ["127.0.0.1", "::1"],
    thresholdPercentage: 80,
  },
});

// Moderate rate limiting for authenticated users
export const userRateLimit = createRateLimitMiddleware({
  config: {
    enabled: true,
    useRedis: false,
    defaultRule: {
      name: "user",
      limit: 100,
      window: "minute",
      burst: 20,
      identifier: "ip+apiKey",
    },
    whitelistIPs: ["127.0.0.1", "::1"],
    thresholdPercentage: 80,
  },
});

// Lenient rate limiting for admin endpoints
export const adminRateLimit = createRateLimitMiddleware({
  config: {
    enabled: true,
    useRedis: false,
    defaultRule: {
      name: "admin",
      limit: 500,
      window: "minute",
      burst: 100,
      identifier: "ip+apiKey",
    },
    whitelistIPs: ["127.0.0.1", "::1"],
    thresholdPercentage: 90,
  },
});
