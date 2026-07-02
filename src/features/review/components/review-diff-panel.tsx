"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  FileCode2,
  Loader2,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { SeverityIcon } from "./comment-card";
import { getSeverityStyles, getCategoryIcon } from "./helpers";

interface ReviewDiffPanelProps {
  reviewId: string;
  compareReviewId: string;
}

type DiffState = "fixed" | "persisted" | "new";

interface DiffFinding {
  file: string;
  line: number;
  severity: string;
  category?: string;
  message: string;
  suggestion?: string;
  confidence?: number;
}

function DiffStateBadge({ state }: { state: DiffState }) {
  switch (state) {
    case "fixed":
      return (
        <Badge className="gap-1 text-[10px] font-bold uppercase tracking-widest border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3" />
          Fixed
        </Badge>
      );
    case "persisted":
      return (
        <Badge className="gap-1 text-[10px] font-bold uppercase tracking-widest border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-3" />
          Persisted
        </Badge>
      );
    case "new":
      return (
        <Badge className="gap-1 text-[10px] font-bold uppercase tracking-widest border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
          <Sparkles className="size-3" />
          New
        </Badge>
      );
  }
}

function DiffFindingCard({
  finding,
  state,
}: {
  finding: DiffFinding;
  state: DiffState;
}) {
  const [expanded, setExpanded] = useState(false);
  const severityConfig = getSeverityStyles(finding.severity);
  const CategoryIcon = getCategoryIcon(finding.category);
  const pathParts = finding.file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  const borderColor =
    state === "fixed"
      ? "border-emerald-500/20"
      : state === "new"
        ? "border-red-500/20"
        : "border-amber-500/20";

  const topBar =
    state === "fixed"
      ? "bg-emerald-500/60"
      : state === "new"
        ? "bg-red-500/60"
        : "bg-amber-500/60";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        borderColor,
        state === "fixed" && "opacity-70",
      )}
    >
      <div className={cn("h-0.5 w-full", topBar)} />
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((o) => !o);
          }
        }}
        className="w-full text-left cursor-pointer group/card"
      >
        <div className="p-3 sm:p-4 flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 size-7 rounded-lg flex items-center justify-center shrink-0",
              severityConfig.iconBg,
            )}
          >
            <SeverityIcon severity={finding.severity} />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <DiffStateBadge state={state} />
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold px-2",
                  severityConfig.badge,
                )}
              >
                {finding.severity}
              </Badge>
              {finding.category && (
                <Badge
                  variant="secondary"
                  className="gap-1 text-xs font-medium"
                >
                  {React.createElement(CategoryIcon, { className: "size-3" })}
                  {finding.category}
                </Badge>
              )}
              <div className="flex-1" />
              <div
                className={cn(
                  "size-5 rounded flex items-center justify-center transition-colors",
                  "group-hover/card:bg-muted",
                )}
              >
                {expanded ? (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
            <p
              className={cn(
                "text-sm leading-relaxed text-foreground/90",
                !expanded && "line-clamp-2",
                state === "fixed" && "line-through opacity-60",
              )}
            >
              {finding.message}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono rounded-md px-2 py-1 bg-muted/50 text-muted-foreground">
              <FileCode2 className="size-3 shrink-0" />
              {directory && (
                <span className="opacity-50 truncate max-w-32">
                  {directory}/
                </span>
              )}
              <span className="font-semibold text-foreground">{fileName}</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-primary font-bold">{finding.line}</span>
            </div>
          </div>
        </div>
      </div>
      {expanded && finding.suggestion && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="ml-10 rounded-lg bg-muted/50 border border-border/60 p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Suggestion
            </p>
            <p className="text-sm leading-relaxed text-foreground/85">
              {finding.suggestion}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function DiffSection({
  title,
  icon: Icon,
  findings,
  state,
  defaultOpen,
  color,
}: {
  title: string;
  icon: React.ElementType;
  findings: DiffFinding[];
  state: DiffState;
  defaultOpen: boolean;
  color: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (findings.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 w-full text-left px-1 py-1 group"
      >
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
        <div
          className={cn(
            "size-6 rounded-md flex items-center justify-center shrink-0",
            color,
          )}
        >
          <Icon className="size-3.5" />
        </div>
        <span className="text-sm font-semibold">{title}</span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {findings.length}
        </Badge>
      </button>
      {open && (
        <div className="space-y-2 pl-1">
          {findings.map((finding, i) => (
            <DiffFindingCard
              key={`${finding.file}:${finding.line}:${i}`}
              finding={finding}
              state={state}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RiskDelta({
  current,
  previous,
}: {
  current: number | null;
  previous: number | null;
}) {
  if (current === null || previous === null) return null;
  const delta = current - previous;

  if (delta === 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Minus className="size-3.5" />
        <span>No change in risk score</span>
      </div>
    );
  }

  const improved = delta < 0;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium",
        improved
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400",
      )}
    >
      {improved ? (
        <TrendingDown className="size-3.5" />
      ) : (
        <TrendingUp className="size-3.5" />
      )}
      <span>
        Risk score {improved ? "improved" : "worsened"} by {Math.abs(delta)}{" "}
        points ({previous} → {current})
      </span>
    </div>
  );
}

export function ReviewDiffPanel({
  reviewId,
  compareReviewId,
}: ReviewDiffPanelProps) {
  const diff = trpc.review.getDiff.useQuery(
    { reviewId, compareReviewId },
    { enabled: !!reviewId && !!compareReviewId },
  );

  if (diff.isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Computing diff…</p>
        </CardContent>
      </Card>
    );
  }

  if (diff.error || !diff.data) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">
            {diff.error?.message ?? "Failed to compute diff"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary } = diff.data;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowLeftRight className="size-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Review Comparison
              </h3>
              <p className="text-xs text-muted-foreground">
                {summary.previousTotal} findings → {summary.currentTotal}{" "}
                findings
              </p>
            </div>
          </div>

          <RiskDelta
            current={diff.data.currentRiskScore}
            previous={diff.data.previousRiskScore}
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                  {summary.fixedCount}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Fixed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <AlertTriangle className="size-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 leading-none">
                  {summary.persistedCount}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Persisted
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <Sparkles className="size-4 text-red-500 shrink-0" />
              <div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 leading-none">
                  {summary.newCount}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  New
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finding Sections */}
      {summary.fixedCount === 0 &&
        summary.persistedCount === 0 &&
        summary.newCount === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Both reviews have identical findings.
              </p>
            </CardContent>
          </Card>
        )}

      <DiffSection
        title="Fixed Issues"
        icon={CheckCircle2}
        findings={diff.data.fixed}
        state="fixed"
        defaultOpen={true}
        color="bg-emerald-500/10 text-emerald-500"
      />

      <DiffSection
        title="New Issues"
        icon={Sparkles}
        findings={diff.data.new}
        state="new"
        defaultOpen={true}
        color="bg-red-500/10 text-red-500"
      />

      <DiffSection
        title="Persisted Issues"
        icon={AlertTriangle}
        findings={diff.data.persisted}
        state="persisted"
        defaultOpen={false}
        color="bg-amber-500/10 text-amber-500"
      />
    </div>
  );
}
