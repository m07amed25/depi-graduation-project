"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Sparkles, Activity, Zap, Paintbrush, FileCode2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QualityMetrics } from "./types";

export function AISummaryCard({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);
  const copySummary = () => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-[0.9375rem] font-semibold flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />AI Summary
        </h3>
        <Button variant="ghost" size="sm" className="size-7 p-0" onClick={copySummary} title="Copy">
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
        </Button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
    </div>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 90 ? "text-emerald-500 bg-emerald-500/10" : confidence >= 70 ? "text-blue-500 bg-blue-500/10" : confidence >= 50 ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground bg-muted";
  return <Badge variant="secondary" className={cn("text-xs gap-1", color)}><Activity className="size-3" />{confidence}%</Badge>;
}

export function QualityMetricsCard({ metrics, avgConfidence }: { metrics: QualityMetrics; avgConfidence: number | null }) {
  const items = [
    { key: "complexity", label: "Complexity", icon: Zap, score: metrics.complexity },
    { key: "maintainability", label: "Maintainability", icon: Paintbrush, score: metrics.maintainability },
    { key: "readability", label: "Readability", icon: FileCode2, score: metrics.readability },
    { key: "testability", label: "Testability", icon: Shield, score: metrics.testability },
  ];

  const overall = Math.round(items.reduce((s, i) => s + i.score, 0) / 4);
  const barColor = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-blue-500" : s >= 40 ? "bg-amber-500" : "bg-red-500";
  const textColor = (s: number) => s >= 80 ? "text-emerald-500" : s >= 60 ? "text-blue-500" : s >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[0.9375rem] font-semibold flex items-center gap-2">
          <Activity className="size-4 text-primary" />Quality Metrics
        </h3>
        <span className={cn("font-mono text-lg font-semibold tabular-nums", textColor(overall))}>{overall}<span className="text-xs text-muted-foreground">/100</span></span>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-3">
            <item.icon className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full", barColor(item.score))} style={{ width: `${item.score}%` }} />
            </div>
            <span className={cn("font-mono text-xs font-medium w-7 text-right tabular-nums", textColor(item.score))}>{item.score}</span>
          </div>
        ))}
      </div>
      {avgConfidence !== null && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>AI Confidence</span>
          <span className={cn("font-mono font-medium", textColor(avgConfidence))}>{avgConfidence}%</span>
        </div>
      )}
    </div>
  );
}
