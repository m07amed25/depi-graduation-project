"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FolderGit2, BarChart3 } from "lucide-react";

interface ReviewsHeaderProps {
  stats: { total: number; completed: number; pending: number } | null;
}

export function ReviewsHeader({ stats }: ReviewsHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-5 shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/3 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <BarChart3 className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Code Reviews</h1>
            <p className="mt-0.5 text-sm text-muted-foreground font-medium flex items-center gap-2">
              {stats && stats.pending > 0 && (
                <span className="flex size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
              )}
              {stats
                ? `${stats.total} review${stats.total !== 1 ? "s" : ""} · ${stats.completed} completed · ${stats.pending} in progress`
                : "Review history and insights"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="gap-2 shrink-0 h-9 rounded-lg border-border/60 hover:bg-muted/60">
            <Link href="/repo"><FolderGit2 className="size-4 text-muted-foreground" />Manage Repos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
