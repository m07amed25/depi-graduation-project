"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type React from "react";

export { SEVERITY_COLORS } from "@/lib/constants";
import { SEVERITY_COLORS } from "@/lib/constants";

export function SeverityStatCard({
  label,
  count,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: keyof typeof SEVERITY_COLORS;
  active?: boolean;
  onClick?: () => void;
}) {
  const c = SEVERITY_COLORS[color];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md border text-left transition-colors cursor-pointer",
        active ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30",
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", c.icon)} />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-sm font-semibold tabular-nums ml-auto", count > 0 ? c.text : "text-muted-foreground/40")}>{count}</span>
    </button>
  );
}

export function SeverityDistributionBar({ counts, total }: { counts: { critical: number; high: number; medium: number; low: number }; total: number }) {
  if (total === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-md border border-emerald-500/20 bg-emerald-500/5">
        <div className="h-1.5 flex-1 bg-emerald-500/30 rounded-full" />
        <span className="text-xs font-medium text-emerald-500">No issues found</span>
      </div>
    );
  }

  const getWidth = (count: number) => Math.max((count / total) * 100, count > 0 ? 4 : 0);
  const segments = [
    { key: "critical", count: counts.critical, color: "bg-red-500", label: "Critical" },
    { key: "high", count: counts.high, color: "bg-orange-500", label: "High" },
    { key: "medium", count: counts.medium, color: "bg-amber-500", label: "Medium" },
    { key: "low", count: counts.low, color: "bg-muted-foreground/40", label: "Low" },
  ].filter((s) => s.count > 0);

  return (
    <div className="space-y-2">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden flex gap-px">
        {segments.map((seg) => (
          <div key={seg.key} className={cn("h-full rounded-full transition-all", seg.color)} style={{ width: `${getWidth(seg.count)}%` }} title={`${seg.label}: ${seg.count}`} />
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {segments.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1">
            <span className={cn("size-2 rounded-full", seg.color)} />
            {seg.label} <span className="font-mono">{seg.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
