"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RepoSelectItem } from "@/features/repo/components/RepoSelectItem";
import {
  RefreshCw,
  Search,
  X,
  Plus,
  Github,
  CheckCircle,
  SortAsc,
  Star,
  Clock,
  AlignJustify,
  LayoutGrid,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GitHubRepo {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  stars: number;
  language: string | null;
  updatedAt: string;
}

type SortKey = "name" | "stars" | "updated";

interface GithubReposPanelProps {
  availableRepos: GitHubRepo[];
  filteredRepos: GitHubRepo[];
  selectedRepos: Set<number>;
  searchQuery: string;
  isLoading: boolean;
  isFetching: boolean;
  error?: { message?: string; data?: { code?: string } } | null;
  isConnecting: boolean;
  onToggle: (id: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onConnect: () => void;
  onRefresh: () => void;
  onSearchChange: (q: string) => void;
}

const sortLabels: Record<SortKey, string> = { name: "Name", stars: "Stars", updated: "Recent" };
const sortIcons: Record<SortKey, typeof AlignJustify> = { name: AlignJustify, stars: Star, updated: Clock };

export function GithubReposPanel({
  availableRepos,
  filteredRepos,
  selectedRepos,
  searchQuery,
  isLoading,
  isFetching,
  error,
  isConnecting,
  onToggle,
  onSelectAll,
  onClearSelection,
  onConnect,
  onRefresh,
  onSearchChange,
}: GithubReposPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [gridView, setGridView] = useState(true);

  const sortedRepos = [...filteredRepos].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "stars") return b.stars - a.stars;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const allSelected = availableRepos.length > 0 && selectedRepos.size === availableRepos.length;
  const someSelected = selectedRepos.size > 0 && !allSelected;

  if (isLoading) {
    return (
      <div className="rounded-sm border border-border p-4 space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-sm" />
        ))}
      </div>
    );
  }

  if (error) {
    const needsAuth = error.data?.code === "UNAUTHORIZED" || error.data?.code === "PRECONDITION_FAILED";
    return (
      <div className="rounded-sm border border-border py-12 flex flex-col items-center text-center">
        <Github className="h-7 w-7 text-muted-foreground/40 mb-3" />
        <p className="text-[13px] font-medium mb-1">
          {needsAuth ? "GitHub not linked" : "Could not load repos"}
        </p>
        <p className="text-xs text-muted-foreground max-w-[30ch] mb-4">
          {needsAuth
            ? "Link your GitHub account to see available repositories."
            : error.message || "Something went wrong. Try refreshing."}
        </p>
        <Button
          size="sm"
          className="h-7 text-[12px] gap-1.5"
          onClick={needsAuth ? async () => {
            const { linkSocial } = await import("@/lib/auth-client");
            await linkSocial({ provider: "github", callbackURL: window.location.href });
          } : onRefresh}
        >
          {needsAuth ? <><Github className="h-3 w-3" />Link GitHub</> : <><RefreshCw className="h-3 w-3" />Retry</>}
        </Button>
      </div>
    );
  }

  if (availableRepos.length === 0) {
    return (
      <div className="rounded-sm border border-border py-12 flex flex-col items-center text-center">
        <CheckCircle className="h-7 w-7 text-emerald-500/60 mb-3" />
        <p className="text-[13px] font-medium mb-0.5">All repos connected</p>
        <p className="text-xs text-muted-foreground">Nothing left to import from your GitHub account.</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/20">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <Input
            placeholder="Filter repos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-7 h-7 text-[13px] bg-background border-border"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] text-muted-foreground px-2">
              <SortAsc className="h-3 w-3" />
              <span className="hidden sm:inline">{sortLabels[sortKey]}</span>
              <ChevronDown className="h-2.5 w-2.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {(Object.entries(sortLabels) as [SortKey, string][]).map(([key, label]) => {
              const Icon = sortIcons[key];
              return (
                <DropdownMenuItem key={key} onClick={() => setSortKey(key)} className="text-xs gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  {label}
                  {sortKey === key && <Check className="h-3 w-3 ml-auto text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center border border-border rounded-sm overflow-hidden">
          <button
            onClick={() => setGridView(true)}
            className={cn("h-7 w-7 flex items-center justify-center transition-colors", gridView ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="h-3 w-3" />
          </button>
          <button
            onClick={() => setGridView(false)}
            className={cn("h-7 w-7 flex items-center justify-center border-l border-border transition-colors", !gridView ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <AlignJustify className="h-3 w-3" />
          </button>
        </div>

        <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isFetching} className="h-7 w-7 text-muted-foreground shrink-0">
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
        </Button>
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto overscroll-contain">
        {sortedRepos.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-muted-foreground">No repos match "{searchQuery}"</p>
          </div>
        ) : (
          <div className={cn("p-3", gridView ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" : "flex flex-col gap-1")}>
            {sortedRepos.map((repo) => (
              <RepoSelectItem key={repo.githubId} repo={repo} selected={selectedRepos.has(repo.githubId)} onToggle={() => onToggle(repo.githubId)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => allSelected || someSelected ? onClearSelection() : onSelectAll()}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className={cn(
              "h-3.5 w-3.5 rounded-sm border flex items-center justify-center transition-colors",
              allSelected ? "bg-primary border-primary" : someSelected ? "border-muted-foreground bg-muted" : "border-muted-foreground/40"
            )}>
              {allSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              {someSelected && <div className="w-1.5 h-0.5 bg-muted-foreground rounded-full" />}
            </div>
            {allSelected ? "Deselect all" : someSelected ? "Clear" : "Select all"}
          </button>

          {selectedRepos.size > 0 && (
            <span className="text-[11px] text-muted-foreground/60 font-mono">
              {selectedRepos.size}/{availableRepos.length}
            </span>
          )}
        </div>

        <Button
          disabled={selectedRepos.size === 0 || isConnecting}
          onClick={onConnect}
          size="sm"
          className="h-7 text-[12px] gap-1.5 px-3"
        >
          {isConnecting ? (
            <><RefreshCw className="h-3 w-3 animate-spin" />Connecting...</>
          ) : (
            <><Plus className="h-3 w-3" />Add {selectedRepos.size > 0 ? selectedRepos.size : ""} {selectedRepos.size === 1 ? "repo" : "repos"}</>
          )}
        </Button>
      </div>
    </div>
  );
}
