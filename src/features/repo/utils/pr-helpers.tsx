"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  GitMerge,
  XCircle,
  Sparkles,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-2.5 sm:px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline">{label}</span>
      {badge && (
        <span className="hidden sm:inline px-1.5 py-0.5 text-xs font-medium rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          {badge}
        </span>
      )}
      {count !== undefined && (
        <span
          className={cn(
            "px-1.5 py-0.5 text-xs rounded-md tabular-nums",
            active
              ? "bg-foreground/10 text-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}

export function StatItem({
  icon: Icon,
  value,
  label,
  colorClass,
  bgClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label?: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-md", bgClass)}>
        <Icon className={cn("size-3.5", colorClass)} />
      </div>
      <div className="leading-tight">
        <p className={cn("text-sm font-semibold tabular-nums", colorClass)}>
          {value.toLocaleString()}
        </p>
        {label && (
          <p className="text-xs text-muted-foreground font-medium hidden sm:block">
            {label}
          </p>
        )}
      </div>
    </div>
  );
}

export function PRStatusBadge({
  state,
  isMerged,
  draft,
}: {
  state: string;
  isMerged: boolean;
  draft: boolean;
}) {
  if (draft) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Sparkles />
        Draft
      </Badge>
    );
  }
  if (isMerged) {
    return (
      <Badge
        variant="secondary"
        className="bg-purple-600/10 dark:text-purple-400 border-purple-600/20 border"
      >
        <GitMerge className="size-3" />
        Merged
      </Badge>
    );
  }
  if (state === "closed") {
    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="size-3" />
        Closed
      </Badge>
    );
  }
  if (state === "open") {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-600/10 dark:text-emerald-400 border-emerald-600/20 border"
      >
        <GitMerge className="size-3" />
        Open
      </Badge>
    );
  }
}

export function ReviewStatusBadge({
  status,
  completedAt,
}: {
  status: string | null;
  completedAt?: Date | null;
}) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!status) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border bg-muted text-muted-foreground"
      >
        <Clock className="h-3 w-3" />
        Not reviewed
      </Badge>
    );
  }

  const config = {
    COMPLETED: {
      icon: CheckCircle,
      label: completedAt
        ? `AI Review completed · ${getTimeAgo(completedAt)}`
        : "AI Review completed",
      className:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    PROCESSING: {
      icon: Loader2,
      label: "Analyzing code…",
      className:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      spin: true,
    },
    PENDING: {
      icon: Clock,
      label: "Queued for review",
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    FAILED: {
      icon: XCircle,
      label: "Review failed",
      className:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    TIMED_OUT: {
      icon: Clock,
      label: "Review timed out — tap retry",
      className:
        "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    },
  }[status] ?? {
    icon: Clock,
    label: "Not reviewed",
    className: "bg-muted text-muted-foreground",
  };

  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border max-w-full", config.className)}
    >
      <Icon
        className={cn(
          "h-3 w-3 shrink-0",
          "spin" in config && config.spin && "animate-spin",
        )}
      />
      <span className="truncate">{config.label}</span>
    </Badge>
  );
}
