/**
 * Plan IDs used throughout the application.
 *
 * The Prisma `Plan` enum was removed in favour of the `PricingPlan` model
 * (plain string IDs). This constant object preserves the ergonomic
 * `Plan.FREE` / `Plan.PRO` / `Plan.ENTERPRISE` syntax across all layers.
 * Note: ENTERPRISE is displayed as "Ultra" in the UI but the DB ID remains "enterprise".
 */
export const Plan = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type Plan = (typeof Plan)[keyof typeof Plan];
