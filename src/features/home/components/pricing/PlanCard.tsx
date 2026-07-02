"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowRight, Flame, Crown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Plan } from "@/lib/plan";
import { useSession } from "@/lib/auth-client";
import type { MergedPlan } from "./pricing-types";

export function PlanCard({
  plan,
  yearly,
  index,
  freeSignupEnabled,
  annualDiscount,
}: {
  plan: MergedPlan;
  yearly: boolean;
  index: number;
  freeSignupEnabled: boolean;
  annualDiscount: number;
}) {
  const isFreeUnavailable = plan.id === Plan.FREE && !freeSignupEnabled;
  const yearlyMonthlyPrice =
    plan.monthlyPrice > 0
      ? Math.round(plan.monthlyPrice * (1 - annualDiscount / 100))
      : 0;
  const price = yearly ? yearlyMonthlyPrice : plan.monthlyPrice;
  const Icon = plan.icon;
  const savings =
    !yearly && plan.monthlyPrice > 0
      ? (plan.monthlyPrice - yearlyMonthlyPrice) * 12
      : 0;
  const { data: session } = useSession();

  const getCtaHref = () => {
    if (isFreeUnavailable) return "/contact";
    if (session && plan.id !== Plan.FREE) {
      return `/billing/pay?plan=${plan.id}&cycle=${yearly ? "yearly" : "monthly"}`;
    }
    return "/sign-up";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: plan.highlight ? -6 : -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative flex flex-col rounded-3xl border bg-card p-8 transition-all duration-300",
        plan.highlight
          ? `border-transparent shadow-2xl scale-[1.03] z-10 shadow-${plan.accentColor || "indigo"}-500/25`
          : "border-border/60 hover:border-border hover:shadow-xl",
      )}
    >
      {plan.highlight && (
        <div className={`absolute inset-0 rounded-3xl bg-linear-to-br ${plan.borderGlow} p-px -z-10`}>
          <div className="h-full w-full rounded-3xl bg-card" />
        </div>
      )}
      <div className={`pointer-events-none absolute -inset-px rounded-3xl bg-linear-to-br ${plan.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.12 + 0.3, type: "spring", stiffness: 200 }}
            className={cn("relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide shadow-lg", plan.badgeColor)}
          >
            {plan.highlight && <Flame className="h-3 w-3" />}
            {plan.id === Plan.ENTERPRISE && <Crown className="h-3 w-3" />}
            {plan.badge}
          </motion.span>
        </div>
      )}

      <div className="mb-6 mt-2">
        <div className={cn("mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br shadow-lg", plan.color, plan.iconShadow)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={price}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "text-5xl font-extrabold tracking-tight",
                (plan.highlight || plan.monthlyPrice > 0) && `bg-linear-to-r ${plan.color} bg-clip-text text-transparent`,
              )}
            >
              ${price}
            </motion.span>
          </AnimatePresence>
          {price > 0 && <span className="mb-1.5 text-muted-foreground">/ mo{yearly ? "*" : ""}</span>}
          {price === 0 && <span className="mb-1.5 text-muted-foreground">/ forever</span>}
        </div>
        {yearly && yearlyMonthlyPrice > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">Billed annually (${yearlyMonthlyPrice * 12}/yr)</p>
        )}
        {savings > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900/30">
            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-xs font-bold text-green-700 dark:text-green-400">Save ${savings}/yr switching to annual</span>
          </motion.div>
        )}
      </div>

      <Button
        variant={plan.highlight ? "default" : plan.ctaVariant}
        className={cn(
          "mb-8 w-full gap-2 font-bold text-base h-12 transition-all duration-200",
          plan.highlight && `${plan.buttonBg} ${plan.buttonHoverBg} border-0 text-white shadow-lg ${plan.buttonShadow} hover:scale-[1.02]`,
          !plan.highlight && plan.monthlyPrice > 0 && `${plan.borderColor} ${plan.buttonOutlineHoverBg} hover:scale-[1.02]`,
          isFreeUnavailable && "opacity-60 cursor-not-allowed",
        )}
        size="lg"
        asChild
      >
        {isFreeUnavailable ? (
          <Link href="/contact">Join Waitlist <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link>
        ) : (
          <Link href={getCtaHref()}>{plan.cta} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link>
        )}
      </Button>

      <div className={cn("mb-6 h-px w-full", plan.highlight ? `bg-linear-to-r from-transparent ${plan.dividerVia} to-transparent` : "bg-border/50")} />

      <ul className="flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm", plan.monthlyPrice > 0 || plan.highlight ? `${plan.checkBg} text-white` : "bg-muted text-muted-foreground")}>
              <Check className="h-3 w-3" />
            </span>
            <span className="text-foreground/80">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
