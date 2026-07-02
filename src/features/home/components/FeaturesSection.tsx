"use client";

import { Shield, GitPullRequest, BarChart3, Users, Zap, GitBranch } from "lucide-react";
import { motion } from "motion/react";

const features = [
  { icon: GitPullRequest, title: "Automated PR review", description: "Every pull request analyzed for bugs, anti-patterns, and code smells. Inline comments posted directly to GitHub.", detail: "Works with 50+ languages" },
  { icon: Shield, title: "Security scanning", description: "OWASP vulnerabilities, dependency risks, and secret leaks detected before they reach production.", detail: "CVE database updated daily" },
  { icon: Zap, title: "Multi-model AI", description: "OpenAI, Gemini, Groq, and Hugging Face. Pick the model that fits your codebase and budget.", detail: "Switch models per repo" },
  { icon: Users, title: "Team collaboration", description: "Threaded discussions, real-time presence, and shared review workflows for engineering teams.", detail: "Real-time via Pusher" },
  { icon: GitBranch, title: "Architecture diagrams", description: "ERD, class, and use-case diagrams generated automatically from your ORM schemas and code.", detail: "Prisma, TypeORM, Drizzle, more" },
  { icon: BarChart3, title: "Quality analytics", description: "Track review velocity, issue density, and code quality trends across repositories and sprints.", detail: "Exportable reports" },
];

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function FeaturesSection() {
  return (
    <section className="border-t border-border py-20 sm:py-28" id="features" aria-labelledby="features-heading">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <motion.h2
          id="features-heading"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl sm:text-2xl font-semibold tracking-tight"
        >
          Everything your PR needs.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 text-muted-foreground text-sm max-w-[55ch]"
        >
          Plugs into your existing GitHub workflow. No configuration, no context switching. Reviews land before your morning coffee.
        </motion.p>

        <div className="mt-12 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 border border-border rounded-sm overflow-hidden">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={cardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              custom={i}
              className="bg-background p-5 sm:p-6 flex flex-col gap-3 group hover:bg-muted/30 transition-colors duration-150"
            >
              <div className="flex items-center gap-2.5">
                <feature.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-[0.9375rem] font-semibold leading-tight">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              <span className="mt-auto text-[11px] font-mono text-muted-foreground/60">{feature.detail}</span>
            </motion.div>
          ))}
        </div>

        {/* Before/After diff */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 grid sm:grid-cols-2 gap-4"
        >
          <div className="rounded-sm border border-border overflow-hidden">
            <div className="px-3 py-1.5 bg-muted/40 border-b border-border text-[10px] font-mono text-muted-foreground flex items-center justify-between">
              <span>Before Code Catch</span>
              <span className="text-destructive">3 issues shipped</span>
            </div>
            <div className="p-4 text-[11px] font-mono space-y-1.5 text-muted-foreground">
              <p><span className="text-destructive/60">✗</span> SQL injection in user query</p>
              <p><span className="text-destructive/60">✗</span> Unvalidated redirect URL</p>
              <p><span className="text-destructive/60">✗</span> Hardcoded API key in config</p>
              <p className="text-muted-foreground/40 pt-2">Discovered 3 weeks later in production.</p>
            </div>
          </div>
          <div className="rounded-sm border border-border overflow-hidden">
            <div className="px-3 py-1.5 bg-muted/40 border-b border-border text-[10px] font-mono text-muted-foreground flex items-center justify-between">
              <span>After Code Catch</span>
              <span className="text-[oklch(0.55_0.15_155)]">0 issues shipped</span>
            </div>
            <div className="p-4 text-[11px] font-mono space-y-1.5 text-muted-foreground">
              <p><span className="text-[oklch(0.55_0.15_155)]">✓</span> SQL injection caught at PR #89 <span className="text-muted-foreground/40">· fixed in 4 min</span></p>
              <p><span className="text-[oklch(0.55_0.15_155)]">✓</span> Redirect validation added at PR #91 <span className="text-muted-foreground/40">· fixed in 2 min</span></p>
              <p><span className="text-[oklch(0.55_0.15_155)]">✓</span> Secret moved to env at PR #91 <span className="text-muted-foreground/40">· fixed in 1 min</span></p>
              <p className="text-muted-foreground/40 pt-2">All caught before merge. Zero production incidents.</p>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-4 text-xs text-muted-foreground/60 font-mono"
        >
          Works with TypeScript, Python, Go, Rust, Java, Ruby, and 44 more languages.
        </motion.p>
      </div>
    </section>
  );
}
