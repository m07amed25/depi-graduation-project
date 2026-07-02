import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@/server/db/client";

/**
 * Plan capability enforcement.
 *
 * Capabilities are an admin-managed DB catalog (the `Capability` table) assigned
 * per plan via `PlanCapability`. They are NOT hardcoded here.
 *
 * Adding a capability later:
 *  - display feature: create it on the admin Capabilities page — it appears in the
 *    UI/marketing automatically, no code change needed.
 *  - enforced feature: create it on the admin page, then add a single
 *    `checkFeature(db, userId, "<key>")` call at the action it should gate.
 */

/** Pure rule: given a capability row (or null) and its plan assignment (or null), decide access. */
export function decideCapability(
  capability: { label: string } | null,
  assignment: { enabled: boolean } | null,
): { allowed: boolean; label: string } {
  // Key not in catalog (e.g. admin deleted it) → treat as no longer gated.
  if (!capability) return { allowed: true, label: "" };
  return { allowed: assignment?.enabled === true, label: capability.label };
}

/**
 * Throws TRPCError FORBIDDEN if the user's effective plan lacks the capability.
 * Mirrors checkUserLimit's effective-plan resolution (expired plan → free).
 */
export async function checkFeature(
  db: PrismaClient,
  userId: string,
  key: string,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { planId: true, planExpiresAt: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found during capability check",
    });
  }

  const planExpired =
    user.planExpiresAt && new Date(user.planExpiresAt) < new Date();
  const effectivePlanId = planExpired ? "free" : user.planId;

  const capability = await db.capability.findUnique({ where: { key } });

  if (!capability) {
    console.warn(`[checkFeature] Unknown capability "${key}" — allowing (not gated).`);
    return { allowed: true };
  }

  const assignment = await db.planCapability.findUnique({
    where: {
      planId_capabilityId: {
        planId: effectivePlanId,
        capabilityId: capability.id,
      },
    },
  });

  const { allowed, label } = decideCapability(capability, assignment);

  if (!allowed) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your plan doesn't include ${label}. Upgrade your plan to unlock it.`,
    });
  }

  return { allowed: true };
}


/** Non-throwing capability check — for background jobs / conditional behaviour. */
export async function hasFeature(
  db: PrismaClient,
  userId: string,
  key: string,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { planId: true, planExpiresAt: true },
  });
  if (!user) return false;

  const planExpired =
    user.planExpiresAt && new Date(user.planExpiresAt) < new Date();
  const effectivePlanId = planExpired ? "free" : user.planId;

  const capability = await db.capability.findUnique({ where: { key } });
  if (!capability) return true; // unknown key → not gated

  const assignment = await db.planCapability.findUnique({
    where: {
      planId_capabilityId: { planId: effectivePlanId, capabilityId: capability.id },
    },
  });
  return decideCapability(capability, assignment).allowed;
}

/**
 * Capability keys that MUST be enforced in code (via checkFeature/hasFeature).
 * Add a key here when a capability should gate real behaviour, then wire the call.
 * The contract test (capabilities.contract.test.ts) fails if any of these is unwired.
 */
export const ENFORCED_CAPABILITIES = [
  "private_repos",
  "team_collaboration",
  "advanced_analytics",
  "custom_review_rules",
  "pr_inline_comments",
] as const;
