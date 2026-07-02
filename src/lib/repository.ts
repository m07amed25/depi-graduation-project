import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@/server/db/client";

export type AccessibleRepository = NonNullable<
  Awaited<ReturnType<PrismaClient["repository"]["findUnique"]>>
>;

export async function getAccessibleRepository(
  db: PrismaClient,
  userId: string,
  repositoryId: string,
): Promise<AccessibleRepository> {
  if (!db || typeof db.repository === "undefined") {
    throw new Error("Invalid database client instance");
  }

  const repository = await db.repository.findFirst({
    where: {
      id: repositoryId,
      OR: [{ userId }, { team: { members: { some: { userId } } } }],
    },
  });

  if (!repository) {
    const exists = await db.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!exists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Repository not found",
      });
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this repository",
    });
  }

  return repository;
}
