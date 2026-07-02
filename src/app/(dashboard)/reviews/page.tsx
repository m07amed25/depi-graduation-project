"use client";

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { trpc } from "@/lib/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { type ReviewStatus, type SortKey, type SortDir, type ViewMode } from "@/features/review/types/dashboard";
import { EmptyState } from "@/features/review/components/dashboard/controls";
import { ReviewCard, ReviewCardSkeleton } from "@/features/review/components/dashboard/review-card";
import { ReviewsFilters } from "@/features/review/components/dashboard/ReviewsFilters";

const ease = [0.16, 1, 0.3, 1] as const;

// Memoized list to avoid re-renders when parent state changes (e.g. filter typing)
const ReviewList = memo(function ReviewList({ filtered, viewMode }: { filtered: Array<{ id: string; createdAt: unknown; repository: { id: string; name: string; fullName: string; private: boolean }; [key: string]: unknown }>; viewMode: ViewMode }) {
  const items = filtered.map((review, i) => (
    <ReviewCard key={review.id} review={{ ...review, createdAt: review.createdAt as string, repository: review.repository } as Parameters<typeof ReviewCard>[0]["review"]} index={i} viewMode={viewMode} />
  ));
  if (viewMode === "grid") {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" role="list" aria-label="Code reviews">{items}</div>
    );
  }
  return (
    <div className="space-y-1.5" role="list" aria-label="Code reviews">{items}</div>
  );
});

export default function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [repoFilter, setRepoFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const reviews = trpc.review.list.useQuery({ limit: 50 }, {
    refetchOnWindowFocus: false,
    staleTime: 30_000, // Don't refetch for 30s
  });
  const repos = trpc.repository.list.useQuery(undefined, {
    staleTime: 60_000,
  });

  const statusCounts = useMemo(() => {
    if (!reviews.data) return { ALL: 0, PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0 };
    const counts = { ALL: 0, PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0 };
    for (const r of reviews.data) {
      counts.ALL++;
      if (r.status in counts) counts[r.status as keyof typeof counts]++;
    }
    return counts;
  }, [reviews.data]);

  const filtered = useMemo(() => {
    if (!reviews.data) return [];
    let result = reviews.data;

    if (statusFilter !== "ALL") result = result.filter((r) => r.status === statusFilter);
    if (repoFilter !== "ALL") result = result.filter((r) => r.repositoryId === repoFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.prTitle.toLowerCase().includes(q) ||
        r.repository.fullName.toLowerCase().includes(q) ||
        r.prNumber.toString().includes(q) ||
        (r.summary?.toLowerCase().includes(q))
      );
    }

    // Sort: avoid spread if no filters applied (same reference = skip re-render)
    const sorted = [...result];
    const dir = sortDir === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "date": return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "risk": return dir * ((a.riskScore ?? -1) - (b.riskScore ?? -1));
        case "status": {
          const order: Record<string, number> = { FAILED: 0, PROCESSING: 1, PENDING: 2, COMPLETED: 3 };
          return dir * ((order[a.status] ?? 0) - (order[b.status] ?? 0));
        }
        case "repo": return dir * a.repository.fullName.localeCompare(b.repository.fullName);
        default: return 0;
      }
    });
    return sorted;
  }, [reviews.data, statusFilter, repoFilter, search, sortKey, sortDir]);

  const hasFilters = statusFilter !== "ALL" || repoFilter !== "ALL" || search.trim() !== "";
  const clearFilters = useCallback(() => { setSearch(""); setStatusFilter("ALL"); setRepoFilter("ALL"); }, []);
  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }, [sortKey]);

  // Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("review-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Loading state
  if (reviews.isLoading) {
    return (
      <div className="space-y-4 pt-1" aria-busy="true" aria-label="Loading reviews">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-full max-w-sm" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (<ReviewCardSkeleton key={i} viewMode="list" />))}
        </div>
      </div>
    );
  }

  // Error state
  if (reviews.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-8 w-8 text-destructive/50 mb-3" />
        <p className="text-[13px] font-medium mb-1">Failed to load reviews</p>
        <p className="text-xs text-muted-foreground max-w-[30ch] mb-4">
          {reviews.error?.message || "Something went wrong. Check your connection and try again."}
        </p>
        <Button size="sm" variant="outline" className="h-7 text-[12px] gap-1.5" onClick={() => reviews.refetch()}>
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      </div>
    );
  }

  const total = reviews.data?.length ?? 0;
  const pending = statusCounts.PENDING + statusCounts.PROCESSING;

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
      >
        <h1 className="text-lg font-semibold tracking-tight">Reviews</h1>
        {total > 0 ? (
          <p className="text-[13px] text-muted-foreground mt-0.5 flex items-center gap-1.5" aria-live="polite">
            <span className="font-mono text-foreground/70">{statusCounts.COMPLETED}</span>
            <span>done</span>
            {pending > 0 && (
              <>
                <span className="text-border/60" aria-hidden="true">·</span>
                <span className="font-mono text-foreground/70">{pending}</span>
                <span>running</span>
              </>
            )}
            {statusCounts.FAILED > 0 && (
              <>
                <span className="text-border/60" aria-hidden="true">·</span>
                <span className="font-mono text-destructive/70">{statusCounts.FAILED}</span>
                <span className="text-destructive/70">failed</span>
              </>
            )}
          </p>
        ) : (
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Open a PR on a connected repo and the review appears here.
          </p>
        )}
      </motion.header>

      {/* Filters */}
      <ReviewsFilters
        search={search} onSearchChange={setSearch}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
        repoFilter={repoFilter} onRepoChange={setRepoFilter}
        sortKey={sortKey} sortDir={sortDir} onToggleSort={toggleSort}
        viewMode={viewMode} onViewModeChange={setViewMode}
        statusCounts={statusCounts}
        repos={repos.data}
        hasFilters={hasFilters} onClearFilters={clearFilters}
      />

      {/* Filtered count */}
      {hasFilters && filtered.length > 0 && filtered.length !== total && (
        <p className="text-[11px] text-muted-foreground/60 font-mono" aria-live="polite" aria-atomic="true">
          {filtered.length}/{total}
        </p>
      )}

      {/* List */}
      {filtered.length > 0 ? (
        <ReviewList filtered={filtered} viewMode={viewMode} />
      ) : (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      )}

      {filtered.length >= 50 && (
        <p className="text-center text-[11px] text-muted-foreground/50 font-mono pt-2" role="status">
          Latest 50
        </p>
      )}
    </div>
  );
}
