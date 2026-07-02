"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { BarChart3, Download, AlertTriangle } from "lucide-react";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import {
  ChartsRow,
  FeedbackTrendRow,
  IssuesTablesRow,
  type TimePeriod,
} from "@/features/analytics";

const periods: { value: TimePeriod; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "6m", label: "6mo" },
  { value: "1y", label: "1y" },
];

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");

  const { data: caps } = trpc.profile.getCapabilities.useQuery(undefined, { staleTime: 60_000 });
  const analyticsLocked = caps?.some((c) => c.key === "advanced_analytics" && !c.enabled) ?? false;

  const { data: overview, isLoading: overviewLoading } = trpc.analytics.getOverview.useQuery({ timePeriod }, { staleTime: 30_000, enabled: !analyticsLocked });
  const { data: trends, isLoading: trendsLoading } = trpc.analytics.getTrends.useQuery({ timePeriod, granularity: "daily" }, { staleTime: 30_000, enabled: !analyticsLocked });
  const { data: rates, isLoading: ratesLoading } = trpc.analytics.getApprovalRejectionRates.useQuery({ timePeriod }, { staleTime: 30_000, enabled: !analyticsLocked });
  const { data: issues, isLoading: issuesLoading } = trpc.analytics.getTopIssues.useQuery({ timePeriod, limit: 10 }, { staleTime: 30_000, enabled: !analyticsLocked });
  const { data: anomalies } = trpc.analytics.getAnomalies.useQuery({ timePeriod }, { staleTime: 60_000, enabled: !analyticsLocked });
  const { data: feedback, isLoading: feedbackLoading } = trpc.review.getFeedbackStats.useQuery({}, { staleTime: 60_000 });

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify({ overview, trends, rates, issues, period: timePeriod, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `analytics-${timePeriod}-${new Date().toISOString().split("T")[0]}.json` });
    a.click();
    URL.revokeObjectURL(url);
  }, [overview, trends, rates, issues, timePeriod]);

  const activeAnomalies = useMemo(() => anomalies?.anomalies?.filter((a) => a.severity === "critical") ?? [], [anomalies]);
  const hasData = overview && overview.totalReviews > 0;

  if (analyticsLocked) {
    return (
      <UpgradePrompt
        title="Analytics is a premium feature"
        description="Upgrade your plan to unlock review analytics, trends, and recurring issue insights."
      />
    );
  }

  if (!overviewLoading && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground/20 mb-4" />
        <p className="text-[13px] font-medium mb-1">No review data yet</p>
        <p className="text-xs text-muted-foreground max-w-[32ch] mb-5 leading-relaxed">
          Analytics populate after your first completed review. Connect a repo and open a PR to get started.
        </p>
        <Button size="sm" className="h-7 text-[12px] gap-1.5" asChild>
          <Link href="/repo">Connect a repo</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Review velocity, risk trends, and recurring issues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex items-center border border-border rounded-sm overflow-hidden" aria-label="Time period">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setTimePeriod(p.value)}
                aria-pressed={timePeriod === p.value}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors duration-100 ${
                  timePeriod === p.value
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleExport}
            aria-label="Export analytics as JSON"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Anomalies */}
      {activeAnomalies.length > 0 && (
        <div className="rounded-sm border border-destructive/20 bg-destructive/5 px-3 py-2 flex items-start gap-2" role="alert">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            {activeAnomalies.map((a, i) => (
              <p key={i} className="text-[12px] text-destructive/80">{a.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* Metrics row */}
      {overviewLoading ? (
        <div className="flex gap-8 py-3 border-y border-border/50" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </div>
      ) : overview && (
        <div
          className="flex flex-wrap gap-x-8 gap-y-3 py-3 border-y border-border/50"
          aria-label="Key metrics"
        >
          {[
            { label: "Reviews", value: overview.totalReviews },
            { label: "Completed", value: `${overview.completionRate}%`, good: overview.completionRate >= 80 },
            { label: "Avg time", value: overview.avgCompletionTimeHours < 1 ? `${Math.round(overview.avgCompletionTimeHours * 60)}m` : `${overview.avgCompletionTimeHours.toFixed(1)}h` },
            { label: "Risk score", value: overview.avgRiskScore.toFixed(0), warn: overview.avgRiskScore > 50 },
          ].map((m) => (
            <Metric key={m.label} label={m.label} value={m.value} good={"good" in m ? m.good : undefined} warn={"warn" in m ? m.warn : undefined} />
          ))}
        </div>
      )}

      {/* Charts */}
      <ChartsRow trendsData={trends} trendsLoading={trendsLoading} ratesData={rates} ratesLoading={ratesLoading} />

      {/* Feedback */}
      <FeedbackTrendRow data={feedback} isLoading={feedbackLoading} />

      {/* Issues */}
      <IssuesTablesRow issuesData={issues} issuesLoading={issuesLoading} />
    </motion.div>
  );
}

function Metric({ label, value, good, warn }: { label: string; value: string | number; good?: boolean; warn?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">{label}</span>
      <span className={`text-xl font-semibold tabular-nums tracking-tight leading-none ${warn ? "text-destructive/80" : good ? "text-[oklch(0.55_0.15_155)]" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
