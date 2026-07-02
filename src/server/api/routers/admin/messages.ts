import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { MessageCategory } from "@/server/db/client";
import { sendSupportReplyEmail } from "../../../email/service";

export const adminMessagesRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        category: z.nativeEnum(MessageCategory).optional(),
        resolved: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db.contactMessage.findMany({
        where: {
          ...(input.category && { category: input.category }),
          ...(input.resolved !== undefined && { resolved: input.resolved }),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        nextCursor = messages.pop()!.id;
      }

      return { messages, nextCursor };
    }),

  counts: adminProcedure.query(async ({ ctx }) => {
    const counts = await ctx.db.contactMessage.groupBy({
      by: ["category"],
      where: { resolved: false },
      _count: true,
    });

    const result: Record<string, number> = {
      CONTACT: 0,
      FEEDBACK: 0,
      REVIEW_FEEDBACK: 0,
      MAINTENANCE_FEEDBACK: 0,
    };

    for (const c of counts) {
      result[c.category] = c._count;
    }

    return result;
  }),

  resolve: adminProcedure
    .input(z.object({ id: z.string(), resolved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.contactMessage.update({
        where: { id: input.id },
        data: { resolved: input.resolved },
      });
      return { success: true };
    }),

  reply: adminProcedure
    .input(z.object({ id: z.string(), replyMessage: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const msg = await ctx.db.contactMessage.findUnique({ where: { id: input.id } });
      if (!msg) throw new Error("Message not found");

      await sendSupportReplyEmail({
        to: msg.email,
        originalMessage: msg.message,
        replyMessage: input.replyMessage,
      });

      await ctx.db.contactMessage.update({
        where: { id: input.id },
        data: { resolved: true },
      });

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.contactMessage.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
