"use client";

import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GitPullRequest,
  Database,
  Users2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string;
  value?: number | string;
  icon: React.ElementType;
  description?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

const chartConfig = {
  users: { label: "New users", color: "hsl(var(--chart-1))" },
  reviews: { label: "Reviews", color: "hsl(var(--chart-2))" },
};

import {
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Settings as SettingsIcon,
  Plus,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  );
  const { data: growth, isLoading: growthLoading } =
    trpc.admin.getGrowthData.useQuery(undefined, {
      staleTime: 5 * 60 * 1000,
    });

  const reportQuery = trpc.admin.getFullReport.useQuery(undefined, { enabled: false });

  const exportReport = async () => {
    const { data: report } = await reportQuery.refetch();
    if (!report) return;

    const html = `<!DOCTYPE html><html><head><title>System Report - Code Catch</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,system-ui,sans-serif;padding:48px;color:#111;line-height:1.5;max-width:900px;margin:0 auto}
h1{font-size:28px;font-weight:800;letter-spacing:-0.5px}
h2{font-size:16px;font-weight:700;margin-top:36px;padding-bottom:8px;border-bottom:2px solid #111;text-transform:uppercase;letter-spacing:0.5px}
.meta{color:#666;font-size:12px;margin-top:4px;margin-bottom:32px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
.stat{background:#f8f8f8;border:1px solid #e5e5e5;border-radius:8px;padding:16px;text-align:center}
.stat-value{font-size:32px;font-weight:800;color:#111}
.stat-label{font-size:11px;color:#666;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
td,th{text-align:left;padding:8px 10px;border-bottom:1px solid #eee}
th{font-weight:700;background:#f8f8f8;text-transform:uppercase;font-size:10px;letter-spacing:0.5px}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600}
.badge-paid{background:#d1fae5;color:#065f46}
.badge-pending{background:#fef3c7;color:#92400e}
.badge-failed{background:#fee2e2;color:#991b1b}
.badge-refunded{background:#dbeafe;color:#1e40af}
.section{page-break-inside:avoid}
.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11px;color:#999;text-align:center}
@media print{body{padding:24px}h2{margin-top:24px}}
</style></head><body>
<h1>Code Catch — Full System Report</h1>
<p class="meta">Generated: ${new Date(report.generatedAt).toLocaleString()} | Environment: Production</p>

<div class="section">
<h2>Platform Overview</h2>
<div class="grid">
<div class="stat"><div class="stat-value">${report.platform.totalUsers}</div><div class="stat-label">Total Users</div></div>
<div class="stat"><div class="stat-value">${report.platform.totalRepos}</div><div class="stat-label">Repositories</div></div>
<div class="stat"><div class="stat-value">${report.platform.totalReviews}</div><div class="stat-label">AI Reviews</div></div>
<div class="stat"><div class="stat-value">${report.platform.totalTeams}</div><div class="stat-label">Teams</div></div>
</div>
</div>

<div class="section">
<h2>Growth & Activity</h2>
<div class="grid">
<div class="stat"><div class="stat-value">${report.platform.usersThisWeek}</div><div class="stat-label">Users (7d)</div></div>
<div class="stat"><div class="stat-value">${report.platform.usersThisMonth}</div><div class="stat-label">Users (30d)</div></div>
<div class="stat"><div class="stat-value">${report.platform.reviewsThisWeek}</div><div class="stat-label">Reviews (7d)</div></div>
<div class="stat"><div class="stat-value">${report.platform.reviewsThisMonth}</div><div class="stat-label">Reviews (30d)</div></div>
</div>
</div>

<div class="section">
<h2>Review Status Breakdown</h2>
<div class="grid">
<div class="stat"><div class="stat-value">${report.reviews.completed}</div><div class="stat-label">Completed</div></div>
<div class="stat"><div class="stat-value">${report.reviews.processing}</div><div class="stat-label">Processing</div></div>
<div class="stat"><div class="stat-value">${report.reviews.pending}</div><div class="stat-label">Pending</div></div>
<div class="stat"><div class="stat-value">${report.reviews.failed}</div><div class="stat-label">Failed</div></div>
</div>
</div>

<div class="section">
<h2>Billing & Revenue</h2>
<div class="grid">
<div class="stat"><div class="stat-value">$${report.billing.totalRevenue}</div><div class="stat-label">Total Revenue</div></div>
<div class="stat"><div class="stat-value">${report.billing.paidInvoices}</div><div class="stat-label">Paid</div></div>
<div class="stat"><div class="stat-value">${report.billing.pendingInvoices}</div><div class="stat-label">Pending</div></div>
<div class="stat"><div class="stat-value">${report.billing.failedInvoices + report.billing.refundedInvoices}</div><div class="stat-label">Failed/Refunded</div></div>
</div>
</div>

<div class="section">
<h2>Plan Distribution</h2>
<table>
<tr><th>Plan</th><th>Users</th><th>% of Total</th></tr>
${report.plans.map(p => `<tr><td>${p.planId}</td><td>${p.count}</td><td>${((p.count / report.platform.totalUsers) * 100).toFixed(1)}%</td></tr>`).join("")}
</table>
</div>

<div class="section">
<h2>Recent Users (Last 10)</h2>
<table>
<tr><th>Name</th><th>Email</th><th>Plan</th><th>Joined</th></tr>
${report.recentUsers.map(u => `<tr><td>${u.name ?? "—"}</td><td>${u.email}</td><td>${u.planId}</td><td>${new Date(u.createdAt).toLocaleDateString()}</td></tr>`).join("")}
</table>
</div>

<div class="section">
<h2>Recent Invoices (Last 10)</h2>
<table>
<tr><th>ID</th><th>User</th><th>Amount</th><th>Plan</th><th>Status</th><th>Date</th></tr>
${report.recentInvoices.map(i => `<tr><td style="font-family:monospace;font-size:10px">${i.id.slice(0, 12)}…</td><td>${i.email}</td><td>${i.amount} ${i.currency}</td><td>${i.planId ?? "—"}</td><td><span class="badge badge-${i.status.toLowerCase()}">${i.status}</span></td><td>${new Date(i.createdAt).toLocaleDateString()}</td></tr>`).join("")}
</table>
</div>

<div class="footer">
Code Catch System Report — Confidential — ${new Date().getFullYear()}
</div>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => { win.print(); URL.revokeObjectURL(url); };
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Command Center
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your platform and monitor AI performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportReport} disabled={statsLoading}>
            <FileDown className="h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/admin/settings">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button size="sm" className="gap-2" asChild>
            <Link href="/admin/repos">
              <Plus className="h-4 w-4" />
              Add Repo
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Global Users"
          value={stats?.totalUsers}
          icon={Users}
          description={`+${stats?.recentSignups ?? 0} this week`}
          loading={statsLoading}
        />
        <StatCard
          title="AI Reviews"
          value={stats?.totalReviews}
          icon={GitPullRequest}
          description={`+${stats?.reviewsLast7Days ?? 0} last 7 days`}
          loading={statsLoading}
        />
        <StatCard
          title="Managed Repos"
          value={stats?.totalRepositories}
          icon={Database}
          loading={statsLoading}
        />
        <StatCard
          title="Active Teams"
          value={stats?.totalTeams}
          icon={Users2}
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Growth Trends</CardTitle>
              <CardDescription>
                Visualizing user and review expansion
              </CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pb-4">
            {growthLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growth}>
                    <defs>
                      <linearGradient
                        id="colorUsers"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-users)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-users)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorReviews"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-reviews)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-reviews)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted/50"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.slice(5)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="var(--color-users)"
                      fill="url(#colorUsers)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="reviews"
                      stroke="var(--color-reviews)"
                      fill="url(#colorReviews)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                System Health
              </CardTitle>
              <CardDescription>
                Real-time status of critical infra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              {[
                {
                  label: "Database",
                  status: "Operational",
                  color: "bg-green-500",
                },
                { label: "AI Engine", status: "Scaling", color: "bg-blue-500" },
                {
                  label: "Webhooks",
                  status: "Connected",
                  color: "bg-green-500",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {s.status}
                    </span>
                    <div
                      className={`h-2 w-2 rounded-full ${s.color} animate-pulse`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/admin/security">
              <Card className="group cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-bold">Security</CardTitle>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/analytics">
              <Card className="group cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-bold">Analytics</CardTitle>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </div>

      {/* Review status breakdown */}
      {stats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Completed",
              count: stats.reviewsByStatus.COMPLETED,
              icon: CheckCircle2,
              color: "text-green-500",
              bg: "bg-green-500/10",
            },
            {
              label: "Pending",
              count: stats.reviewsByStatus.PENDING,
              icon: Clock,
              color: "text-yellow-500",
              bg: "bg-yellow-500/10",
            },
            {
              label: "Processing",
              count: stats.reviewsByStatus.PROCESSING,
              icon: TrendingUp,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Failed",
              count: stats.reviewsByStatus.FAILED,
              icon: AlertCircle,
              color: "text-red-500",
              bg: "bg-red-500/10",
            },
          ].map(({ label, count, icon: Icon, color, bg }) => (
            <Card key={label} className="border-none shadow-none bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {label}
                </CardTitle>
                <div className={`p-2 rounded-full ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-3xl font-black">{count}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
