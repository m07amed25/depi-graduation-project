/**
 * Admin Security Dashboard
 * Shows system-wide security statistics and issues
 */

"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Key,
  Lock,
  Shield,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function AdminSecurityDashboard() {
  const { data: dashboard, isLoading } = trpc.security.getSecurityDashboard.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No security data available.</p>
        </CardContent>
      </Card>
    );
  }

  const resolutionRate =
    dashboard.totalIssues > 0
      ? ((dashboard.resolvedIssues / dashboard.totalIssues) * 100).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalIssues}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{dashboard.unresolvedIssues} unresolved</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            {Number(resolutionRate) >= 75 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.resolvedIssues} of {dashboard.totalIssues} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.issuesBySeverity.CRITICAL || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.issuesBySeverity.HIGH || 0}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Issues by Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Critical</span>
                <Badge variant="destructive">
                  {dashboard.issuesBySeverity.CRITICAL || 0}
                </Badge>
              </div>
              <Progress
                value={Math.min(100, ((dashboard.issuesBySeverity.CRITICAL || 0) / (dashboard.unresolvedIssues || 1)) * 100)}
                className="h-2 [&>div]:bg-red-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">High</span>
                <Badge className="bg-orange-500">
                  {dashboard.issuesBySeverity.HIGH || 0}
                </Badge>
              </div>
              <Progress
                value={Math.min(100, ((dashboard.issuesBySeverity.HIGH || 0) / (dashboard.unresolvedIssues || 1)) * 100)}
                className="h-2 [&>div]:bg-orange-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medium</span>
                <Badge className="bg-yellow-500">
                  {dashboard.issuesBySeverity.MEDIUM || 0}
                </Badge>
              </div>
              <Progress
                value={Math.min(100, ((dashboard.issuesBySeverity.MEDIUM || 0) / (dashboard.unresolvedIssues || 1)) * 100)}
                className="h-2 [&>div]:bg-yellow-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Low</span>
                <Badge className="bg-blue-500">
                  {dashboard.issuesBySeverity.LOW || 0}
                </Badge>
              </div>
              <Progress
                value={Math.min(100, ((dashboard.issuesBySeverity.LOW || 0) / (dashboard.unresolvedIssues || 1)) * 100)}
                className="h-2 [&>div]:bg-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Info</span>
                <Badge variant="secondary">
                  {dashboard.issuesBySeverity.INFO || 0}
                </Badge>
              </div>
              <Progress
                value={Math.min(100, ((dashboard.issuesBySeverity.INFO || 0) / (dashboard.unresolvedIssues || 1)) * 100)}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Issues by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Vulnerabilities</p>
                  <p className="text-xs text-muted-foreground">CVEs & deps</p>
                </div>
              </div>
              <Badge variant="secondary">
                {dashboard.issuesByType.VULNERABILITY || 0}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Secret Exposure</p>
                  <p className="text-xs text-muted-foreground">API keys, tokens</p>
                </div>
              </div>
              <Badge variant="secondary">
                {dashboard.issuesByType.SECRET_EXPOSURE || 0}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">OWASP Top 10</p>
                  <p className="text-xs text-muted-foreground">Security patterns</p>
                </div>
              </div>
              <Badge variant="secondary">
                {dashboard.issuesByType.OWASP_TOP_10 || 0}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Code Quality</p>
                  <p className="text-xs text-muted-foreground">CWE & others</p>
                </div>
              </div>
              <Badge variant="secondary">
                {(dashboard.issuesByType.CODE_QUALITY || 0) +
                  (dashboard.issuesByType.CWE || 0)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.recentIssues.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                No recent security issues
              </div>
            ) : (
              dashboard.recentIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/reviews/${issue.reviewId}`}
                  className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={issue.severity === "CRITICAL" ? "destructive" : "secondary"}
                        className={
                          issue.severity === "HIGH"
                            ? "bg-orange-500"
                            : issue.severity === "MEDIUM"
                              ? "bg-yellow-500"
                              : ""
                        }
                      >
                        {issue.severity}
                      </Badge>
                      <h4 className="font-medium">{issue.title}</h4>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {issue.review.repository.fullName} • PR #{issue.review.prNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{issue.type.replace(/_/g, " ")}</Badge>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
