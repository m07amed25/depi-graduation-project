"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type ReviewStatus } from "../../types/dashboard";

export function StatusTabs({
  active,
  onChange,
  counts,
}: {
  active: ReviewStatus | "ALL";
  onChange: (status: ReviewStatus | "ALL") => void;
  counts: Record<ReviewStatus | "ALL", number>;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        onClick={() => onChange("ALL")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
          active === "ALL"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        )}
      >
        All
        <span
          className={cn(
            "tabular-nums rounded-full px-1.5 py-0.5 text-[10px] leading-none",
            active === "ALL"
              ? "bg-background/20 text-background"
              : "bg-muted text-muted-foreground",
          )}
        >
          {counts.ALL}
        </span>
      </button>
      {(Object.keys(STATUS_CONFIG) as ReviewStatus[]).map((status) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        const isActive = active === status;
        return (
          <button
            key={status}
            onClick={() => onChange(status)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ring-1",
              isActive
                ? cn(config.bg, config.color, config.ring, "shadow-sm")
                : "ring-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Icon
              className={cn(
                "size-3",
                status === "PROCESSING" && isActive && "animate-spin",
              )}
            />
            {config.label}
            {counts[status] > 0 && (
              <span
                className={cn(
                  "tabular-nums rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                  isActive
                    ? cn(config.bg, config.color)
                    : "bg-muted text-muted-foreground",
                )}
              >
                {counts[status]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted/50">
        <span className="text-2xl">🔍</span>
      </div>
      <h3 className="text-base font-semibold">No reviews found</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">
        {hasFilters
          ? "No reviews match your current filters."
          : "No code reviews yet. Connect a repository to get started."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
