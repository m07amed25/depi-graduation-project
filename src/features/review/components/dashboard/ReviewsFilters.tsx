"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import { Search, X, Calendar, Flame, CircleDot, LayoutList, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReviewStatus, type SortKey, type SortDir, type ViewMode } from "@/features/review/types/dashboard";
import { StatusTabs } from "./controls";

interface ReviewsFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: ReviewStatus | "ALL";
  onStatusChange: (v: ReviewStatus | "ALL") => void;
  repoFilter: string;
  onRepoChange: (v: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  statusCounts: Record<string, number>;
  repos: { id: string; name: string }[] | undefined;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function ReviewsFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  repoFilter,
  onRepoChange,
  sortKey,
  sortDir,
  onToggleSort,
  viewMode,
  onViewModeChange,
  statusCounts,
  repos,
  hasFilters,
  onClearFilters,
}: ReviewsFiltersProps) {
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card/80 backdrop-blur-sm border rounded-xl p-3 shadow-sm">
        <StatusTabs active={statusFilter} onChange={onStatusChange} counts={statusCounts} />
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-1 gap-0.5">
            <button onClick={() => onViewModeChange("list")} className={cn("flex items-center justify-center size-7 rounded-md transition-all duration-150", viewMode === "list" ? "bg-background text-foreground shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")} title="List view">
              <LayoutList className="size-3.5" />
            </button>
            <button onClick={() => onViewModeChange("grid")} className={cn("flex items-center justify-center size-7 rounded-md transition-all duration-150", viewMode === "grid" ? "bg-background text-foreground shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")} title="Grid view">
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <Card className="shadow-none border-border/50 bg-card/50">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
              <Input
                id="review-search"
                placeholder="Search by title, repo, or PR #..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-16 h-9 text-sm bg-background shadow-none border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/40"
              />
              {search ? (
                <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" title="Clear search">
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-[10px]">Ctrl</span>K
                </kbd>
              )}
            </div>
            <DropdownSelect value={repoFilter} onValueChange={onRepoChange} className="w-full sm:w-48 h-9 text-sm bg-background shadow-none border-border/50" placeholder="Filter by repository">
              <SelectItem value="ALL">All Repositories</SelectItem>
              {repos?.map((repo) => (
                <SelectItem key={repo.id} value={repo.id}><span className="truncate">{repo.name}</span></SelectItem>
              ))}
            </DropdownSelect>
            <div className="flex gap-1 items-center bg-muted/30 p-1 rounded-lg border border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold px-1.5 hidden lg:block">Sort</span>
              {([
                { key: "date", label: "Date", icon: Calendar },
                { key: "risk", label: "Risk", icon: Flame },
                { key: "status", label: "Status", icon: CircleDot },
              ] as { key: SortKey; label: string; icon: React.ElementType }[]).map(({ key, label, icon: SortIcon }) => (
                <Button key={key} variant={sortKey === key ? "secondary" : "ghost"} size="sm" className={cn("h-7 px-2.5 text-[11px] gap-1.5 rounded-md transition-all duration-150", sortKey === key ? "bg-background text-foreground shadow-sm font-bold border border-border/40" : "text-muted-foreground hover:text-foreground")} onClick={() => onToggleSort(key)}>
                  <SortIcon className={cn("size-3", sortKey === key ? "text-primary" : "text-muted-foreground/50")} />
                  <span>{label}</span>
                  {sortKey === key && <span className="text-primary/60">{sortDir === "desc" ? "↓" : "↑"}</span>}
                </Button>
              ))}
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1 transition-colors" onClick={onClearFilters} title="Clear filters">
                <X className="size-3" />Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
