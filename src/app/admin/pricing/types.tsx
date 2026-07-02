"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plan } from "@/lib/plan";
import { Zap, Rocket, Crown } from "lucide-react";

export interface PricingPlan {
  id: Plan;
  name: string;
  tagline: string;
  monthlyPrice: number;
  highlight: boolean;
  visible: boolean;
  features: string[];
  reposLimit: number | null;
  reviewsLimit: number | null;
  seatsLimit: number | null;
  privateRepos: boolean;
  sortOrder: number;
  accentColor: string;
  cta?: string | null;
  badge?: string | null;
}

export const PLAN_DISPLAY: Record<
  Plan,
  { icon: React.ElementType; iconColor: string }
> = {
  [Plan.FREE]: { icon: Zap, iconColor: "text-slate-500" },
  [Plan.PRO]: { icon: Rocket, iconColor: "text-indigo-500" },
  [Plan.ENTERPRISE]: { icon: Crown, iconColor: "text-amber-500" },
};

export const ACCENT_STYLES: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  slate: {
    bg: "bg-slate-50 dark:bg-slate-900",
    text: "text-slate-500",
    ring: "ring-slate-500/40 border-slate-500/40",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-500",
    ring: "ring-indigo-500/40 border-indigo-500/40",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-500",
    ring: "ring-amber-500/40 border-amber-500/40",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-500",
    ring: "ring-rose-500/40 border-rose-500/40",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-500",
    ring: "ring-emerald-500/40 border-emerald-500/40",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-500",
    ring: "ring-violet-500/40 border-violet-500/40",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-500",
    ring: "ring-blue-500/40 border-blue-500/40",
  },
};

export const PLAN_OPTIONS = [
  { value: "all", label: "All plans" },
  { value: Plan.FREE, label: "Free" },
  { value: Plan.PRO, label: "Pro" },
  { value: Plan.ENTERPRISE, label: "Ultra" },
];

export function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        active
          ? "border-green-500/40 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "border-muted bg-muted/40 text-muted-foreground",
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
