"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X as XIcon, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Plan } from "@/lib/plan";
import {
  PLAN_DISPLAY_MAP,
  ACCENT_THEMES,
  buildComparison,
  FAQS,
} from "./pricing";
import type { PricingSettings, DbPricingPlan, MergedPlan, CapabilityRow } from "./pricing";

export type { PricingSettings, DbPricingPlan } from "./pricing";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const cardReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function PricingContent({
  settings,
  plans: dbPlans,
  capabilities = [],
}: {
  settings: PricingSettings;
  plans: DbPricingPlan[];
  capabilities?: CapabilityRow[];
}) {
  const { annualDiscount, trialDays, trialPlan } = settings;
  const [yearly, setYearly] = useState(true);

  const mergedPlans: MergedPlan[] = dbPlans.map((p) => {
    const theme = ACCENT_THEMES[p.accentColor] ?? ACCENT_THEMES.slate!;
    const display = PLAN_DISPLAY_MAP[p.id as Plan] ?? PLAN_DISPLAY_MAP[Plan.FREE]!;
    return {
      ...p,
      ...display,
      ...theme,
      cta: p.cta || display.cta,
      badge: p.badge ?? null,
    };
  });

  const comparison = buildComparison(mergedPlans, capabilities);
  const faqs = FAQS(trialDays, annualDiscount, trialPlan);

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        {/* Header */}
        <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={0} className="text-2xl sm:text-3xl font-bold tracking-tight">Pricing</motion.h1>
        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={1} className="mt-2 text-muted-foreground text-sm max-w-[55ch]">
          Free for individuals and open source. Pro and Ultra scale with your team. All plans include GitHub integration and AI-powered reviews.
        </motion.p>

        {/* Billing toggle */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="mt-8 flex items-center gap-1 text-sm border border-border rounded-sm w-fit p-0.5">
          <button
            onClick={() => setYearly(false)}
            className={cn("px-3 py-1.5 rounded-[3px] transition-colors", !yearly ? "bg-muted text-foreground font-medium" : "text-muted-foreground")}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn("px-3 py-1.5 rounded-[3px] transition-colors", yearly ? "bg-muted text-foreground font-medium" : "text-muted-foreground")}
          >
            Yearly <span className="text-primary font-mono text-xs ml-1">-{annualDiscount}%</span>
          </button>
        </motion.div>

        {/* Plans row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } } }}
          className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-sm overflow-hidden"
        >
          {mergedPlans.map((plan) => {
            const price = yearly
              ? Math.round(plan.monthlyPrice * (1 - annualDiscount / 100))
              : plan.monthlyPrice;

            return (
              <motion.div key={plan.id} variants={cardReveal} className={cn(
                "relative p-6 sm:p-8 flex flex-col overflow-hidden",
                plan.highlight ? "bg-card" : "bg-background"
              )}>
                {/* Top accent glow */}
                <div className={cn("absolute inset-x-0 top-0 h-24 opacity-[0.07] bg-linear-to-b pointer-events-none", plan.glow)} />

                <div className="relative flex items-center gap-2">
                  <h3 className={cn("text-[0.9375rem] font-bold bg-linear-to-r bg-clip-text", plan.color)} style={{ WebkitTextFillColor: "unset" }}>{plan.name}</h3>
                  {plan.badge && (
                    <span className={cn("text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm", plan.badgeColor)}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="relative mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

                <div className="relative mt-5 flex items-baseline gap-1">
                  {price === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
                {yearly && plan.monthlyPrice > 0 && (
                  <p className="relative mt-1 text-xs text-muted-foreground">
                    ${plan.monthlyPrice}/mo billed monthly
                  </p>
                )}

                <Link
                  href="/sign-up"
                  className={cn(
                    "relative mt-6 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-sm transition-all duration-150",
                    plan.ctaVariant === "default"
                      ? cn("text-white shadow-lg", plan.buttonBg, plan.buttonHoverBg, plan.buttonShadow)
                      : cn("border text-foreground", plan.borderColor, plan.buttonOutlineHoverBg),
                  )}
                >
                  {plan.cta}
                </Link>

                {trialDays > 0 && plan.id === trialPlan.toLowerCase() && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    {trialDays}-day free trial
                  </p>
                )}

                {/* Limits */}
                <div className="relative mt-6 pt-4 border-t border-border/40 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Repositories</span>
                    <span className="font-mono text-xs text-foreground">{plan.reposLimit === null ? "Unlimited" : plan.reposLimit}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Reviews/month</span>
                    <span className="font-mono text-xs text-foreground">{plan.reviewsLimit === null ? "Unlimited" : plan.reviewsLimit}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Team seats</span>
                    <span className="font-mono text-xs text-foreground">{plan.seatsLimit === null ? "Unlimited" : plan.seatsLimit}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="relative mt-4 space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className={cn("h-3.5 w-3.5 mt-0.5 rounded-full flex items-center justify-center shrink-0", plan.checkBg)}>
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20"
        >
          <h2 className="text-lg font-semibold">Compare plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">Detailed feature breakdown across all tiers.</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 pr-4 font-medium text-muted-foreground w-[40%]">Feature</th>
                  {mergedPlans.map((p) => (
                    <th key={p.id} className="py-3 px-4 font-medium">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                    {row.values.map((val, i) => (
                      <td key={i} className="py-3 px-4">
                        {val === true ? <Check className="h-3.5 w-3.5 text-primary" /> :
                         val === false ? <XIcon className="h-3.5 w-3.5 text-muted-foreground/30" /> :
                         <span className="font-mono text-xs">{val}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20"
        >
          <h2 className="text-lg font-semibold">Frequently asked questions</h2>
          <div className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <dt className="text-sm font-medium">{faq.q}</dt>
                <dd className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{faq.a}</dd>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 pt-10 border-t border-border"
        >
          <h2 className="text-lg font-semibold">Not sure which plan?</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-[50ch]">
            Start free and upgrade when you need more reviews, repos, or team seats. No commitment.
          </p>
          <Link
            href="/sign-up"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors duration-150"
          >
            Get started free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
