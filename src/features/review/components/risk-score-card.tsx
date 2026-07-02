"use client";

import { Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRiskConfig, timeAgo } from "./helpers";

export function RiskScoreCard({ score, totalIssues, createdAt }: { score: number; totalIssues: number; createdAt?: Date }) {
  const config = getRiskConfig(score);
  const RiskIcon = config.icon;

  return (
    <div className="flex items-center justify-between p-4 rounded-md border border-border">
      <div className="flex items-center gap-3">
        <div className={cn("size-9 rounded-md flex items-center justify-center", config.bg)}>
          <RiskIcon className={cn("size-4.5", config.color)} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("font-mono text-xl font-semibold tabular-nums", config.color)}>{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <span className={cn("text-sm font-medium", config.color)}>{config.label} Risk</span>
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Activity className="size-3.5" /><span className="font-mono font-medium text-foreground">{totalIssues}</span> issues</span>
        {createdAt && <span className="flex items-center gap-1"><Clock className="size-3.5" />{timeAgo(createdAt)}</span>}
      </div>
    </div>
  );
}
