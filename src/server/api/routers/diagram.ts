import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { inngest } from "@/server/inngest";
import { getAccessibleRepository } from "@/lib/repository";
import {
  getGitHubAccessToken,
  fetchRepositoryFiles,
} from "@/server/services/github";
import { matchTriggerRules } from "@/server/services/diagram-generator";

export const diagramRouter = createTRPCRouter({
  /**
   * Lightweight check: does this repository contain files that indicate a
   * database layer (Prisma schemas, SQL migrations, entity files, etc.)?
   * The UI uses this to conditionally show the Entity tab.
   */
  hasEntityFiles: protectedProcedure
    .input(z.object({ repositoryId: z.string().max(255).cuid() }))
    .query(async ({ ctx, input }) => {
      const repo = await getAccessibleRepository(
        ctx.db,
        ctx.user.id,
        input.repositoryId,
      );

      // If we already generated an ERD diagram for this repo, skip the API call.
      const existingDiagram = await ctx.db.diagram.findFirst({
        where: { repositoryId: input.repositoryId, type: "ERD" },
        select: { id: true },
      });
      if (existingDiagram) return true;

      // Otherwise, fetch the file tree from GitHub and check patterns.
      const accessToken = await getGitHubAccessToken(ctx.user.id);
      if (!accessToken) return false;

      const [owner, repoName] = (repo.fullName ?? "").split("/");
      if (!owner || !repoName) return false;

      try {
        const files = await fetchRepositoryFiles(accessToken, owner, repoName);
        const matched = matchTriggerRules(files.map((f) => f.path));
        return matched.includes("ERD");
      } catch {
        // If the tree fetch fails (permissions, empty repo, etc.) fall back
        // to showing the tab so the user can still try generating.
        return true;
      }
    }),

  /** List all diagrams for a repository (owner or team member). */
  listForRepository: protectedProcedure
    .input(z.object({ repositoryId: z.string().max(255).cuid() }))
    .query(async ({ ctx, input }) => {
      await getAccessibleRepository(ctx.db, ctx.user.id, input.repositoryId);
      return ctx.db.diagram.findMany({
        where: { repositoryId: input.repositoryId },
        orderBy: { createdAt: "asc" },
      });
    }),

  /** Get a single diagram by id (owner or team member). */
  getById: protectedProcedure
    .input(z.object({ id: z.string().max(255).max(255).cuid() }))
    .query(async ({ ctx, input }) => {
      const diagram = await ctx.db.diagram.findUnique({
        where: { id: input.id },
        include: { repository: { select: { id: true, userId: true } } },
      });
      if (!diagram) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Diagram not found",
        });
      }
      await getAccessibleRepository(ctx.db, ctx.user.id, diagram.repository.id);
      return diagram;
    }),

  /**
   * Request (or re-request) generation of a diagram type for a repository.
   * Creates/resets the Diagram record and dispatches the Inngest job.
   * Accessible to the repository owner and team members.
   */
  requestDiagram: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255).cuid(),
        prNumber: z.number().int().optional(), // optional since we might trigger manually without a PR
        type: z.enum(["ERD"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getAccessibleRepository(ctx.db, ctx.user.id, input.repositoryId);

      const diagram = await ctx.db.diagram.upsert({
        where: {
          repositoryId_type: {
            repositoryId: input.repositoryId,
            type: input.type,
          },
        },
        create: {
          repositoryId: input.repositoryId,
          type: input.type,
          status: "PENDING",
        },
        update: {
          status: "PENDING",
          definition: null,
          nodes: undefined,
          edges: undefined,
          error: null,
          generatedAt: null,
        },
      });

      try {
        await inngest.send({
          name: "diagram/generation.requested",
          data: {
            diagramId: diagram.id,
            repositoryId: input.repositoryId,
            userId: ctx.user.id,
            prNumber: input.prNumber, // undefined when not provided; generate-diagram fetches the default branch tree instead
            reviewId: "",
            type: input.type,
          },
        });
      } catch {
        await ctx.db.diagram.update({
          where: { id: diagram.id },
          data: { status: "FAILED", error: "Failed to queue diagram job" },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to queue diagram generation job",
        });
      }

      return diagram;
    }),
});
