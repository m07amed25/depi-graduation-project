"use client";

import Link from "next/link";
import Image from "next/image";
import { GitPullRequest, ArrowRight, Bot, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { features, accentTokens, type Accent } from "./product/product-data";
import { DiagramsShowcase } from "./product/DiagramsShowcase";

export function ProductContent() {
  return (
    <main className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pb-16 pt-24 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[55vh] w-[80vw] max-w-3xl -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(99,102,241,0.13),transparent_70%)]" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-violet-500/8 blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-indigo-500/8 blur-[60px]" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="relative max-w-4xl">
          <p className="mb-10 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-indigo-400/50" />
            The complete platform for better code
            <span className="inline-block h-px w-8 bg-indigo-400/50" />
          </p>
          <h1 className="mb-7 text-5xl font-extrabold leading-[1.04] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.25rem]">
            Ship code with<br />
            <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">confidence.</span>
          </h1>
          <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Code Catch connects to GitHub and analyses every pull request — surfacing bugs, security vulnerabilities, team insights, and architecture diagrams, automatically.
          </p>
          <div className="mb-16 flex flex-wrap items-center justify-center gap-5">
            <Link href="/repo" className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-[0_0_32px_rgba(99,102,241,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-[0_0_48px_rgba(99,102,241,0.5)]">
              Connect a repo <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              View pricing <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {features.map((f) => {
              const c = accentTokens[f.accent];
              const Icon = f.icon;
              return (
                <a key={f.id} href={`#${f.id}`} className={cn("inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] opacity-45 transition-opacity hover:opacity-100", c.text)}>
                  <Icon className="size-3" />{f.label}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="border-y border-border">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            {[
              { value: "60s", label: "Average review time" },
              { value: "30+", label: "Languages supported" },
              { value: "99%", label: "Secret detection rate" },
              { value: "10k+", label: "PRs reviewed" },
            ].map((s) => (
              <div key={s.label} className="px-8 py-10 text-center">
                <p className="text-4xl font-black tabular-nums tracking-tight text-foreground sm:text-5xl">{s.value}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature sections */}
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        {features.map((feature, i) => {
          const c = accentTokens[feature.accent];
          const Icon = feature.icon;
          const isEven = i % 2 === 0;
          return (
            <section key={feature.id} id={feature.id} className="scroll-mt-24 relative border-b border-border py-28 sm:py-36">
              <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 select-none font-black leading-none text-muted/50 text-[clamp(6rem,20vw,18rem)]">{feature.num}</span>
              <div className="relative grid items-center gap-14 md:grid-cols-2 md:gap-24">
                <div className={isEven ? "" : "md:col-start-2 md:row-start-1"}>
                  <p className={cn("mb-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em]", c.text)}>
                    <span className={cn("inline-block h-px w-10", c.line)} />{feature.label}
                  </p>
                  <h2 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                    {feature.headlineMain}<br /><span className={c.text}>{feature.headlineAccent}</span>
                  </h2>
                  <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground">{feature.body}</p>
                  <ul className="mb-10 space-y-3">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-sm text-foreground/80">
                        <span className={cn("mt-1.75 size-1.5 shrink-0 rounded-full", c.dot)} />{h}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-end gap-10">
                    <div>
                      <div className={cn("mb-2 h-px w-6", c.line)} />
                      <p className={cn("text-5xl font-black tabular-nums leading-none", c.text)}>{feature.stat.value}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{feature.stat.label}</p>
                    </div>
                    <Link href={feature.cta.href} className={cn("group mb-1 inline-flex items-center gap-1.5 border-b border-current pb-px text-sm font-medium opacity-60 transition-all hover:opacity-100", c.text)}>
                      {feature.cta.label} <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
                <div className={cn("relative flex items-center justify-center", isEven ? "" : "md:col-start-1 md:row-start-1")}>
                  <div className={cn("pointer-events-none absolute inset-0 -z-10 scale-75 rounded-full blur-[80px] opacity-25", c.glow)} />
                  {feature.id === "diagrams" ? (
                    <DiagramsShowcase />
                  ) : feature.image ? (
                    <div className={cn("w-full overflow-hidden rounded-2xl border shadow-2xl", c.border)}>
                      <div className="flex items-center gap-1.5 border-b border-border bg-muted/80 px-3 py-2 backdrop-blur-sm">
                        <span className="size-2.5 rounded-full bg-rose-500/60" />
                        <span className="size-2.5 rounded-full bg-amber-500/60" />
                        <span className="size-2.5 rounded-full bg-emerald-500/60" />
                        <div className="ml-2 flex flex-1 items-center rounded bg-muted px-2.5 py-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">codecatch.app</span>
                        </div>
                      </div>
                      <div className="relative bg-background">
                        <Image src={feature.image} alt={feature.label} width={800} height={500} className="h-auto w-full object-cover" priority={feature.id === "review"} />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-background/60 to-transparent" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* How it works */}
      <section className="relative border-t border-border py-28 sm:py-36">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 sm:px-8">
          <p className="mb-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-border" />How it works
          </p>
          <h2 className="mb-24 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            From push to insight<br /><span className="text-muted-foreground">in seconds.</span>
          </h2>
          <div className="relative grid gap-16 md:grid-cols-3 md:gap-12">
            <div aria-hidden className="absolute top-7 left-14 right-14 hidden h-px bg-border md:block" />
            {[
              { num: "01", icon: GitPullRequest, accent: "indigo" as Accent, title: "Connect your repo", desc: "Authenticate with GitHub and select the repositories you want to monitor. Code Catch installs a webhook and is ready in under two minutes." },
              { num: "02", icon: Bot, accent: "violet" as Accent, title: "AI reviews every PR", desc: "When a PR opens, Code Catch fetches the diff, runs full AI analysis, and posts inline comments directly on GitHub with a quality score." },
              { num: "03", icon: TrendingUp, accent: "cyan" as Accent, title: "Track and improve", desc: "Monitor quality scores, team velocity, security issues, and architecture evolution over time — all in one dashboard." },
            ].map(({ num, icon: StepIcon, accent, title, desc }) => {
              const c = accentTokens[accent];
              return (
                <div key={num} className="relative">
                  <div className="relative z-10 mb-8 flex size-14 items-center justify-center rounded-full border border-border bg-background">
                    <StepIcon className={cn("size-5", c.text)} />
                  </div>
                  <p className={cn("mb-3 font-mono text-xs uppercase tracking-widest", c.text)}>{num}</p>
                  <h3 className="mb-3 text-lg font-bold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-28 sm:px-8 sm:py-36">
          <div className="mb-10 h-px w-16 bg-indigo-400/50" />
          <p className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="size-3 text-indigo-400" />Free to get started
          </p>
          <h2 className="mb-8 text-5xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Ready to level up<br /><span className="text-muted-foreground">your code review?</span>
          </h2>
          <p className="mb-12 max-w-lg text-base leading-relaxed text-muted-foreground">Connect your first repository in under two minutes. No credit card required. Start catching issues before they reach production.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/repo" className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(99,102,241,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]">
              Connect a repository <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              View pricing <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
