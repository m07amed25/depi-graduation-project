import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { logAudit } from "../../../services/audit";

export const adminSecurityRouter = createTRPCRouter({
  getAuditLogs: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().max(100).trim().optional(),
        // legacy single-resource filter kept for back-compat
        resource: z.string().max(50).optional(),
        // new: multi-resource for tab-based filtering
        resources: z.array(z.string().max(50)).optional(),
        actorId: z.string().max(255).optional(),
        fromDate: z.string().datetime().optional(),
        toDate: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, resource, resources, actorId, fromDate, toDate } = input;
      const skip = (page - 1) * limit;

      // Merge single + multi resource filters
      const resourceSet = [
        ...(resources ?? []),
        ...(resource ? [resource] : []),
      ].filter(Boolean);

      const auditWhere = {
        ...(resourceSet.length ? { resource: { in: resourceSet } } : {}),
        ...(actorId ? { actorId } : {}),
        ...((fromDate ?? toDate)
          ? {
              createdAt: {
                ...(fromDate ? { gte: new Date(fromDate) } : {}),
                ...(toDate ? { lte: new Date(toDate) } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { action: { contains: search, mode: "insensitive" as const } },
                { resource: { contains: search, mode: "insensitive" as const } },
                { ipAddress: { contains: search, mode: "insensitive" as const } },
                { actor: { name: { contains: search, mode: "insensitive" as const } } },
                { actor: { email: { contains: search, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      };

      const [auditLogs, auditTotal] = await Promise.all([
        ctx.db.auditLog.findMany({
          where: auditWhere,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { id: true, name: true, email: true } } },
        }),
        ctx.db.auditLog.count({ where: auditWhere }),
      ]);

      const structuredLogs = auditLogs.map((l) => ({
        id: l.id,
        source: "system" as const,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        actor: l.actor ?? null,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        country: l.country,
        city: l.city,
        metadata: l.metadata,
        createdAt: l.createdAt,
      }));

      return {
        logs: structuredLogs,
        total: auditTotal,
        pages: Math.ceil(auditTotal / limit),
      };
    }),

  getAuditStats: adminProcedure.query(async ({ ctx }) => {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, last24h, last7d, byResource] = await Promise.all([
      ctx.db.auditLog.count(),
      ctx.db.auditLog.count({ where: { createdAt: { gte: since24h } } }),
      ctx.db.auditLog.count({ where: { createdAt: { gte: since7d } } }),
      ctx.db.auditLog.groupBy({
        by: ["resource"],
        _count: { resource: true },
      }),
    ]);

    return {
      total,
      last24h,
      last7d,
      byResource: Object.fromEntries(
        byResource.map((r) => [r.resource ?? "UNKNOWN", r._count.resource]),
      ),
    };
  }),

  exportAuditLogs: adminProcedure
    .input(
      z.object({
        resource: z.string().max(50).optional(),
        resources: z.array(z.string().max(50)).optional(),
        search: z.string().max(100).trim().optional(),
        actorId: z.string().max(255).optional(),
        fromDate: z.string().datetime().optional(),
        toDate: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { resource, resources, search, actorId, fromDate, toDate } = input;

      const resourceSet = [
        ...(resources ?? []),
        ...(resource ? [resource] : []),
      ].filter(Boolean);

      const where = {
        ...(resourceSet.length ? { resource: { in: resourceSet } } : {}),
        ...(actorId ? { actorId } : {}),
        ...((fromDate ?? toDate)
          ? {
              createdAt: {
                ...(fromDate ? { gte: new Date(fromDate) } : {}),
                ...(toDate ? { lte: new Date(toDate) } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { action: { contains: search, mode: "insensitive" as const } },
                { resource: { contains: search, mode: "insensitive" as const } },
                { ipAddress: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      const logs = await ctx.db.auditLog.findMany({
        where,
        take: 5000,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, email: true } } },
      });

      const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

      const header =
        "id,timestamp,action,resource,resourceId,actor,ip,country,city,userAgent";
      const rows = logs.map((l) =>
        [
          l.id,
          l.createdAt.toISOString(),
          l.action,
          l.resource ?? "",
          l.resourceId ?? "",
          l.actor ? (l.actor.name ?? l.actor.email) : "",
          l.ipAddress ?? "",
          l.country ?? "",
          l.city ?? "",
          l.userAgent ?? "",
        ]
          .map(escape)
          .join(","),
      );

      return { csv: [header, ...rows].join("\n") };
    }),

  getSecuritySettings: adminProcedure.query(async ({ ctx }) => {
    const [
      systemSettings,
      bannedUsersCount,
      activeSessionsCount,
      failedReviewsCount,
    ] = await Promise.all([
      ctx.db.systemSettings.upsert({
        where: { id: "global" },
        update: {},
        create: { id: "global", maintenanceMode: false },
      }),
      ctx.db.user.count({ where: { banned: true } }),
      ctx.db.session.count({
        where: { expiresAt: { gt: new Date() } },
      }),
      ctx.db.review.count({
        where: {
          status: "FAILED",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      maintenanceMode: systemSettings.maintenanceMode,
      bannedUsersCount,
      activeSessionsCount,
      failedReviewsLast24h: failedReviewsCount,
    };
  }),

  getSsoProviders: adminProcedure.query(async ({ ctx }) => {
    const providers = await ctx.db.ssoProvider.findMany({
      orderBy: { createdAt: "asc" },
    });
    return providers.map((p) => {
      const oidcConfig = p.oidcConfig
        ? (JSON.parse(p.oidcConfig) as {
            clientId?: string;
            clientSecret?: string;
          })
        : null;
      const samlConfig = p.samlConfig
        ? (JSON.parse(p.samlConfig) as {
            entryPoint?: string;
            certificate?: string;
          })
        : null;
      return {
        id: p.id,
        name: p.name,
        type: (oidcConfig ? "OIDC" : "SAML") as "OIDC" | "SAML",
        enabled: p.enabled,
        issuer: p.issuer,
        domain: p.domain,
        providerId: p.providerId,
        clientId: oidcConfig?.clientId ?? "",
        clientSecret: oidcConfig?.clientSecret ?? "",
        entryPoint: samlConfig?.entryPoint ?? "",
        certificate: samlConfig?.certificate ?? "",
        createdAt: p.createdAt,
      };
    });
  }),

  upsertSsoProvider: adminProcedure
    .input(
      z.object({
        id: z.string().max(255).optional(),
        name: z.string().min(1).max(100),
        type: z.enum(["OIDC", "SAML"]),
        enabled: z.boolean().default(false),
        issuer: z.string().url().optional().or(z.literal("")),
        clientId: z.string().max(500).optional(),
        clientSecret: z.string().max(500).optional(),
        entryPoint: z.string().url().optional().or(z.literal("")),
        certificate: z.string().max(10000).optional(),
        domain: z.string().max(253).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        id,
        type,
        clientId,
        clientSecret,
        entryPoint,
        certificate,
        domain,
        issuer,
        name,
        enabled,
      } = input;

      const oidcConfig =
        type === "OIDC"
          ? JSON.stringify({
              clientId: clientId ?? "",
              clientSecret: clientSecret ?? "",
            })
          : null;
      const samlConfig =
        type === "SAML"
          ? JSON.stringify({
              entryPoint: entryPoint ?? "",
              certificate: certificate ?? "",
            })
          : null;

      const providerId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const data = {
        name,
        enabled,
        issuer: issuer ?? "",
        domain: domain ?? "",
        oidcConfig,
        samlConfig,
        userId: ctx.user.id,
        providerId,
      };

      const result = id
        ? await ctx.db.ssoProvider.update({ where: { id }, data })
        : await ctx.db.ssoProvider.create({ data });

      void logAudit({
        actorId: ctx.user.id,
        action: id ? "SSO_PROVIDER_UPDATED" : "SSO_PROVIDER_CREATED",
        resource: "SSO_PROVIDER",
        resourceId: result.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { name, type },
      });

      return result;
    }),

  deleteSsoProvider: adminProcedure
    .input(z.object({ id: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.ssoProvider.delete({ where: { id: input.id } });
      void logAudit({
        actorId: ctx.user.id,
        action: "SSO_PROVIDER_DELETED",
        resource: "SSO_PROVIDER",
        resourceId: input.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true };
    }),

  getCustomRoles: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.customRole.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { userRoles: true } } },
    });
  }),

  upsertCustomRole: adminProcedure
    .input(
      z.object({
        id: z.string().max(255).optional(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        canViewReviews: z.boolean().default(true),
        canTriggerReviews: z.boolean().default(false),
        canManageRepositories: z.boolean().default(false),
        canManageTeams: z.boolean().default(false),
        canViewAnalytics: z.boolean().default(false),
        canManageUsers: z.boolean().default(false),
        canAccessAdmin: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = id
        ? await ctx.db.customRole.update({ where: { id }, data })
        : await ctx.db.customRole.create({ data });

      void logAudit({
        actorId: ctx.user.id,
        action: id ? "CUSTOM_ROLE_UPDATED" : "CUSTOM_ROLE_CREATED",
        resource: "CUSTOM_ROLE",
        resourceId: result.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { name: input.name },
      });

      return result;
    }),

  deleteCustomRole: adminProcedure
    .input(z.object({ id: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      if (["role_viewer", "role_reviewer", "role_manager"].includes(input.id)) {
        throw new Error("Built-in roles cannot be deleted.");
      }
      await ctx.db.customRole.delete({ where: { id: input.id } });
      void logAudit({
        actorId: ctx.user.id,
        action: "CUSTOM_ROLE_DELETED",
        resource: "CUSTOM_ROLE",
        resourceId: input.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true };
    }),

  assignCustomRole: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        roleId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.userCustomRole.upsert({
        where: {
          userId_roleId: { userId: input.userId, roleId: input.roleId },
        },
        update: {},
        create: { userId: input.userId, roleId: input.roleId },
      });
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_ROLE_ASSIGNED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { roleId: input.roleId },
      });
      return { success: true };
    }),

  revokeCustomRole: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        roleId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.userCustomRole.deleteMany({
        where: { userId: input.userId, roleId: input.roleId },
      });
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_ROLE_REVOKED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { roleId: input.roleId },
      });
      return { success: true };
    }),

  getUserCustomRoles: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.userCustomRole.findMany({
        where: { userId: input.userId },
        include: { role: true },
      });
    }),

  getRetentionSettings: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.systemSettings.upsert({
      where: { id: "global" },
      update: {},
      create: { id: "global", maintenanceMode: false },
    });
  }),

  updateRetentionSettings: adminProcedure
    .input(
      z.object({
        reviewRetentionDays: z.number().int().min(0).max(3650),
        auditLogRetentionDays: z.number().int().min(0).max(3650),
        sessionRetentionDays: z.number().int().min(0).max(365),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.systemSettings.update({
        where: { id: "global" },
        data: input,
      });
      void logAudit({
        actorId: ctx.user.id,
        action: "RETENTION_SETTINGS_UPDATED",
        resource: "SYSTEM_SETTINGS",
        resourceId: "global",
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: input as Record<string, unknown>,
      });
      return result;
    }),
});
