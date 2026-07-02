import { z } from "zod";
import { withDbRetry } from "../../../db";
import {
  createTRPCRouter,
  adminProcedure,
  publicProcedure,
  protectedProcedure,
} from "../../trpc";
import { sendSupportReplyEmail } from "../../../email/service";
import { inngest } from "../../../inngest";
import { logAudit } from "../../../services/audit";

export const adminSettingsRouter = createTRPCRouter({
  getSystemSettings: adminProcedure.query(async ({ ctx }) => {
    return withDbRetry(() =>
      ctx.db.systemSettings.upsert({
        where: { id: "global" },
        update: {},
        create: { id: "global", maintenanceMode: false },
      }),
    );
  }),

  updateSystemSettings: adminProcedure
    .input(z.object({ maintenanceMode: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.systemSettings.update({
        where: { id: "global" },
        data: { maintenanceMode: input.maintenanceMode },
      });
    }),

  getBannerSettings: publicProcedure.query(async ({ ctx }) => {
    const settings = await withDbRetry(() =>
      ctx.db.systemSettings.upsert({
        where: { id: "global" },
        update: {},
        create: { id: "global", maintenanceMode: false },
      }),
    );
    return {
      enabled: settings.bannerEnabled,
      text: settings.bannerText,
      link: settings.bannerLink,
      linkText: settings.bannerLinkText,
      color: settings.bannerColor,
    };
  }),

  updateBannerSettings: adminProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        text: z.string().max(500),
        link: z.string().max(500).optional().default(""),
        linkText: z.string().max(100).optional().default(""),
        color: z
          .enum(["indigo", "emerald", "amber", "rose", "violet"])
          .default("indigo"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.systemSettings.upsert({
        where: { id: "global" },
        update: {
          bannerEnabled: input.enabled,
          bannerText: input.text,
          bannerLink: input.link,
          bannerLinkText: input.linkText,
          bannerColor: input.color,
        },
        create: {
          id: "global",
          maintenanceMode: false,
          bannerEnabled: input.enabled,
          bannerText: input.text,
          bannerLink: input.link,
          bannerLinkText: input.linkText,
          bannerColor: input.color,
        },
      });
    }),

  getSupportMessages: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.supportMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  updateSupportStatus: adminProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supportMessage.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  replyToSupportMessage: adminProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email(),
        replyMessage: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.supportMessage.findUnique({
        where: { id: input.id },
      });

      if (!message) {
        throw new Error("Message not found");
      }

      await sendSupportReplyEmail({
        to: input.email,
        originalMessage: message.message,
        replyMessage: input.replyMessage,
      });

      return ctx.db.supportMessage.update({
        where: { id: input.id },
        data: { status: "RESOLVED" },
      });
    }),

  submitSupportMessage: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        message: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supportMessage.create({
        data: {
          email: input.email,
          message: input.message,
        },
      });
    }),

  submitFeedback: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1).max(200),
        message: z.string().min(1).max(5000),
        category: z
          .enum(["BUG", "FEATURE", "GENERAL", "OTHER"])
          .default("GENERAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supportMessage.create({
        data: {
          userId: ctx.user.id,
          name: ctx.user.name ?? undefined,
          email: ctx.user.email,
          subject: `[${input.category}] ${input.subject}`,
          message: input.message,
          type: "FEEDBACK",
        },
      });
    }),

  getAppFeedbacks: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(["ALL", "PENDING", "RESOLVED"]).default("ALL"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status } = input;
      const skip = (page - 1) * limit;
      const where = {
        type: "FEEDBACK",
        ...(status !== "ALL" ? { status } : {}),
      };

      const [feedbacks, total] = await Promise.all([
        ctx.db.supportMessage.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.supportMessage.count({ where }),
      ]);

      return { feedbacks, total, pages: Math.ceil(total / limit) };
    }),

  replyToAppFeedback: adminProcedure
    .input(
      z.object({
        id: z.string().max(255),
        replyMessage: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const feedback = await ctx.db.supportMessage.findUnique({
        where: { id: input.id },
      });

      if (!feedback) throw new Error("Feedback not found");
      if (!feedback.email) throw new Error("No email address on this feedback");

      await sendSupportReplyEmail({
        to: feedback.email,
        originalMessage: feedback.message,
        replyMessage: input.replyMessage,
      });

      return ctx.db.supportMessage.update({
        where: { id: input.id },
        data: { status: "RESOLVED" },
      });
    }),

  sendTestBroadcastEmail: adminProcedure
    .input(
      z.object({
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(50000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { sendBroadcastEmail } = await import("../../../email/service");

      await sendBroadcastEmail({
        to: ctx.user.email,
        subject: input.subject,
        body: input.body,
        userName: ctx.user.name ?? "Admin",
      });

      return { success: true };
    }),

  sendBroadcastEmail: adminProcedure
    .input(
      z.object({
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(50000),
        target: z.union([
          z.enum(["ALL", "FREE", "PRO"]),
          z.array(z.string().email()),
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await inngest.send({
        name: "app/email.broadcast",
        data: {
          subject: input.subject,
          body: input.body,
          target: input.target,
        },
      });

      void logAudit({
        actorId: ctx.user.id,
        action: "BROADCAST_EMAIL_SENT",
        resource: "SYSTEM",
        resourceId: "EMAIL",
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: {
          subject: input.subject,
          target: input.target,
        },
      });

      return { success: true };
    }),
});
