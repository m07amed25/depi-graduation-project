"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FolderGit2,
  Calendar,
  Eye,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STATUS_CONFIG,
  type ReviewStatus,
  type ViewMode,
  type ReviewComment,
} from "../../types/dashboard";
import {
  relativeTime,
  isRecentlyCompleted,
  getRiskLevel,
} from "../../utils/dashboard-helpers";
import {
  MiniRiskGauge,
  SeverityDonut,
  QualityScorePill,
} from "./chart-components";

type ReviewData = {
  id: string;
  repositoryId: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  status: string;
  summary?: string | null;
  riskScore?: number | null;
  comments?: unknown;
  qualityMetrics?: unknown;
  error?: string | null;
  createdAt: string | Date;
  repository: { id: string; name: string; fullName: string; private: boolean };
};

function computeQualityScore(qualityMetrics: unknown): number | null {
  if (
    qualityMetrics &&
    typeof qualityMetrics === "object" &&
    !Array.isArray(qualityMetrics) &&
    "complexity" in (qualityMetrics as Record<string, unknown>)
  ) {
    const qm = qualityMetrics as {
      complexity: number;
      maintainability: number;
      readability: number;
      testability: number;
    };
    return Math.round(
      (qm.complexity + qm.maintainability + qm.readability + qm.testability) /
        4,
    );
  }
  return null;
}

function SeverityBadgeSummary({
  comments,
}: {
  comments: Array<{ severity: string }>;
}) {
  const tally = (sev: string) =>
    comments.filter((c) => c.severity === sev).length;
  const entries = [
    {
      key: "critical",
      label: "Critical",
      cls: "bg-red-500/15 text-red-500 border-red-500/20",
    },
    {
      key: "high",
      label: "High",
      cls: "bg-orange-500/15 text-orange-500 border-orange-500/20",
    },
    {
      key: "medium",
      label: "Med",
      cls: "bg-amber-500/15 text-amber-600 border-amber-500/20",
    },
    {
      key: "low",
      label: "Low",
      cls: "bg-slate-400/15 text-slate-500 border-slate-400/20",
    },
    {
      key: "info",
      label: "Info",
      cls: "bg-sky-500/15 text-sky-500 border-sky-500/20",
    },
  ].filter((e) => tally(e.key) > 0);

  if (entries.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5">
      {entries.map(({ key, label, cls }) => (
        <span
          key={key}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${cls}`}
        >
          {tally(key)} {label}
        </span>
      ))}
    </div>
  );
}

export function ReviewCard({
  review,
  index,
  viewMode,
}: {
  review: ReviewData;
  index: number;
  viewMode: ViewMode;
}) {
  const status = review.status as ReviewStatus;
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const comments = (
    Array.isArray(review.comments) ? review.comments : []
  ) as ReviewComment[];
  const qualityScore = computeQualityScore(review.qualityMetrics);
  const recent =
    status === "COMPLETED" && isRecentlyCompleted(review.createdAt);

  if (viewMode === "grid") {
    return (
      <div className="h-full">
        <Link
          href={`/repo/${review.repositoryId}/pr/${review.prNumber}`}
          className="group block h-full"
        >
          <Card
            className={cn(
              "h-full border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5",
              recent
                ? "border-emerald-500/30 shadow-sm shadow-emerald-500/5"
                : "border-border/60",
            )}
          >
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center rounded-md bg-muted/60 border border-border/40 px-2 py-0.5 text-[10px] font-bold font-mono text-muted-foreground/70">
                  #{review.prNumber}
                </span>
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    config.bg,
                  )}
                >
                  <StatusIcon
                    className={cn(
                      "size-3.5",
                      config.color,
                      status === "PROCESSING" && "animate-spin",
                    )}
                  />
                </div>
              </div>

              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
                {review.prTitle}
              </h3>

              {status === "COMPLETED" && comments.length > 0 && (
                <div className="mb-2">
                  <SeverityBadgeSummary comments={comments} />
                </div>
              )}

              <div className="flex-1" />

              <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5 truncate max-w-[130px] font-medium">
                    <FolderGit2 className="size-3 text-muted-foreground/40 shrink-0" />
                    {review.repository.name}
                  </span>
                  <span className="flex items-center gap-1 tabular-nums opacity-60 shrink-0">
                    <Calendar className="size-3" />
                    {relativeTime(review.createdAt)}
                  </span>
                </div>

                {status === "COMPLETED" && review.riskScore != null && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          getRiskLevel(review.riskScore).bg,
                        )}
                        style={{ width: `${review.riskScore}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shrink-0",
                        getRiskLevel(review.riskScore).color,
                      )}
                    >
                      {getRiskLevel(review.riskScore).label}
                    </span>
                  </div>
                )}

                {status !== "COMPLETED" && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md border-border/40 text-[10px] font-bold uppercase tracking-wider",
                      config.bg,
                      config.color,
                    )}
                  >
                    {config.label}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link
        href={`/repo/${review.repositoryId}/pr/${review.prNumber}`}
        className="group block"
      >
        <div
          className={cn(
            "relative flex items-center gap-3 px-4 py-3.5 border rounded-xl bg-card transition-all duration-200 hover:border-primary/30 hover:bg-muted/20 hover:shadow-sm overflow-hidden",
            recent
              ? "border-emerald-500/25 shadow-sm shadow-emerald-500/5"
              : "border-border/60",
          )}
        >
          {/* Left accent strip for recent */}
          {recent && (
            <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500 rounded-full" />
          )}

          {/* Status Icon Column */}
          <div className="shrink-0 pl-1">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                config.bg,
              )}
            >
              <StatusIcon
                className={cn(
                  "size-3.5",
                  config.color,
                  status === "PROCESSING" && "animate-spin",
                )}
              />
            </div>
          </div>

          {/* Main Content Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="shrink-0 inline-flex items-center rounded bg-muted/60 border border-border/30 px-1.5 py-0.5 text-[10px] font-bold font-mono text-muted-foreground/60">
                #{review.prNumber}
              </span>
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {review.prTitle}
              </h3>
              {recent && (
                <span className="flex size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] shrink-0" />
              )}
            </div>

            <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium truncate max-w-[160px]">
                <FolderGit2 className="size-3 text-muted-foreground/40 shrink-0" />
                {review.repository.fullName}
              </span>
              <span className="flex items-center gap-1 opacity-60 shrink-0">
                <Calendar className="size-3" />
                {relativeTime(review.createdAt)}
              </span>
            </div>
            {status === "COMPLETED" && comments.length > 0 && (
              <SeverityBadgeSummary comments={comments} />
            )}
          </div>

          {/* Metrics & Badges Column */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {status === "COMPLETED" && comments.length > 0 && (
              <div className="flex items-center gap-2">
                <SeverityDonut comments={comments} />
                <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                  {comments.filter((c) => c.severity !== "info").length}
                </span>
              </div>
            )}

            {status === "COMPLETED" && review.riskScore != null && (
              <div className="flex flex-col items-end gap-1 w-20">
                <div
                  className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-full text-center",
                    getRiskLevel(review.riskScore).color,
                    "bg-muted/50 border border-border/40",
                  )}
                >
                  {getRiskLevel(review.riskScore).label}
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      getRiskLevel(review.riskScore).bg,
                    )}
                    style={{ width: `${review.riskScore}%` }}
                  />
                </div>
              </div>
            )}

            {status !== "COMPLETED" && (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-lg border-border/50 text-[10px] font-bold uppercase tracking-wider",
                  config.bg,
                  config.color,
                )}
              >
                {config.label}
              </Badge>
            )}

            <ChevronRight className="size-4 text-muted-foreground/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground/60" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export function ReviewCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "grid") {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="size-7 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="pt-3 border-t border-border/30 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border border-border/50 rounded-xl bg-card">
      <Skeleton className="size-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
      </div>
      <div className="hidden md:flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="size-4 rounded" />
      </div>
    </div>
  );
}
