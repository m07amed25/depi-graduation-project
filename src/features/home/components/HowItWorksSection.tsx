"use client";

import { Github, GitPullRequest, MessageSquare } from "lucide-react";
import { motion } from "motion/react";

const steps = [
  { num: "01", icon: Github, title: "Connect your GitHub", desc: "One OAuth click. No tokens to manage, no YAML to write, no CLI to install. Pick which repos to watch and you're done.", detail: "Works with public and private repos. GitHub App permissions are minimal and revocable." },
  { num: "02", icon: GitPullRequest, title: "Open a pull request", desc: "Code Catch triggers automatically on every PR. By the time you finish writing the description, the review is already waiting.", detail: "Analyzes diffs, not entire files. Understands context from surrounding code and commit history." },
  { num: "03", icon: MessageSquare, title: "Get actionable feedback", desc: "Inline comments appear directly on the PR. Security issues, bugs, and suggestions with fix examples. Not noise.", detail: "Severity-tagged. Filterable. Each comment links to the relevant best practice or CVE." },
];

const stepVariant = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function HowItWorksSection() {
  return (
    <section className="bg-card/50 py-20 sm:py-28" id="how-it-works" aria-labelledby="how-heading">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-14"
        >
          <div>
            <h2 id="how-heading" className="text-[clamp(1.375rem,3vw,1.75rem)] font-bold tracking-tight leading-tight">
              Three steps. No meetings.
            </h2>
            <p className="mt-2 text-[0.9375rem] text-muted-foreground max-w-[45ch] leading-relaxed">
              Most teams are reviewing code within 5 minutes of signing up.
            </p>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground/40 tracking-wide">AVG SETUP: 47s</span>
        </motion.div>

        <div className="grid gap-0 border border-border rounded-sm overflow-hidden">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              variants={stepVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              custom={i}
              className={`grid sm:grid-cols-[180px_1fr] gap-5 sm:gap-10 p-6 sm:py-8 sm:px-8 ${i !== steps.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex sm:flex-col gap-3">
                <span className="text-[2.5rem] font-bold leading-none text-border/60 tabular-nums tracking-tighter">{s.num}</span>
                <div className="flex items-center gap-2 sm:mt-1">
                  <s.icon className="h-3.5 w-3.5 text-primary/70" />
                  <h3 className="text-base font-semibold tracking-tight">{s.title}</h3>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2">
                <p className="text-[0.9375rem] text-muted-foreground leading-[1.65] max-w-[55ch]">{s.desc}</p>
                <p className="text-[11px] font-mono text-muted-foreground/40 leading-relaxed tracking-wide">{s.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
