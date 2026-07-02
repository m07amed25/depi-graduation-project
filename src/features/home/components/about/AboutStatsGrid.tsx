"use client";

import { Github, GitPullRequest, Star, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { RevealSection } from "./RevealSection";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}+`;
}

export function AboutStatsGrid() {
  const [data] = trpc.home.getAboutStats.useSuspenseQuery();

  const stats = [
    { icon: Github, value: formatCount(data.totalRepositories), label: "Repositories Connected" },
    { icon: GitPullRequest, value: formatCount(data.totalReviews), label: "PRs Reviewed" },
    { icon: Star, value: "99.9%", label: "Uptime SLA" },
    { icon: Zap, value: data.avgReviewTime, label: "Avg Review Time" },
  ];

  return (
    <>
      {stats.map((stat, i) => (
        <RevealSection key={stat.label} delay={i * 0.08}>
          <div className="text-center">
            <stat.icon className="mx-auto h-5 w-5 text-indigo-400 mb-3" />
            <p className="text-3xl sm:text-4xl font-extrabold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
          </div>
        </RevealSection>
      ))}
    </>
  );
}
