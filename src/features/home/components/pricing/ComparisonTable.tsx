"use client";

import { motion } from "motion/react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MergedPlan, PlanFeature } from "./pricing-types";

function ComparisonCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <td className="px-6 py-4 text-center text-sm font-medium">{value}</td>;
  }
  return (
    <td className="px-6 py-4 text-center">
      {value ? (
        <Check className="mx-auto h-4 w-4 text-indigo-500" />
      ) : (
        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
      )}
    </td>
  );
}

export function ComparisonTable({
  plans,
  comparison,
}: {
  plans: MergedPlan[];
  comparison: PlanFeature[];
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <h2 className="text-3xl font-bold tracking-tight">Compare all features</h2>
        <p className="mt-2 text-muted-foreground">Every detail, side by side.</p>
      </motion.div>

      <div className="overflow-hidden rounded-2xl border shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Feature</th>
              {plans.map((p) => {
                const Icon = p.icon;
                return (
                  <th key={p.id} className={cn("px-6 py-4 text-center text-sm font-bold", p.highlight && "text-indigo-600 dark:text-indigo-400")}>
                    <div className="flex flex-col items-center gap-1">
                      <Icon className="h-4 w-4" />
                      {p.name}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {comparison.map((row, i) => (
              <tr key={row.label} className={cn("border-b last:border-0 transition-colors hover:bg-muted/30", i % 2 === 0 && "bg-muted/10")}>
                <td className="px-6 py-4 text-sm font-medium">{row.label}</td>
                {row.values.map((v, idx) => (
                  <ComparisonCell key={idx} value={v} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
