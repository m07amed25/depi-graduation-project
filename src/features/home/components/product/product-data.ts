import { GitPullRequest, Users, BarChart3, Shield, GitBranch } from "lucide-react";

export type Accent = "indigo" | "violet" | "cyan" | "rose" | "emerald";

export const accentTokens: Record<Accent, { text: string; dot: string; glow: string; line: string; border: string }> = {
  indigo: { text: "text-indigo-400", dot: "bg-indigo-400", glow: "bg-indigo-500/20", line: "bg-indigo-400/60", border: "border-indigo-500/25" },
  violet: { text: "text-violet-400", dot: "bg-violet-400", glow: "bg-violet-500/20", line: "bg-violet-400/60", border: "border-violet-500/25" },
  cyan: { text: "text-cyan-400", dot: "bg-cyan-400", glow: "bg-cyan-500/20", line: "bg-cyan-400/60", border: "border-cyan-500/25" },
  rose: { text: "text-red-500", dot: "bg-red-400", glow: "bg-red-500/20", line: "bg-red-400/60", border: "border-red-500/25" },
  emerald: { text: "text-emerald-400", dot: "bg-emerald-400", glow: "bg-emerald-500/20", line: "bg-emerald-400/60", border: "border-emerald-500/25" },
};

export const features: {
  num: string;
  id: string;
  label: string;
  icon: React.ElementType;
  accent: Accent;
  headlineMain: string;
  headlineAccent: string;
  body: string;
  highlights: string[];
  stat: { value: string; label: string };
  cta: { label: string; href: string };
  image: string | null;
}[] = [
  { num: "01", id: "review", label: "Code Review", icon: GitPullRequest, accent: "indigo", headlineMain: "AI-powered review", headlineAccent: "in seconds.", body: "Connect your GitHub repository and let Code Catch automatically analyse every pull request — catching bugs, style issues, and bad patterns before they reach production.", highlights: ["GPT-4 level analysis on every pull request", "Inline, actionable suggestions posted on GitHub", "Supports 30+ programming languages", "Results delivered in under 60 seconds"], stat: { value: "60s", label: "Average review time" }, cta: { label: "Start reviewing", href: "/repo" }, image: "/review-code-feature.png" },
  { num: "02", id: "teams", label: "Teams", icon: Users, accent: "violet", headlineMain: "Code review is", headlineAccent: "better together.", body: "Invite your whole engineering org. Share repositories, assign reviewers, track team velocity, and keep every developer aligned — all from one place.", highlights: ["Unlimited team members on any plan", "Shared review dashboards across the org", "Role-based access control", "Team velocity and workload metrics"], stat: { value: "3×", label: "Faster review cycles" }, cta: { label: "Manage teams", href: "/teams" }, image: "/team-feature1.png" },
  { num: "03", id: "analytics", label: "Analytics", icon: BarChart3, accent: "cyan", headlineMain: "Engineering intelligence,", headlineAccent: "built-in.", body: "Track PR throughput, reviewer workloads, recurring bug categories, and code quality trends over time. Make data-driven decisions about your engineering process.", highlights: ["PR throughput and cycle time charts", "Per-repository quality score history", "Recurring issue pattern detection", "Top reviewer leaderboard"], stat: { value: "40+", label: "Built-in metrics" }, cta: { label: "View analytics", href: "/analytics" }, image: "/analytics-feature.png" },
  { num: "04", id: "security", label: "Security", icon: Shield, accent: "rose", headlineMain: "Catch vulnerabilities", headlineAccent: "before they ship.", body: "Every pull request is automatically scanned for OWASP Top 10 vulnerabilities, leaked secrets, dependency issues, and insecure patterns — keeping your codebase safe by default.", highlights: ["OWASP Top 10 automatic detection", "Secrets and credential scanning", "Dependency vulnerability checks", "Security score attached to every PR"], stat: { value: "99%", label: "Secret detection rate" }, cta: { label: "Explore security", href: "/security" }, image: "/security-feature.png" },
  { num: "05", id: "diagrams", label: "Diagrams", icon: GitBranch, accent: "emerald", headlineMain: "Architecture diagrams,", headlineAccent: "auto-generated.", body: "Code Catch reads your repository structure and generates up-to-date architecture, entity-relationship, and sequence diagrams — no manual maintenance ever required.", highlights: ["Component dependency graphs", "ER diagrams from database schema", "Sequence flow visualisation", "Always synced with your codebase"], stat: { value: "Auto", label: "Always up to date" }, cta: { label: "See diagrams", href: "/repo" }, image: null },
];

export const SAMPLE_SEQUENCE_DIAGRAM = `sequenceDiagram
  participant Dev as 👨‍💻 Developer
  participant GH as 🐙 GitHub
  participant CC as ⚡ Code Catch
  participant AI as 🤖 AI Engine
  participant Team as 👥 Team

  Dev->>GH: git push / open PR
  GH-->>CC: Webhook: pull_request opened
  CC->>AI: Analyse diff + context
  AI-->>CC: Review comments + score
  CC->>GH: Post inline comments
  CC->>Team: 🔔 Notify reviewers
  Team->>GH: Approve or request changes
  GH-->>CC: PR merged
  CC->>CC: Update analytics dashboard`;

export const SAMPLE_FLOW_DIAGRAM = `flowchart LR
  PR[📋 Pull Request] --> Fetch[Fetch Diff]
  Fetch --> Lang{Detect Language}
  Lang -- TypeScript --> TS[TS Analyser]
  Lang -- Python --> PY[Python Analyser]
  Lang -- Go --> GO[Go Analyser]
  TS & PY & GO --> AI[🤖 AI Review Engine]
  AI --> Sec[🔒 Security Scan]
  AI --> Style[✨ Style Check]
  AI --> Logic[🧠 Logic Review]
  Sec & Style & Logic --> Score[📊 Quality Score]
  Score --> Post[Post to GitHub]`;
