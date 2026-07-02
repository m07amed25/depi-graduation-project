"use client";

import { trpc } from "@/lib/trpc/client";

export function StatsSection() {
  const [data] = trpc.home.getStats.useSuspenseQuery();

  return (
    <section className="py-6 sm:py-8" aria-label="Platform statistics">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground/60">
          <span><strong className="text-muted-foreground font-semibold">{data.displayReviews}+</strong> PRs reviewed</span>
          <span className="hidden sm:inline text-border">·</span>
          <span><strong className="text-muted-foreground font-semibold">{data.displayLinesAnalyzed}K+</strong> lines analyzed</span>
          <span className="hidden sm:inline text-border">·</span>
          <span><strong className="text-muted-foreground font-semibold">{data.displayUsers}+</strong> developers</span>
          <span className="hidden sm:inline text-border">·</span>
          <span><strong className="text-muted-foreground font-semibold">99.9%</strong> uptime</span>
        </div>
      </div>
    </section>
  );
}
