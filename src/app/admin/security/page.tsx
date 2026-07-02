"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Globe,
  Zap,
  AlertTriangle,
  Users,
  MonitorCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AdminSecurityDashboard } from "@/features/security/admin-security-dashboard";

const PROTECTIONS = [
  {
    title: "Edge-Level Authentication",
    status: "Active",
    description:
      "Middleware validates sessions at the edge before any route logic executes.",
    icon: Lock,
    color: "text-green-500",
  },
  {
    title: "Session Token Hardening",
    status: "Active",
    description:
      "Strict regex and length validation for better-auth session cookies.",
    icon: Fingerprint,
    color: "text-blue-500",
  },
  {
    title: "Global Security Headers",
    status: "Active",
    description:
      "HSTS, CSP, XSS-Protection, and Frame Options are enforced globally.",
    icon: Globe,
    color: "text-indigo-500",
  },
  {
    title: "API Rate Limiting",
    status: "Active",
    description:
      "Upstash-powered rate limiting on all public and protected tRPC routes.",
    icon: Zap,
    color: "text-amber-500",
  },
];

export default function AdminSecurityPage() {
  const { data: settings, isLoading } =
    trpc.admin.getSecuritySettings.useQuery();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor and manage platform security posture.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1 text-sm font-medium text-green-500">
          <ShieldCheck className="h-4 w-4" />
          All Systems Secure
        </div>
      </div>

      {/* Live security stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Banned Users",
            value: settings?.bannedUsersCount,
            icon: Users,
            color: settings?.bannedUsersCount
              ? "text-red-500"
              : "text-muted-foreground",
          },
          {
            label: "Active Sessions",
            value: settings?.activeSessionsCount,
            icon: MonitorCheck,
            color: "text-green-500",
          },
          {
            label: "Failed Reviews (24h)",
            value: settings?.failedReviewsLast24h,
            icon: XCircle,
            color: settings?.failedReviewsLast24h
              ? "text-amber-500"
              : "text-muted-foreground",
          },
          {
            label: "Maintenance Mode",
            value: settings
              ? settings.maintenanceMode
                ? "ON"
                : "OFF"
              : undefined,
            icon: Wrench,
            color: settings?.maintenanceMode
              ? "text-red-500"
              : "text-muted-foreground",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PROTECTIONS.map((p) => (
          <Card key={p.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">{p.title}</CardTitle>
              <p.icon className={`h-4 w-4 ${p.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {p.status}
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                {p.description}
              </p>
            </CardContent>
            <div
              className={`absolute bottom-0 left-0 h-1 w-full opacity-20 bg-current ${p.color}`}
            />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Security Configuration</CardTitle>
            <CardDescription>
              Current security settings derived from live platform data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "Maintenance mode",
                  value: settings
                    ? settings.maintenanceMode
                      ? "Enabled"
                      : "Disabled"
                    : "—",
                  status: settings?.maintenanceMode ? "warn" : "ok",
                },
                {
                  label: "Banned users",
                  value: isLoading
                    ? "—"
                    : `${settings?.bannedUsersCount ?? 0} account(s) restricted`,
                  status: settings?.bannedUsersCount ? "warn" : "ok",
                },
                {
                  label: "Failed reviews (last 24 h)",
                  value: isLoading
                    ? "—"
                    : `${settings?.failedReviewsLast24h ?? 0} review(s) failed`,
                  status: settings?.failedReviewsLast24h ? "warn" : "ok",
                },
              ].map((e) => (
                <div
                  key={e.label}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${e.status === "ok" ? "bg-green-500" : "bg-amber-500"}`}
                    />
                    <p className="text-sm font-medium">{e.label}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {e.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <p className="text-muted-foreground">
              Your platform is currently following best practices. Consider the
              following:
            </p>
            <ul className="list-disc pl-4 space-y-2 text-muted-foreground/80">
              <li>Rotate GITHUB_WEBHOOK_SECRET every 90 days.</li>
              <li>Enable 2FA for all ADMIN accounts.</li>
              <li>Review audit logs for unusual repository connections.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* CVE / Vulnerability Analytics */}
      <AdminSecurityDashboard />
    </div>
  );
}
