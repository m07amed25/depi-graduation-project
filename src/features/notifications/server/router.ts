import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  // Get all notifications for the current user
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().max(255).optional(),
          unreadOnly: z.boolean().default(false),
          type: z.string().optional(),
          search: z.string().max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;
      const unreadOnly = input?.unreadOnly ?? false;
      const type = input?.type;
      const search = input?.search;

      const where = {
        userId: ctx.user.id,
        ...(unreadOnly ? { read: false } : {}),
        ...(type && type !== "all" ? { type: type as any } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                { message: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      const notifications = await ctx.db.notification.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  // Get unread notification count
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: {
        userId: ctx.user.id,
        read: false,
      },
    });
    return { count };
  }),

  // Mark a notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.update({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        data: { read: true },
      });
      return notification;
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: {
        userId: ctx.user.id,
        read: false,
      },
      data: { read: true },
    });
    return { success: true };
  }),

  // Delete a notification
  delete: protectedProcedure
    .input(z.object({ id: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.delete({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });
      return { success: true };
    }),
});
