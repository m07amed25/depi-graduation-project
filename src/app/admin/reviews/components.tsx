"use client";

import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react";

type SortBy = "createdAt" | "riskScore" | "prNumber";
type SortOrder = "asc" | "desc";

export const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "warning" | "info" | "destructive";
    icon: React.ElementType;
  }
> = {
  COMPLETED: { label: "Completed", variant: "success", icon: CheckCircle2 },
  PENDING: { label: "Pending", variant: "warning", icon: Clock },
  PROCESSING: { label: "Processing", variant: "info", icon: Loader2 },
  FAILED: { label: "Failed", variant: "destructive", icon: AlertCircle },
};

export const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "FAILED", label: "Failed" },
];

export type StatusFilter = "ALL" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type { SortBy, SortOrder };

export function RiskScoreBar({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-xs text-muted-foreground">—</span>;

  const color =
    score >= 70
      ? "bg-red-500"
      : score >= 40
        ? "bg-amber-500"
        : "bg-emerald-500";

  const textColor =
    score >= 70
      ? "text-red-600 dark:text-red-400"
      : score >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
        {score}
      </span>
    </div>
  );
}

export function FeedbackIndicator({ feedbacks }: { feedbacks: { rating: number }[] }) {
  const ups = feedbacks.filter((f) => f.rating === 1).length;
  const downs = feedbacks.filter((f) => f.rating === -1).length;

  if (ups === 0 && downs === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {ups > 0 && (
        <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400">
          <ThumbsUp className="h-3 w-3" />
          {ups}
        </span>
      )}
      {downs > 0 && (
        <span className="inline-flex items-center gap-0.5 text-xs text-red-500 dark:text-red-400">
          <ThumbsDown className="h-3 w-3" />
          {downs}
        </span>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;

  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon
        className={`h-3 w-3 ${status === "PROCESSING" ? "animate-spin" : ""}`}
      />
      {config.label}
    </Badge>
  );
}

export function SortButton({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  field: SortBy;
  currentSort: SortBy;
  currentOrder: SortOrder;
  onSort: (field: SortBy) => void;
}) {
  const isActive = currentSort === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {isActive ? (
        currentOrder === "desc" ? (
          <ChevronDown className="h-3 w-3 text-foreground" />
        ) : (
          <ChevronUp className="h-3 w-3 text-foreground" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

export function ReviewExpandedRow({
  review,
}: {
  review: {
    summary?: string | null;
    error?: string | null;
    qualityMetrics?: unknown;
    prUrl: string;
  };
}) {
  const metrics = review.qualityMetrics as Record<string, number> | null;

  return (
    <div className="border-t bg-muted/30 px-6 py-4 space-y-3">
      {review.summary && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Summary
          </p>
          <p className="text-sm leading-relaxed line-clamp-4">
            {review.summary}
          </p>
        </div>
      )}

      {review.error && (
        <div>
          <p className="text-xs font-medium text-destructive mb-1">Error</p>
          <pre className="text-xs bg-destructive/5 border border-destructive/20 rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono">
            {review.error}
          </pre>
        </div>
      )}

      {metrics && Object.keys(metrics).length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Quality Metrics
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 rounded-md bg-background border px-2.5 py-1"
              >
                <span className="text-xs text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {typeof value === "number" ? value.toFixed(1) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <a
          href={review.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View on GitHub
        </a>
      </div>
    </div>
  );
}
