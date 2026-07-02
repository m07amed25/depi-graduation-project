import { PrismaClient } from "./client";

const createPrismaClient = () => {
  let url = process.env.DATABASE_URL;

  if (url) {
    try {
      const parsedUrl = new URL(url);

      // How long (seconds) to wait when establishing a new connection.
      if (!parsedUrl.searchParams.has("connect_timeout")) {
        parsedUrl.searchParams.set("connect_timeout", "30");
      }
      // How long (seconds) to wait for an idle connection from the pool.
      if (!parsedUrl.searchParams.has("pool_timeout")) {
        parsedUrl.searchParams.set("pool_timeout", "30");
      }
      // Detect stale connections quickly so Neon's auto-pause wake-up cycle
      // is short. socket_timeout causes a P1017 sooner rather than later.
      if (!parsedUrl.searchParams.has("socket_timeout")) {
        parsedUrl.searchParams.set("socket_timeout", "20");
      }

      if (
        process.env.NODE_ENV !== "production" &&
        !parsedUrl.searchParams.has("connection_limit")
      ) {
        parsedUrl.searchParams.set("connection_limit", "5");
      }

      url = parsedUrl.toString();
    } catch {
      console.warn("Could not parse DATABASE_URL to inject connection limits.");
    }
  }

  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });
};

const globalPrismaClient = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalPrismaClient.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalPrismaClient.prisma = db;
}

/**
 * Prisma error codes that indicate the database TCP connection was closed or
 * the compute node is waking up (Neon auto-pause). Safe to disconnect the
 * client, wait briefly, and retry once.
 *
 *  P1000 – Authentication failed (sometimes happens during cold start)
 *  P1001 – Can't reach database server (compute still waking)
 *  P1008 – Operations timed out (query took too long while waking)
 *  P1017 – Server has closed the connection (Neon killed the idle socket)
 *  P2024 – A query timed out
 */
const RECONNECT_CODES = new Set(["P1000", "P1001", "P1008", "P1017", "P2024"]);

/**
 * Wraps a Prisma operation with a single retry on connection drop errors.
 * On P1001/P1017 it calls `db.$disconnect()` first so Prisma opens a brand-new
 * connection pool on the retry instead of re-using the broken socket.
 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err
        ? (err as { code: string }).code
        : undefined;

    if (code && RECONNECT_CODES.has(code)) {
      // Drop the broken connection pool so the retry opens a fresh socket.
      await db.$disconnect().catch(() => {});
      // Give Neon a moment to finish waking the compute node.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return await fn();
    }

    throw err;
  }
}
