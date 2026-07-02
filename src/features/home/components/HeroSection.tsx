"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "@/lib/auth-client";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const timelineItem = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, delay: 0.4 + i * 0.15, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function HeroSection() {
  const { data: session } = useSession();
  return (
    <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-14 items-start">
          {/* Left: Copy */}
          <div>
            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={0} className="text-xs font-mono text-primary/80 mb-3 tracking-wide">AI CODE REVIEW FOR GITHUB</motion.p>
            <motion.h1
              id="hero-heading"
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight leading-[1.08]"
            >
              Catch bugs before your users do.
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="mt-4 text-muted-foreground text-[0.9375rem] sm:text-base max-w-[44ch] leading-relaxed">
              Every pull request reviewed for security holes, logic errors, and code smells. Feedback lands as inline GitHub comments before your team even looks at it.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={session?.user ? "/repo" : "/sign-up"}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors duration-150"
              >
                {session?.user ? "Repositories" : "Start for free"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm hover:bg-muted transition-colors duration-150"
              >
                View pricing
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={4} className="mt-3 text-xs text-muted-foreground/60 font-mono">
              No credit card · Works with any GitHub repo · Setup in 30 seconds
            </motion.p>
          </div>

          {/* Right: Review timeline */}
          <div className="relative">
            <motion.div
              initial={{ scaleY: 0, originY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-[15px] top-4 bottom-4 w-px bg-border"
            />

            {/* Event 1: PR opened */}
            <motion.div variants={timelineItem} initial="hidden" animate="visible" custom={0} className="flex gap-3 items-start pb-4">
              <div className="relative z-10 h-[28px] w-[28px] shrink-0 rounded-full border border-border bg-background flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-[oklch(0.55_0.15_155)]" />
              </div>
              <div className="pt-0.5 flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-foreground font-medium">PR #142 opened</p>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">0s</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">feat: add session management to auth flow</p>
              </div>
            </motion.div>

            {/* Event 2: Review started */}
            <motion.div variants={timelineItem} initial="hidden" animate="visible" custom={1} className="flex gap-3 items-start pb-4">
              <div className="relative z-10 h-[28px] w-[28px] shrink-0 rounded-full border border-border bg-background flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="pt-0.5 flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-foreground font-medium">Code Catch reviewing</p>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">0.4s</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Scanning 3 files, 47 lines changed</p>
              </div>
            </motion.div>

            {/* Event 3: Issues found */}
            <motion.div variants={timelineItem} initial="hidden" animate="visible" custom={2} className="flex gap-3 items-start pb-4">
              <div className="relative z-10 h-[28px] w-[28px] shrink-0 rounded-full border border-border bg-background flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-destructive" />
              </div>
              <div className="pt-0.5 flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-foreground font-medium">2 issues found</p>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">1.2s</span>
                </div>

                <div className="mt-2 rounded-sm border border-border bg-card overflow-hidden text-[11px] font-mono">
                  <div className="flex items-center px-3 py-1.5 border-b border-border bg-muted/40 text-[10px] text-muted-foreground">
                    <span>auth/login.ts</span>
                    <span className="ml-auto text-destructive">L4</span>
                  </div>
                  <div className="px-3 py-2 text-muted-foreground bg-destructive/[0.03]">
                    <code><span className="text-primary/70">const</span> token = jwt.sign(payload, secret)</code>
                  </div>
                  <div className="px-3 py-2 text-[11px] text-muted-foreground leading-relaxed border-t border-border">
                    <span className="inline-block px-1.5 py-0.5 rounded-sm bg-destructive/10 text-destructive text-[10px] font-medium mr-1.5">security</span>
                    No expiration. Add <code className="px-1 py-0.5 bg-muted rounded-sm text-foreground text-[10px]">expiresIn: &quot;1h&quot;</code>
                  </div>
                </div>

                <div className="mt-1.5 rounded-sm border border-border bg-card overflow-hidden text-[11px] font-mono">
                  <div className="flex items-center px-3 py-1.5 border-b border-border bg-muted/40 text-[10px] text-muted-foreground">
                    <span>auth/login.ts</span>
                    <span className="ml-auto text-[oklch(0.65_0.15_75)]">L6</span>
                  </div>
                  <div className="px-3 py-2 text-muted-foreground bg-[oklch(0.65_0.15_75/0.03)]">
                    <code><span className="text-primary/70">res</span>.cookie(<span className="text-[oklch(0.65_0.12_155)]">&quot;session&quot;</span>, token, {"{"} httpOnly: true {"}"})</code>
                  </div>
                  <div className="px-3 py-2 text-[11px] text-muted-foreground leading-relaxed border-t border-border">
                    <span className="inline-block px-1.5 py-0.5 rounded-sm bg-[oklch(0.65_0.15_75/0.1)] text-[oklch(0.65_0.15_75)] text-[10px] font-medium mr-1.5">suggestion</span>
                    Add <code className="px-1 py-0.5 bg-muted rounded-sm text-foreground text-[10px]">sameSite: &quot;strict&quot;</code> for CSRF protection.
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Event 4: Done */}
            <motion.div variants={timelineItem} initial="hidden" animate="visible" custom={3} className="flex gap-3 items-start">
              <div className="relative z-10 h-[28px] w-[28px] shrink-0 rounded-full border border-border bg-background flex items-center justify-center">
                <svg className="h-3 w-3 text-[oklch(0.55_0.15_155)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5l3.5 3.5 6.5-7" /></svg>
              </div>
              <div className="pt-0.5 flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-foreground font-medium">Review complete</p>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">1.2s total</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Comments posted to GitHub. Ready for human review.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
