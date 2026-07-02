"use client";

import { motion } from "motion/react";
import { Suspense } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Github, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RevealSection } from "./about/RevealSection";
import { AboutStatsGrid } from "./about/AboutStatsGrid";
import { TeamSection } from "./about/TeamSection";
import { values, milestones } from "./about/about-data";

export function AboutContent() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 top-[-20%] z-0 h-[80%] w-full bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(120,119,198,0.18),transparent_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><path d=%22M0 0h40v40H0z%22 fill=%22none%22 stroke=%22white%22 stroke-width=%220.5%22/></svg>')]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm backdrop-blur-md mb-8">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-muted-foreground">Our Story</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight" style={{ textWrap: "balance" }}>
            Built by developers,{" "}
            <span className="bg-linear-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">for developers</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.22 }} className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed" style={{ textWrap: "balance" }}>
            Code Catch was born from a simple frustration: great code was being delayed by slow, inconsistent reviews. We set out to fix that — with AI that never sleeps and always has context.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.34 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold">
              <Link href="/sign-up">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="h-12 px-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent border border-border">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Suspense fallback={null}><AboutStatsGrid /></Suspense>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <RevealSection>
            <Badge variant="outline" className="mb-5 border-indigo-500/30 text-indigo-400 bg-indigo-500/10">Our Mission</Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Raise the bar for{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-violet-400">every codebase</span>
            </h2>
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed">We believe code review is the highest-leverage moment in software development — yet it is still largely manual, inconsistent, and painfully slow.</p>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">Our mission is to give every developer an always-available AI reviewer that catches bugs, surfaces security risks, and provides actionable feedback — before a single human reviewer is pulled away from building.</p>
            <ul className="mt-8 space-y-3">
              {["Zero configuration GitHub integration", "Security scanning on every PR, automatically", "Suggestions with context, not just complaints", "Works across languages, frameworks, and team sizes"].map((item) => (
                <li key={item} className="flex items-start gap-3 text-foreground/80">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </RevealSection>
          <RevealSection delay={0.15}>
            <div className="relative rounded-2xl border border-border bg-muted/30 p-8 overflow-hidden">
              <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />
              <div className="relative space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center"><Sparkles className="h-4 w-4 text-indigo-400" /></div>
                  <div><p className="text-sm font-semibold text-foreground">Code Catch</p><p className="text-xs text-muted-foreground">just now · auth/login.ts</p></div>
                  <Badge className="ml-auto text-xs bg-rose-500/15 text-rose-400 border-rose-500/20">Security Risk</Badge>
                </div>
                <div className="rounded-lg bg-muted border border-border p-4 text-sm font-mono text-foreground/80">
                  <span className="text-rose-400">−</span> <span className="text-zinc-500">const token = req.query.token;</span><br />
                  <span className="text-emerald-400">+</span> <span>const token = validateToken(req.query.token);</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">⚠️ Unsanitized query parameter passed directly to authentication logic. This is vulnerable to injection attacks (OWASP A03:2021). Validate and sanitize before use.</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">CWE-20</Badge>
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">OWASP A03</Badge>
                  <span className="ml-auto text-xs text-indigo-400 font-medium">Auto-fix available →</span>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <RevealSection className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-violet-500/30 text-violet-400 bg-violet-500/10">Our Journey</Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">How we got here</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">From a late-night frustration to a product used by hundreds of teams.</p>
          </RevealSection>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-border to-transparent hidden sm:block" />
            <div className="space-y-12">
              {milestones.map((milestone, i) => (
                <RevealSection key={milestone.year} delay={i * 0.1}>
                  <div className="flex gap-6 sm:gap-8">
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div className="h-12 w-12 rounded-xl border border-border bg-muted flex items-center justify-center shadow-lg z-10">
                        <milestone.icon className={`h-5 w-5 ${milestone.color}`} />
                      </div>
                      {i < milestones.length - 1 && <div className="flex-1 w-px bg-border mt-3 sm:hidden" />}
                    </div>
                    <div className="pb-2">
                      <span className={`inline-block text-xs font-bold uppercase tracking-widest mb-2 ${milestone.color}`}>{milestone.year}</span>
                      <h3 className="text-xl font-bold text-foreground mb-2">{milestone.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <RevealSection className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-indigo-500/30 text-indigo-400 bg-indigo-500/10">What We Stand For</Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Principles that guide{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">every decision</span>
          </h2>
        </RevealSection>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((value, i) => (
            <RevealSection key={value.title} delay={i * 0.07}>
              <div className={`group relative h-full rounded-2xl border border-border bg-muted/20 p-6 transition-all duration-300 hover:bg-muted/40 hover:border-border hover:shadow-xl ${value.shadow} ${value.border}`}>
                <div className={`h-10 w-10 rounded-xl ${value.bg} flex items-center justify-center mb-4`}>
                  <value.icon className={`h-5 w-5 ${value.color}`} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Team */}
      <TeamSection />

      {/* CTA */}
      <section className="border-t border-border relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_120%,rgba(120,119,198,0.25),transparent_100%)]" />
        <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <RevealSection>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-muted/50 border border-border text-sm text-indigo-300">
              <Sparkles className="h-4 w-4" /><span>Start reviewing smarter today</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              Ready to{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-blue-400 to-cyan-400">ship better code?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10 leading-relaxed">Connect your GitHub repository and get your first AI-powered review in under two minutes. No credit card required.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-10 text-base rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold">
                <Link href="/sign-up"><Github className="mr-2 h-5 w-5" />Connect GitHub — it&apos;s free</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-14 px-10 text-base rounded-full text-muted-foreground hover:text-foreground hover:bg-accent border border-border">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </RevealSection>
        </div>
      </section>
    </main>
  );
}
