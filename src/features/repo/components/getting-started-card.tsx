"use client";

import { useState } from "react";
import Link from "next/link";
import { Github, FolderGit2, GitPullRequest, Check, ArrowRight, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type OnboardingStatus = { hasGithub: boolean; hasRepos: boolean; hasReviews: boolean };

interface GettingStartedCardProps {
  status?: OnboardingStatus;
  variant?: "full" | "slim";
  isLoading?: boolean;
  onLinkGithub: () => void;
  onChooseRepos: () => void;
}

export function GettingStartedCard({ status, variant = "full", isLoading = false, onLinkGithub, onChooseRepos }: GettingStartedCardProps) {
  const slim = variant === "slim";
  const [pending, setPending] = useState(false);

  if (!status && isLoading) {
    return <Skeleton className={cn("w-full rounded-sm", slim ? "h-24" : "h-64")} />;
  }

  // If the status query failed, degrade to a functional checklist rather than a
  // perpetual skeleton; the activation actions still work without the readout.
  const s = status ?? { hasGithub: false, hasRepos: false, hasReviews: false };
  const runAction = async (fn: () => void | Promise<void>) => {
    setPending(true);
    try {
      await fn();
    } finally {
      setPending(false);
    }
  };

  const steps: { icon: LucideIcon; short: string; label: string; desc: string; done: boolean; onAction?: () => void; actionLabel?: string }[] = [
    { icon: Github, short: "GitHub", label: "Connect GitHub", desc: "One OAuth click. Code Catch only sees the repositories you pick.", done: s.hasGithub, onAction: onLinkGithub, actionLabel: "Link GitHub" },
    { icon: FolderGit2, short: "Repository", label: "Watch a repository", desc: "Choose which repos to review. Add or remove them whenever.", done: s.hasRepos, onAction: onChooseRepos, actionLabel: "Choose repos" },
    { icon: GitPullRequest, short: "Pull request", label: "Open a pull request", desc: "The review posts back to the PR automatically, usually within seconds.", done: s.hasReviews },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const currentIndex = steps.findIndex((step) => !step.done);
  const current = currentIndex === -1 ? null : steps[currentIndex];
  const CurrentIcon = current?.icon;

  const action = current?.onAction ? (
    <Button size="sm" disabled={pending} className="h-8 shrink-0 gap-1.5 text-[13px]" onClick={() => runAction(() => current?.onAction?.())}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : CurrentIcon ? <CurrentIcon className="h-3.5 w-3.5" /> : null}
      {current.actionLabel}
    </Button>
  ) : current ? (
    <Link href="/docs" className="inline-flex shrink-0 items-center gap-1 text-[13px] text-primary hover:underline">
      How reviews work <ArrowRight className="h-3 w-3" />
    </Link>
  ) : null;

  return (
    <section aria-label="Getting started" className={cn("rounded-sm border border-border bg-card", slim ? "p-4 sm:p-5" : "p-6 sm:p-8")}>
      <p role="status" aria-live="polite" className="sr-only">
        {current ? `Step ${currentIndex + 1} of ${steps.length}: ${current.label}` : "Setup complete"}
      </p>

      {/* Status rail: all three steps at a glance */}
      <div className="flex items-center gap-3">
        <ol aria-hidden="true" className="flex min-w-0 items-center gap-2">
          {steps.map((step, i) => {
            const isCurrent = i === currentIndex;
            return (
              <li key={step.label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors",
                    step.done ? "border-transparent bg-chart-2/15 text-chart-2" : isCurrent ? "border-primary text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {step.done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={cn("hidden font-mono text-[11px] tracking-wide sm:inline", isCurrent ? "text-foreground" : "text-muted-foreground")}>{step.short}</span>
                {i < steps.length - 1 && <span className="h-px w-4 bg-border sm:w-6" />}
              </li>
            );
          })}
        </ol>
        {slim ? <div className="ml-auto">{action}</div> : <span aria-hidden="true" className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{doneCount}/{steps.length}</span>}
      </div>

      {/* Focal current step */}
      {!slim && (current ? (
        <div className="mt-6">
          <div className="flex items-center gap-2">
            {CurrentIcon && <CurrentIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
            <h2 className="text-base font-semibold tracking-tight">{current.label}</h2>
          </div>
          <p className="mt-1.5 max-w-[48ch] text-[13px] leading-relaxed text-muted-foreground">{current.desc}</p>
          <div className="mt-3">{action}</div>
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-muted-foreground">You&apos;re all set. Code Catch reviews every new pull request.</p>
      ))}
    </section>
  );
}
