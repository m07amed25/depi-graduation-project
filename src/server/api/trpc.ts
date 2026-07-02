import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db, withDbRetry } from "../db";
import { auth } from "../auth";
import {
  getClientIP,
  getAPIKey,
  buildIdentifier,
  getDefaultConfig,
  RateLimiterFactory,
  type RateLimitRule,
} from "./rate-limiter/index";

/**
 * Attempt to fetch the Better Auth session and transparently retry once when
 * the database connection was dropped by Neon's auto-pause.
 *
 * Better Auth catches the raw Prisma P1017 error and re-throws it as
 * `APIError { body: { code: "FAILED_TO_GET_SESSION" } }`.  We detect that
 * specific code, force-disconnect Prisma's connection pool so the next call
 * opens a fresh socket, and retry exactly once.  If the second attempt also
 * fails we return `null` so public routes continue to work; protected routes
 * will still throw UNAUTHORIZED because there is no session.
 */
async function getSessionWithRetry(headers: Headers) {
  try {
    return await auth.api.getSession({ headers });
  } catch (err: unknown) {
    const isConnectionDrop =
      typeof err === "object" &&
      err !== null &&
      // Better Auth wraps the DB error in an APIError with this body code
      "body" in err &&
      typeof (err as { body?: { code?: string } }).body === "object" &&
      (err as { body: { code?: string } }).body?.code ===
        "FAILED_TO_GET_SESSION";

    if (isConnectionDrop) {
      console.warn(
        "[tRPC] DB connection dropped during session lookup (Neon auto-pause). " +
          "Forcing reconnect and retrying …",
      );
      // Drop the broken pool — Prisma opens a fresh connection on the next query.
      await db.$disconnect().catch(() => {});
      // Give Neon's compute node a moment to wake before the retry.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        return await auth.api.getSession({ headers });
      } catch (retryErr) {
        console.error(
          "[tRPC] Session retry also failed after reconnect:",
          retryErr,
        );
        // Return null so the context is still built and public routes work.
        return null;
      }
    }

    // Any other error (auth misconfiguration, etc.) bubbles up normally.
    throw err;
  }
}

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getSessionWithRetry(opts.headers);
  return {
    db,
    session,
    headers: opts.headers,
    // Expose for audit logging
    ip: getClientIP(opts.headers) ?? undefined,
    userAgent: opts.headers.get("user-agent") ?? undefined,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const cause = error.cause as Record<string, unknown> | undefined;
    const retryAfter = cause?.retryAfter ? Number(cause.retryAfter) : null;

    return {
      ...shape,
      data: {
        ...shape.data,
        ZodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        retryAfter,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

export const mergeRouters = t.mergeRouters;

// Initialize rate limiter with default config, wiring Redis credentials from
// environment variables so that production deployments use a shared Upstash
// store instead of per-process in-memory counters.
const rateLimiter = RateLimiterFactory.initialize({
  ...getDefaultConfig(),
  redisUrl: process.env.UPSTASH_REDIS_REST_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  onViolation: (data) => {
    console.warn("[RateLimit] Violation:", {
      identifier: data.identifier,
      endpoint: data.endpoint,
      limit: data.limit,
      resetTime: data.resetTime,
    });
  },
  onThreshold: (data) => {
    console.info("[RateLimit] Approaching limit:", {
      identifier: data.identifier,
      endpoint: data.endpoint,
      percentage: data.percentage,
      remaining: data.limit - data.currentCount,
    });
  },
});

// Default rate limit rule
const defaultRule: RateLimitRule = {
  name: "default",
  limit: 100,
  window: "minute",
  burst: 10,
  identifier: "ip",
};

// Whitelisted IPs that bypass rate limiting
const whitelistIPs = new Set(["127.0.0.1", "::1", "localhost"]);

export const publicProcedure = t.procedure.use(async ({ ctx, next, path }) => {
  // Get client IP from headers
  const clientIP = getClientIP(ctx.headers) || "unknown";

  // Skip rate limiting for whitelisted IPs
  if (whitelistIPs.has(clientIP)) {
    return next();
  }

  // Get API key if available
  const apiKey = getAPIKey(ctx.headers);

  // Build identifier
  const identifier = buildIdentifier(clientIP, apiKey, defaultRule.identifier);

  // Check rate limit
  const result = await rateLimiter.check(identifier, path, defaultRule);

  // If rate limit exceeded
  if (!result.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: result.error || "Too many requests",
      cause: {
        retryAfter: result.retryAfter,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
    });
  }

  return next();
});

export const protectedProcedure = t.procedure.use(
  async ({ ctx, next, path }) => {
    // Get client IP from headers
    const clientIP = getClientIP(ctx.headers) || "unknown";

    // Skip rate limiting for whitelisted IPs
    if (!whitelistIPs.has(clientIP)) {
      // Get API key if available
      const apiKey = getAPIKey(ctx.headers);

      // Build identifier with both IP and API key for authenticated users
      const identifier = buildIdentifier(clientIP, apiKey, "ip+apiKey");

      // Check rate limit with higher limit for authenticated users
      const userRule: RateLimitRule = {
        ...defaultRule,
        name: "authenticated",
        limit: 500,
        burst: 50,
      };

      const result = await rateLimiter.check(identifier, path, userRule);

      if (!result.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: result.error || "Too many requests",
          cause: {
            retryAfter: result.retryAfter,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
          },
        });
      }
    }

    // Continue with auth check
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.session.user,
      },
    });
  },
);

export const adminProcedure = t.procedure.use(async ({ ctx, next, path }) => {
  // Apply the same rate limiting as protectedProcedure so admin endpoints are
  // not exempt from DoS / brute-force protection.
  const clientIP = getClientIP(ctx.headers) || "unknown";

  if (!whitelistIPs.has(clientIP)) {
    const apiKey = getAPIKey(ctx.headers);
    const identifier = buildIdentifier(clientIP, apiKey, "ip+apiKey");
    const adminRule: RateLimitRule = {
      ...defaultRule,
      name: "admin",
      limit: 200,
      burst: 20,
    };
    const result = await rateLimiter.check(identifier, path, adminRule);
    if (!result.success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: result.error || "Too many requests",
        cause: {
          retryAfter: result.retryAfter,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        },
      });
    }
  }

  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const dbUser = await withDbRetry(() =>
    ctx.db.user.findUnique({
      where: { id: ctx.session!.user.id },
      select: { id: true, role: true, email: true },
    }),
  );

  const isOwner = dbUser?.email === process.env.OWNER_MAIL;

  if (!isOwner && dbUser?.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
      isOwner,
    },
  });
});
