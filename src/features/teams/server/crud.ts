import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { checkUserLimit } from "@/lib/limits";
import { checkFeature } from "@/lib/capabilities";
import { assertRole, slugify } from "./helpers";

export const teamCrudRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.teamMember.findMany({
      where: { userId: ctx.user.id },
      include: {
        team: {
          include: {
            _count: { select: { members: true, repositories: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      ...m.team,
      role: m.role,
      memberCount: m.team._count.members,
      repoCount: m.team._count.repositories,
    }));
  }),

  get: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: input.teamId, userId: ctx.user.id },
        },
      });
      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          repositories: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return { ...team, currentUserRole: membership.role };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().max(255).min(2).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkUserLimit(ctx.db, ctx.user.id, "seatsLimit");
      await checkFeature(ctx.db, ctx.user.id, "team_collaboration");

      const baseSlug = slugify(input.name);

      for (let attempt = 0; attempt <= 10; attempt++) {
        const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
        try {
          return await ctx.db.team.create({
            data: {
              name: input.name,
              slug,
              members: {
                create: {
                  userId: ctx.user.id,
                  role: "OWNER",
                },
              },
            },
          });
        } catch (e) {
          const isUniqueViolation =
            typeof e === "object" &&
            e !== null &&
            (e as { code?: string }).code === "P2002";
          if (isUniqueViolation && attempt < 10) continue;
          throw e;
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not generate a unique team slug",
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        name: z.string().max(255).min(2).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN"]);

      return ctx.db.team.update({
        where: { id: input.teamId },
        data: { name: input.name },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER"]);

      await ctx.db.repository.updateMany({
        where: { teamId: input.teamId },
        data: { teamId: null },
      });

      await ctx.db.team.delete({ where: { id: input.teamId } });
      return { deleted: true };
    }),

  shareRepository: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        repositoryId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN"]);

      const repo = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId, userId: ctx.user.id },
      });
      if (!repo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      return ctx.db.repository.update({
        where: { id: input.repositoryId },
        data: { teamId: input.teamId },
      });
    }),

  unshareRepository: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId, userId: ctx.user.id },
      });
      if (!repo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      return ctx.db.repository.update({
        where: { id: input.repositoryId },
        data: { teamId: null },
      });
    }),
});
