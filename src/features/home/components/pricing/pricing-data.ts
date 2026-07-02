import { Zap, Rocket, Crown } from "lucide-react";
import { Plan } from "@/lib/plan";
import type { MergedPlan, PlanFeature, CapabilityRow } from "./pricing-types";

export const ACCENT_THEMES: Record<
  string,
  {
    color: string;
    borderColor: string;
    badgeColor: string;
    glow: string;
    borderGlow: string;
    iconShadow: string;
    buttonBg: string;
    buttonHoverBg: string;
    buttonShadow: string;
    buttonOutlineHoverBg: string;
    checkBg: string;
    dividerVia: string;
  }
> = {
  slate: {
    color: "from-slate-500 to-slate-600",
    borderColor: "border-slate-500/50",
    badgeColor: "bg-slate-500 text-white",
    glow: "from-slate-500/10 via-slate-500/5 to-transparent",
    borderGlow: "from-slate-500 via-slate-500 to-slate-600",
    iconShadow: "shadow-slate-500/30",
    buttonBg: "bg-linear-to-r from-slate-500 to-slate-600",
    buttonHoverBg: "hover:from-slate-600 hover:to-slate-700",
    buttonShadow: "shadow-slate-500/40 hover:shadow-slate-500/60",
    buttonOutlineHoverBg: "hover:bg-slate-500/10 hover:border-slate-500",
    checkBg: "bg-linear-to-br from-slate-500 to-slate-600",
    dividerVia: "via-slate-500/30",
  },
  indigo: {
    color: "from-indigo-500 to-violet-600",
    borderColor: "border-indigo-500/50",
    badgeColor: "bg-linear-to-r from-indigo-500 to-violet-600 text-white",
    glow: "from-indigo-500/10 via-violet-500/5 to-transparent",
    borderGlow: "from-indigo-500 via-violet-500 to-purple-600",
    iconShadow: "shadow-indigo-500/40",
    buttonBg: "bg-linear-to-r from-indigo-500 to-violet-600",
    buttonHoverBg: "hover:from-indigo-600 hover:to-violet-700",
    buttonShadow: "shadow-indigo-500/40 hover:shadow-indigo-500/60",
    buttonOutlineHoverBg: "hover:bg-indigo-500/10 hover:border-indigo-500",
    checkBg: "bg-linear-to-br from-indigo-500 to-violet-600",
    dividerVia: "via-indigo-500/30",
  },
  amber: {
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500/40",
    badgeColor: "bg-amber-500 text-white",
    glow: "from-amber-500/8 via-orange-500/5 to-transparent",
    borderGlow: "from-amber-500 via-amber-500 to-orange-600",
    iconShadow: "shadow-amber-500/30",
    buttonBg: "bg-linear-to-r from-amber-500 to-orange-600",
    buttonHoverBg: "hover:from-amber-600 hover:to-orange-700",
    buttonShadow: "shadow-amber-500/40 hover:shadow-amber-500/60",
    buttonOutlineHoverBg: "hover:bg-amber-500/10 hover:border-amber-500",
    checkBg: "bg-linear-to-br from-amber-500 to-orange-600",
    dividerVia: "via-amber-500/30",
  },
  rose: {
    color: "from-rose-500 to-pink-600",
    borderColor: "border-rose-500/40",
    badgeColor: "bg-rose-500 text-white",
    glow: "from-rose-500/10 via-pink-500/5 to-transparent",
    borderGlow: "from-rose-500 via-rose-500 to-pink-600",
    iconShadow: "shadow-rose-500/30",
    buttonBg: "bg-linear-to-r from-rose-500 to-pink-600",
    buttonHoverBg: "hover:from-rose-600 hover:to-pink-700",
    buttonShadow: "shadow-rose-500/40 hover:shadow-rose-500/60",
    buttonOutlineHoverBg: "hover:bg-rose-500/10 hover:border-rose-500",
    checkBg: "bg-linear-to-br from-rose-500 to-pink-600",
    dividerVia: "via-rose-500/30",
  },
  emerald: {
    color: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-500/40",
    badgeColor: "bg-emerald-500 text-white",
    glow: "from-emerald-500/10 via-teal-500/5 to-transparent",
    borderGlow: "from-emerald-500 via-emerald-500 to-teal-600",
    iconShadow: "shadow-emerald-500/30",
    buttonBg: "bg-linear-to-r from-emerald-500 to-teal-600",
    buttonHoverBg: "hover:from-emerald-600 hover:to-teal-700",
    buttonShadow: "shadow-emerald-500/40 hover:shadow-emerald-500/60",
    buttonOutlineHoverBg: "hover:bg-emerald-500/10 hover:border-emerald-500",
    checkBg: "bg-linear-to-br from-emerald-500 to-teal-600",
    dividerVia: "via-emerald-500/30",
  },
  violet: {
    color: "from-violet-500 to-purple-600",
    borderColor: "border-violet-500/40",
    badgeColor: "bg-violet-500 text-white",
    glow: "from-violet-500/10 via-purple-500/5 to-transparent",
    borderGlow: "from-violet-500 via-violet-500 to-purple-600",
    iconShadow: "shadow-violet-500/30",
    buttonBg: "bg-linear-to-r from-violet-500 to-purple-600",
    buttonHoverBg: "hover:from-violet-600 hover:to-purple-700",
    buttonShadow: "shadow-violet-500/40 hover:shadow-violet-500/60",
    buttonOutlineHoverBg: "hover:bg-violet-500/10 hover:border-violet-500",
    checkBg: "bg-linear-to-br from-violet-500 to-purple-600",
    dividerVia: "via-violet-500/30",
  },
  blue: {
    color: "from-blue-500 to-cyan-600",
    borderColor: "border-blue-500/40",
    badgeColor: "bg-blue-500 text-white",
    glow: "from-blue-500/10 via-cyan-500/5 to-transparent",
    borderGlow: "from-blue-500 via-blue-500 to-cyan-600",
    iconShadow: "shadow-blue-500/30",
    buttonBg: "bg-linear-to-r from-blue-500 to-cyan-600",
    buttonHoverBg: "hover:from-blue-600 hover:to-cyan-700",
    buttonShadow: "shadow-blue-500/40 hover:shadow-blue-500/60",
    buttonOutlineHoverBg: "hover:bg-blue-500/10 hover:border-blue-500",
    checkBg: "bg-linear-to-br from-blue-500 to-cyan-600",
    dividerVia: "via-blue-500/30",
  },
};

export const PLAN_DISPLAY_MAP: Record<
  string,
  Pick<MergedPlan, "icon" | "badge" | "cta" | "ctaVariant">
> = {
  [Plan.FREE]: { icon: Zap, badge: null, cta: "Start Free", ctaVariant: "outline" },
  [Plan.PRO]: { icon: Rocket, badge: "Most Popular", cta: "Start Pro Trial", ctaVariant: "default" },
  [Plan.ENTERPRISE]: { icon: Crown, badge: "Best Value", cta: "Go Enterprise", ctaVariant: "outline" },
};

function limitLabel(v: number | null): string {
  return v === null ? "Unlimited" : v.toString();
}

export function buildComparison(
  plans: MergedPlan[],
  capabilities: CapabilityRow[] = [],
): PlanFeature[] {
  return [
    { label: "Repositories", values: plans.map((p) => limitLabel(p.reposLimit)) },
    { label: "AI Reviews / month", values: plans.map((p) => limitLabel(p.reviewsLimit)) },
    { label: "Team seats", values: plans.map((p) => limitLabel(p.seatsLimit)) },
    ...capabilities.map((c) => ({
      label: c.label,
      values: plans.map((pl) =>
        c.plans.some((pc) => pc.planId === pl.id && pc.enabled),
      ),
    })),
  ];
}

export const FAQS = (trialDays: number, annualDiscount: number, trialPlan: string) => [
  { q: "Can I change plans later?", a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated." },
  { q: "What counts as an AI review?", a: "Each pull request or commit batch analysed by our AI engine counts as one review. You can check your usage in your dashboard at any time." },
  { q: "Do you offer a free trial for paid plans?", a: trialDays > 0 ? `Yes! The ${trialPlan.charAt(0) + trialPlan.slice(1).toLowerCase()} plan includes a ${trialDays}-day free trial with no credit card required. Enterprise trials are available on request.` : "Trial periods are not available at this time. All paid plans can be cancelled anytime." },
  { q: "Is there a discount for annual billing?", a: `Yes — switching to annual billing saves you ${annualDiscount}% compared to month-to-month pricing.` },
  { q: "What happens if I exceed my review limit?", a: "We'll notify you before you hit the cap. You can upgrade instantly or wait until your next billing cycle resets." },
  { q: "Do you support self-hosted Git servers?", a: "Ultra plan supports GitHub Enterprise, GitLab Self-Managed, and Bitbucket Data Center. Contact us for custom setups." },
];
