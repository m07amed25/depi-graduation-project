"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Search,
  X,
  FolderOpen,
  List,
  ChevronsUpDown,
  ChevronsDownUp,
  Download,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "./helpers";
import type { SortKey, SortDir, ViewMode } from "./types";

export function CommentsToolbar({
  totalComments,
  filteredCount,
  searchQuery,
  onSearchChange,
  allCategories,
  activeCategories,
  onToggleCategory,
  sortKey,
  sortDir,
  onToggleSort,
  viewMode,
  onToggleViewMode,
  allExpanded,
  onToggleExpandAll,
  hasActiveFilters,
  onClearFilters,
  onExport,
  resolvedCount,
  showResolved,
  onToggleShowResolved,
}: {
  totalComments: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allCategories: string[];
  activeCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  allExpanded: boolean | null;
  onToggleExpandAll: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExport: () => void;
  resolvedCount: number;
  showResolved: boolean;
  onToggleShowResolved: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(searchQuery !== "");

  return (
    <div className="space-y-2.5 sticky top-2 z-10">
      <div className="flex items-center gap-2 flex-wrap rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-sm px-3 py-2.5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="size-3.5 text-muted-foreground" />
          Issues
        </h2>
        <span className="inline-flex items-center rounded-full bg-muted/60 border border-border/40 px-2 py-0.5 text-[10px] font-bold text-muted-foreground tabular-nums">
          {filteredCount !== totalComments
            ? `${filteredCount} / ${totalComments}`
            : totalComments}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button
            variant={searchOpen ? "secondary" : "ghost"}
            size="sm"
            className="size-7 p-0"
            onClick={() => {
              setSearchOpen((o) => !o);
              if (searchOpen) onSearchChange("");
            }}
            title="Search comments"
          >
            <Search className="size-3.5" />
          </Button>

          <Button
            variant={viewMode === "grouped" ? "secondary" : "ghost"}
            size="sm"
            className="size-7 p-0"
            onClick={onToggleViewMode}
            title={viewMode === "list" ? "Group by file" : "List view"}
          >
            {viewMode === "list" ? (
              <FolderOpen className="size-3.5" />
            ) : (
              <List className="size-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            onClick={onToggleExpandAll}
            title={allExpanded ? "Collapse all" : "Expand all"}
          >
            {allExpanded ? (
              <ChevronsDownUp className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5" />
            )}
          </Button>

          {resolvedCount > 0 && (
            <Button
              variant={!showResolved ? "secondary" : "ghost"}
              size="sm"
              className="size-7 p-0 relative"
              onClick={onToggleShowResolved}
              title={showResolved ? "Hide resolved" : "Show resolved"}
            >
              <CheckCircle2
                className={cn(
                  "size-3.5",
                  !showResolved ? "text-emerald-500" : "text-muted-foreground",
                )}
              />
              <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-emerald-500 text-white text-[8px] flex items-center justify-center font-bold leading-none">
                {resolvedCount}
              </span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            onClick={onExport}
            title="Export as Markdown"
          >
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>

      {searchOpen && (
        <div className="relative px-3 pb-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search comments, files, suggestions…"
            className="w-full h-8 pl-9 pr-9 text-sm rounded-lg border border-border/50 bg-muted/30 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring/30 focus:border-primary/30 transition-all"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap px-3 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mr-1">
          Sort
        </span>
        <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 border border-border/30">
          {(["severity", "file", "line", "category"] as SortKey[]).map(
            (key) => (
              <Button
                key={key}
                variant={sortKey === key ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-6 px-2 text-[11px] gap-1 capitalize rounded-md transition-all",
                  sortKey === key
                    ? "bg-background shadow-sm border border-border/40 text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => onToggleSort(key)}
              >
                {key}
                {sortKey === key && (
                  <ArrowUpDown
                    className={cn(
                      "size-2.5 transition-transform",
                      sortDir === "desc" && "rotate-180",
                    )}
                  />
                )}
              </Button>
            ),
          )}
        </div>

        {allCategories.length > 0 && (
          <>
            <div className="w-px h-4 bg-border/60 mx-0.5" />
            <div className="flex items-center gap-0.5 flex-wrap">
              {allCategories.map((cat) => {
                const CatIcon = getCategoryIcon(cat);
                return (
                  <Button
                    key={cat}
                    variant={activeCategories.has(cat) ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 px-2 text-[11px] gap-1 capitalize rounded-md"
                    onClick={() => onToggleCategory(cat)}
                  >
                    <CatIcon className="size-2.5" />
                    {cat}
                  </Button>
                );
              })}
            </div>
          </>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
            onClick={onClearFilters}
          >
            <X className="size-2.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
