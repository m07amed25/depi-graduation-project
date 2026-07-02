import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";

export const adminEmailTemplatesRouter = createTRPCRouter({
  listTemplates: adminProcedure
    .input(
      z.object({
        category: z.enum(["ONBOARDING", "ANNOUNCEMENT", "FEATURE", "NEWSLETTER", "TRANSACTIONAL", "GENERAL"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.emailTemplate.findMany({
        where: input?.category ? { category: input.category } : undefined,
        orderBy: { updatedAt: "desc" },
      });
    }),

  getTemplate: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.emailTemplate.findUnique({
        where: { id: input.id },
      });
      if (!template) {
        throw new Error("Template not found");
      }
      return template;
    }),

  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(100),
        description: z.string().max(500).optional().nullable(),
        subject: z.string().min(1, "Subject is required").max(200),
        body: z.string().min(1, "Body is required"),
        category: z.enum(["ONBOARDING", "ANNOUNCEMENT", "FEATURE", "NEWSLETTER", "TRANSACTIONAL", "GENERAL"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.emailTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          subject: input.subject,
          body: input.body,
          category: input.category,
        },
      });
    }),

  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required").max(100),
        description: z.string().max(500).optional().nullable(),
        subject: z.string().min(1, "Subject is required").max(200),
        body: z.string().min(1, "Body is required"),
        category: z.enum(["ONBOARDING", "ANNOUNCEMENT", "FEATURE", "NEWSLETTER", "TRANSACTIONAL", "GENERAL"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.emailTemplate.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          subject: input.subject,
          body: input.body,
          category: input.category,
        },
      });
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.emailTemplate.delete({
        where: { id: input.id },
      });
    }),
});
