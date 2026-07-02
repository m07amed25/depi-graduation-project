import type { Metadata } from "next";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home";
import {
  Shield,
  Lock,
  Eye,
  Server,
  Key,
  Bug,
  Mail,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Security - Code Catch",
  description:
    "Learn about Code Catch's security practices, infrastructure, data protection, and responsible disclosure policy.",
};

const practices = [
  {
    icon: Lock,
    title: "Encryption",
    description:
      "All data is encrypted in transit (TLS 1.3) and at rest. Database connections use SSL with certificate verification.",
  },
  {
    icon: Key,
    title: "Authentication",
    description:
      "Session-based auth with secure HTTP-only cookies, CSRF protection, and optional OAuth via GitHub. Tokens are never stored in localStorage.",
  },
  {
    icon: Server,
    title: "Infrastructure",
    description:
      "Hosted on Vercel's SOC 2 compliant platform. Database on Neon PostgreSQL with automated backups and point-in-time recovery.",
  },
  {
    icon: Eye,
    title: "Minimal Data Access",
    description:
      "We only access repository data you explicitly connect. Code is processed in memory during reviews and never stored permanently.",
  },
  {
    icon: Shield,
    title: "Rate Limiting & DDoS Protection",
    description:
      "All API endpoints are rate-limited per user and IP. Vercel's edge network provides DDoS mitigation at the infrastructure level.",
  },
  {
    icon: CheckCircle,
    title: "Security Headers",
    description:
      "Strict CSP, HSTS, X-Frame-Options DENY, and Referrer-Policy headers are enforced on every response.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <UnifiedNavbar />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Hero */}
        <div className="relative mb-20">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/[0.07] rounded-full blur-[100px]" />
          </div>

          <div className="flex flex-col items-center text-center pt-4">
            {/* Animated shield cluster */}
            <div className="relative mb-8">
              <div className="size-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <Shield className="size-10 text-indigo-400" />
              </div>
              <div className="absolute -top-2 -right-2 size-7 rounded-full bg-emerald-500 border-[3px] border-background flex items-center justify-center shadow-md">
                <CheckCircle className="size-4 text-white" />
              </div>
              <div className="absolute -bottom-1 -left-2 size-6 rounded-lg bg-muted border border-border flex items-center justify-center">
                <Lock className="size-3 text-muted-foreground" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              Security at Code Catch
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
              Your code never leaves your control. We process reviews in memory,
              encrypt everything, and retain nothing.
            </p>

            {/* Trust indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border">
                <Lock className="size-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">TLS 1.3</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border">
                <Server className="size-4 text-blue-500 shrink-0" />
                <span className="text-sm font-medium">SOC 2 Infra</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border">
                <Eye className="size-4 text-purple-500 shrink-0" />
                <span className="text-sm font-medium">Zero Retention</span>
              </div>
            </div>
          </div>
        </div>

        {/* Practices Grid */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            Security Practices
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {practices.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Responsible Disclosure */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Responsible Disclosure
          </h2>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Bug className="size-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you discover a security vulnerability, we appreciate your
                  help in disclosing it responsibly. Please do not open a public
                  GitHub issue for security vulnerabilities.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">
                    To report a vulnerability:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                    <li>
                      Email us at{" "}
                      <a
                        href="mailto:codecatch27@gmail.com"
                        className="text-indigo-500 hover:underline"
                      >
                        codecatch27@gmail.com
                      </a>{" "}
                      with a description of the issue
                    </li>
                    <li>Include steps to reproduce the vulnerability</li>
                    <li>Allow up to 72 hours for an initial response</li>
                    <li>
                      We&apos;ll work with you to understand and address the issue
                      before any public disclosure
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Don't Do */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Data Handling Commitments
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <CheckCircle className="size-4 text-emerald-500 mt-0.5 shrink-0" />
              We never store your source code after a review is complete
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="size-4 text-emerald-500 mt-0.5 shrink-0" />
              We never share your code or data with third parties
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="size-4 text-emerald-500 mt-0.5 shrink-0" />
              We never use your code to train AI models
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="size-4 text-emerald-500 mt-0.5 shrink-0" />
              AI provider API calls use ephemeral processing — no data retention
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="size-4 text-emerald-500 mt-0.5 shrink-0" />
              You can disconnect repositories and delete your account at any time
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section>
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
              <Mail className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Questions?</h3>
              <p className="text-sm text-muted-foreground">
                For security-related questions, reach out to{" "}
                <a
                  href="mailto:codecatch27@gmail.com"
                  className="text-indigo-500 hover:underline"
                >
                  codecatch27@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
