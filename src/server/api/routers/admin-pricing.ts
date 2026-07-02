import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createTRPCRouter, adminProcedure } from "../trpc";
import { DiscountType } from "../../db/client";

const slugifyKey = (k: string) =>
  k.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

function revalidatePublic() {
  try {
    revalidatePath("/pricing");
    revalidatePath("/");
  } catch {
    // ignore
  }
}


const discountCreateSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, digits, - or _"),
  description: z.string().max(200).optional(),
  type: z.nativeEnum(DiscountType),
  value: z.number().min(0).max(100),
  planId: z.string().nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  active: z.boolean().default(true),
  expiresAt: z.date().nullable().optional(),
});

const discountUpdateSchema = discountCreateSchema.partial().extend({
  id: z.string().cuid(),
});

const overrideCreateSchema = z.object({
  email: z.string().email(),
  planId: z.string(),
  overrideMonthlyPrice: z.number().int().min(0).nullable().optional(),
  overrideYearlyPrice: z.number().min(0).nullable().optional(),
  reason: z.string().max(300).optional(),
  active: z.boolean().default(true),
  expiresAt: z.date().nullable().optional(),
});

const overrideUpdateSchema = overrideCreateSchema.partial().extend({
  id: z.string().cuid(),
});

const partnerCreateSchema = z.object({
  domain: z
    .string()
    .min(3)
    .max(253)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Enter a valid domain, e.g. acme.com"),
  companyName: z.string().min(1).max(200),
  planId: z.string(),
  overrideMonthlyPrice: z.number().int().min(0).nullable().optional(),
  overrideYearlyPrice: z.number().min(0).nullable().optional(),
  note: z.string().max(500).optional(),
  active: z.boolean().default(true),
  expiresAt: z.date().nullable().optional(),
});

const partnerUpdateSchema = partnerCreateSchema.partial().extend({
  id: z.string().cuid(),
});

const pricingSettingsSchema = z.object({
  pricingEnabled:       z.boolean(),
  annualDiscount:       z.number().int().min(0).max(80),
  trialDays:            z.number().int().min(0).max(90),
  trialPlan:            z.string(),
  gracePeriodDays:      z.number().int().min(0).max(14),
  refundEnabled:        z.boolean(),
  refundWindowDays:     z.number().int().min(1).max(60),
  taxEnabled:           z.boolean(),
  taxRate:              z.number().min(0).max(50),
  promoCodesAtCheckout: z.boolean(),
  freeSignupEnabled:    z.boolean(),
});

const planSaveSchema = z.object({
  id:           z.string(),
  name:         z.string().min(1).max(50),
  tagline:      z.string().max(200),
  monthlyPrice: z.number().int().min(0),
  visible:      z.boolean(),
  highlight:    z.boolean(),
  features:     z.array(z.string().min(1).max(200)).max(20),
  reposLimit:   z.number().int().min(0).nullable(),
  reviewsLimit: z.number().int().min(0).nullable(),
  seatsLimit:   z.number().int().min(0).nullable(),
  privateRepos: z.boolean(),
  accentColor:  z.string().min(1).max(20).default("indigo"),
  cta:          z.string().max(40).nullable().optional(),
  badge:        z.string().max(40).nullable().optional(),
});


export const adminPricingRouter = createTRPCRouter({

  listDiscounts: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.discount.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  createDiscount: adminProcedure
    .input(discountCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const code = input.code.toUpperCase();

      const existing = await ctx.db.discount.findUnique({ where: { code } });
      if (existing) {
        throw new Error(`Code "${code}" already exists`);
      }

      return ctx.db.discount.create({
        data: {
          ...input,
          code,
          planId: input.planId ?? null,
          maxUses: input.maxUses ?? null,
          expiresAt: input.expiresAt ?? null,
        },
      });
    }),

  updateDiscount: adminProcedure
    .input(discountUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, code, ...rest } = input;

      if (code) {
        const upper = code.toUpperCase();
        const conflict = await ctx.db.discount.findFirst({
          where: { code: upper, NOT: { id } },
        });
        if (conflict) {
          throw new Error(`Code "${upper}" already exists`);
        }
        return ctx.db.discount.update({
          where: { id },
          data: { ...rest, code: upper },
        });
      }

      return ctx.db.discount.update({ where: { id }, data: rest });
    }),

  deleteDiscount: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.discount.delete({ where: { id: input.id } });
      return { success: true };
    }),

  toggleDiscount: adminProcedure
    .input(z.object({ id: z.string().cuid(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.discount.update({
        where: { id: input.id },
        data: { active: input.active },
      });
    }),

  // ── User price overrides ────────────────────────────────────────────────────

  listOverrides: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.userPriceOverride.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  createOverride: adminProcedure
    .input(overrideCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const conflict = await ctx.db.userPriceOverride.findUnique({
        where: { email_planId: { email: input.email, planId: input.planId } },
      });
      if (conflict) {
        throw new Error(
          `An override for ${input.email} on the ${input.planId} plan already exists`,
        );
      }

      return ctx.db.userPriceOverride.create({
        data: {
          ...input,
          overrideMonthlyPrice: input.overrideMonthlyPrice ?? null,
          overrideYearlyPrice: input.overrideYearlyPrice ?? null,
          reason: input.reason ?? null,
          expiresAt: input.expiresAt ?? null,
        },
      });
    }),

  updateOverride: adminProcedure
    .input(overrideUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      return ctx.db.userPriceOverride.update({ where: { id }, data: rest });
    }),

  deleteOverride: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.userPriceOverride.delete({ where: { id: input.id } });
      return { success: true };
    }),

  toggleOverride: adminProcedure
    .input(z.object({ id: z.string().cuid(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPriceOverride.update({
        where: { id: input.id },
        data: { active: input.active },
      });
    }),


  listPartners: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.partnerDomain.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  createPartner: adminProcedure
    .input(partnerCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const domain = input.domain.toLowerCase().trim();
      const existing = await ctx.db.partnerDomain.findUnique({ where: { domain } });
      if (existing) {
        throw new Error(`Domain "${domain}" already has a partner override`);
      }
      return ctx.db.partnerDomain.create({
        data: {
          ...input,
          domain,
          overrideMonthlyPrice: input.overrideMonthlyPrice ?? null,
          overrideYearlyPrice: input.overrideYearlyPrice ?? null,
          note: input.note ?? null,
          expiresAt: input.expiresAt ?? null,
        },
      });
    }),

  updatePartner: adminProcedure
    .input(partnerUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, domain, ...rest } = input;
      if (domain) {
        const lower = domain.toLowerCase().trim();
        const conflict = await ctx.db.partnerDomain.findFirst({
          where: { domain: lower, NOT: { id } },
        });
        if (conflict) throw new Error(`Domain "${lower}" already exists`);
        return ctx.db.partnerDomain.update({
          where: { id },
          data: { ...rest, domain: lower },
        });
      }
      return ctx.db.partnerDomain.update({ where: { id }, data: rest });
    }),

  deletePartner: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.partnerDomain.delete({ where: { id: input.id } });
      return { success: true };
    }),

  togglePartner: adminProcedure
    .input(z.object({ id: z.string().cuid(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.partnerDomain.update({
        where: { id: input.id },
        data: { active: input.active },
      });
    }),

  getSettings: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.pricingSettings.upsert({
      where: { id: "global" },
      create: { id: "global" },
      update: {},
    });
  }),

  saveSettings: adminProcedure
    .input(pricingSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.pricingSettings.upsert({
        where: { id: "global" },
        create: { id: "global", ...input },
        update: input,
      });

      try {
        revalidatePath("/pricing");
        revalidatePath("/");
      } catch (e) {
        console.error("Failed to revalidate path", e);
      }

      return result;
    }),

  listPlans: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.pricingPlan.findMany({ orderBy: { sortOrder: "asc" } });
  }),

  savePlan: adminProcedure
    .input(planSaveSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const sortOrder = id === "free" ? 0 : id === "pro" ? 1 : 2;
      const result = await ctx.db.pricingPlan.upsert({
        where: { id },
        create: { id, sortOrder, ...data },
        update: data,
      });
      
      try {
        revalidatePath("/pricing");
        revalidatePath("/");
      } catch (e) {
        // console.error("Failed to revalidate path", e);
      }
      
      return result;
    }),

  listCapabilities: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.capability.findMany({
      orderBy: { sortOrder: "asc" },
      include: { plans: true },
    });
  }),

  createCapability: adminProcedure
    .input(
      z.object({
        key: z.string().min(2).max(50),
        label: z.string().min(1).max(80),
        description: z.string().max(300).optional(),
        kind: z.enum(["enforced", "display"]).default("display"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const key = slugifyKey(input.key);
      if (!key) throw new Error("Invalid capability key");
      const existing = await ctx.db.capability.findUnique({ where: { key } });
      if (existing) throw new Error(`Capability "${key}" already exists`);
      const { _max } = await ctx.db.capability.aggregate({
        _max: { sortOrder: true },
      });
      const result = await ctx.db.capability.create({
        data: {
          ...input,
          key,
          sortOrder: (_max.sortOrder ?? -1) + 1,
          description: input.description ?? null,
        },
      });
      revalidatePublic();
      return result;
    }),

  updateCapability: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        key: z.string().min(2).max(50).optional(),
        label: z.string().min(1).max(80).optional(),
        description: z.string().max(300).nullable().optional(),
        kind: z.enum(["enforced", "display"]).optional(),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, key, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (!ctx.isOwner) delete data.sortOrder;
      if (key !== undefined) {
        const norm = slugifyKey(key);
        if (!norm) throw new Error("Invalid capability key");
        const conflict = await ctx.db.capability.findFirst({
          where: { key: norm, NOT: { id } },
        });
        if (conflict) throw new Error(`Capability "${norm}" already exists`);
        data.key = norm;
      }
      const result = await ctx.db.capability.update({ where: { id }, data });
      revalidatePublic();
      return result;
    }),

  deleteCapability: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.capability.delete({ where: { id: input.id } });
      revalidatePublic();
      return { success: true };
    }),

  setPlanCapability: adminProcedure
    .input(
      z.object({
        planId: z.string().min(1),
        capabilityId: z.string().min(1),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.planCapability.upsert({
        where: {
          planId_capabilityId: {
            planId: input.planId,
            capabilityId: input.capabilityId,
          },
        },
        create: input,
        update: { enabled: input.enabled },
      });
      revalidatePublic();
      return result;
    }),
});
