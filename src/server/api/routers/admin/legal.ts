import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";

export const adminLegalRouter = createTRPCRouter({
  legalList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.legalPage.findMany({ orderBy: { slug: "asc" } });
  }),

  legalGet: adminProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.legalPage.findUnique({ where: { slug: input.slug } });
    }),

  legalUpsert: adminProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(50),
        title: z.string().min(1).max(200),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.legalPage.upsert({
        where: { slug: input.slug },
        create: { slug: input.slug, title: input.title, content: input.content },
        update: { title: input.title, content: input.content },
      });
    }),
});
