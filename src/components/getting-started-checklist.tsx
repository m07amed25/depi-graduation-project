"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Github,
  FolderGit2,
  GitPullRequest,
  Check,
  ArrowRight,
  X,
  Rocket,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GettingStartedChecklistProps {
  hasGithub: boolean;
  hasRepos: boolean;
  hasReviews: boolean;
}

const ease = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    key: "hasGithub" as const,
    label: "Connect your GitHub account",
    description: "Link GitHub to import repositories and review pull requests.",
    href: "/profile",
    icon: Github,
    cta: "Connect GitHub",
  },
  {
    key: "hasRepos" as const,
    label: "Add your first repository",
    description: "Import a repo so we can start watching its pull requests.",
    href: "/repo",
    icon: FolderGit2,
    cta: "Add repository",
  },
  {
    key: "hasReviews" as const,
    label: "Trigger your first review",
    description: "Open a pull request or run a manual review to see AI insights.",
    href: "/reviews",
    icon: GitPullRequest,
    cta: "View reviews",
  },
];

export function GettingStartedChecklist({
  hasGithub,
  hasRepos,
  hasReviews,
}: GettingStartedChecklistProps) {
  const pathname = usePathname();
  const [celebrationDone, setCelebrationDone] = useState(false);
  // Session-only dismissal: hides the card for now but returns on refresh, so
  // it keeps showing until setup is actually complete.
  const [dismissed, setDismissed] = useState(false);

  // Realtime onboarding state: seeded with server props, kept fresh on focus
  // and via light polling while incomplete. Repo connect/disconnect also
  // invalidates this query for instant updates.
  const { data } = trpc.profile.onboardingStatus.useQuery(undefined, {
    initialData: { hasGithub, hasRepos, hasReviews },
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const d = query.state.data;
      const complete = d && d.hasGithub && d.hasRepos && d.hasReviews;
      return complete ? false : 10_000;
    },
  });

  const status = data ?? { hasGithub, hasRepos, hasReviews };
  const completedCount = STEPS.filter((s) => status[s.key]).length;
  const allDone = completedCount === STEPS.length;
  const activeIndex = STEPS.findIndex((s) => !status[s.key]);

  // Only celebrate (and then auto-hide) if the user finished setup during this
  // session. Returning users who are already done never see the card.
  const [startedIncomplete] = useState(
    () => !(hasGithub && hasRepos && hasReviews),
  );

  useEffect(() => {
    if (allDone && startedIncomplete && !celebrationDone) {
      const t = setTimeout(() => setCelebrationDone(true), 4500);
      return () => clearTimeout(t);
    }
  }, [allDone, startedIncomplete, celebrationDone]);

  const hidden =
    pathname !== "/repo" ||
    dismissed ||
    celebrationDone ||
    (allDone && !startedIncomplete);

  const dismiss = () => setDismissed(true);

  const progress = Math.round((completedCount / STEPS.length) * 100);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="gsc"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.4, ease }}
          className="mb-6 overflow-hidden"
        >
          <div className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-b from-card to-card/40 p-5 shadow-sm">
            {/* Premium accents */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/5 blur-3xl" />

            {/* Header */}
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <Rocket className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    Getting started
                  </h3>
                  <p className="text-[13px] text-muted-foreground">
                    {allDone
                      ? "You're all set — every pull request is now covered."
                      : "Finish setup to start catching bugs automatically."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:flex"
                  title="Updates automatically in realtime"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
                <button
                  onClick={dismiss}
                  aria-label="Dismiss getting started"
                  className="text-muted-foreground/60 transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="relative mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-primary to-primary/70"
                  initial={false}
                  animate={{ scaleX: completedCount / STEPS.length }}
                  transition={{ duration: 0.6, ease }}
                  style={{ width: "100%" }}
                />
              </div>
              <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>

            {/* Body */}
            <AnimatePresence mode="wait">
              {allDone ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease }}
                  className="relative mt-5 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-[13px] font-medium">
                    Setup complete. CodeCatch is now reviewing your repositories.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="steps"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="relative mt-5"
                >
                  {STEPS.map((step, i) => {
                    const done = status[step.key];
                    const isActive = i === activeIndex;
                    const Icon = step.icon;
                    const isLast = i === STEPS.length - 1;

                    return (
                      <div key={step.key} className="flex gap-3.5">
                        {/* Indicator + connector */}
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                              done
                                ? "border-primary bg-primary text-primary-foreground"
                                : isActive
                                  ? "border-primary/50 bg-primary/10 text-primary"
                                  : "border-border bg-muted/40 text-muted-foreground",
                            )}
                          >
                            {isActive && (
                              <span className="absolute inset-0 animate-pulse rounded-full ring-2 ring-primary/25" />
                            )}
                            <AnimatePresence mode="wait" initial={false}>
                              {done ? (
                                <motion.span
                                  key="check"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.25, ease }}
                                >
                                  <Check className="h-4 w-4" strokeWidth={3} />
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="icon"
                                  initial={{ scale: 0.6, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.6, opacity: 0 }}
                                  transition={{ duration: 0.2, ease }}
                                >
                                  <Icon className="h-[15px] w-[15px]" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          {!isLast && (
                            <div
                              className={cn(
                                "my-1 w-px flex-1 transition-colors duration-500",
                                done ? "bg-primary/40" : "bg-border",
                              )}
                              style={{ minHeight: 22 }}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div
                          className={cn(
                            "flex flex-1 items-start justify-between gap-3",
                            isLast ? "pb-0" : "pb-4",
                          )}
                        >
                          <div className="min-w-0 pt-1">
                            <p
                              className={cn(
                                "text-[13px] font-medium leading-tight transition-colors",
                                done
                                  ? "text-muted-foreground"
                                  : isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                              )}
                            >
                              {step.label}
                            </p>
                            <AnimatePresence initial={false}>
                              {isActive && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.25, ease }}
                                  className="mt-1 overflow-hidden text-xs leading-relaxed text-muted-foreground"
                                >
                                  {step.description}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>

                          {isActive && (
                            <Button asChild size="sm" className="mt-0.5 shrink-0">
                              <Link href={step.href}>
                                {step.cta}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
