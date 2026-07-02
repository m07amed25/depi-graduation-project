/**
 * Security Dashboard Component
 * Shows security scan results and statistics
 */

"use client";

import { trpc } from "@/lib/trpc/client";
import { SecurityIssueCard } from "./security-issue-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Key,
  Lock,
  Shield,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface SecurityDashboardProps {
  reviewId: string;
}

export function SecurityDashboard({ reviewId }: SecurityDashboardProps) {
  const { data: securityIssues, isLoading, refetch } = trpc.security.getReviewSecurityIssues.useQuery({
    reviewId,
  });

  const markFalsePositive = trpc.security.markFalsePositive.useMutation({
    onSuccess: () => {
      toast.success("Marked as False Positive", {
        description: "This security issue has been marked as a false positive.",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });

  const resolveIssue = trpc.security.resolveIssue.useMutation({
    onSuccess: () => {
      toast.success("Issue Resolved", {
        description: "The security issue has been marked as resolved.",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });

  const reopenIssue = trpc.security.reopenIssue.useMutation({
    onSuccess: () => {
      toast.success("Issue Reopened", {
        description: "The security issue has been reopened.",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!securityIssues || securityIssues.length === 0) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          No security issues found. This PR looks secure!
        </AlertDescription>
      </Alert>
    );
  }

  const unresolvedIssues = securityIssues.filter((i) => !i.resolved);
  const resolvedIssues = securityIssues.filter((i) => i.resolved);

  const criticalCount = unresolvedIssues.filter((i) => i.severity === "CRITICAL").length;
  const highCount = unresolvedIssues.filter((i) => i.severity === "HIGH").length;
  const mediumCount = unresolvedIssues.filter((i) => i.severity === "MEDIUM").length;
  const lowCount = unresolvedIssues.filter((i) => i.severity === "LOW").length;

  const vulnerabilityCount = unresolvedIssues.filter(
    (i) => i.type === "VULNERABILITY"
  ).length;
  const secretsCount = unresolvedIssues.filter(
    (i) => i.type === "SECRET_EXPOSURE"
  ).length;
  const owaspCount = unresolvedIssues.filter((i) => i.type === "OWASP_TOP_10").length;

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
            <div className="text-2xl font-bold">{unresolvedIssues.length}</div>
            <p className="text-xs text-muted-foreground">
              {resolvedIssues.length} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical/High</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount + highCount}</div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{criticalCount} critical</span>
              <span>•</span>
              <span>{highCount} high</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium/Low</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediumCount + lowCount}</div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{mediumCount} medium</span>
              <span>•</span>
              <span>{lowCount} low</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">By Type</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center">
                  <Bug className="mr-1 h-3 w-3" />
                  Vulnerabilities
                </span>
                <Badge variant="secondary">{vulnerabilityCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center">
                  <Key className="mr-1 h-3 w-3" />
                  Secrets
                </span>
                <Badge variant="secondary">{secretsCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center">
                  <Lock className="mr-1 h-3 w-3" />
                  OWASP
                </span>
                <Badge variant="secondary">{owaspCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <Tabs defaultValue="unresolved" className="w-full">
        <TabsList>
          <TabsTrigger value="unresolved">
            Unresolved ({unresolvedIssues.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedIssues.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({securityIssues.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unresolved" className="space-y-4">
          {unresolvedIssues.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                All security issues have been resolved!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Critical Issues */}
              {criticalCount > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Critical ({criticalCount})
                  </h3>
                  <div className="space-y-3">
                    {unresolvedIssues
                      .filter((i) => i.severity === "CRITICAL")
                      .map((issue) => (
                        <SecurityIssueCard
                          key={issue.id}
                          issue={issue}
                          onMarkFalsePositive={(id) =>
                            markFalsePositive.mutate({ issueId: id })
                          }
                          onResolve={(id) => resolveIssue.mutate({ issueId: id })}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* High Issues */}
              {highCount > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    High ({highCount})
                  </h3>
                  <div className="space-y-3">
                    {unresolvedIssues
                      .filter((i) => i.severity === "HIGH")
                      .map((issue) => (
                        <SecurityIssueCard
                          key={issue.id}
                          issue={issue}
                          onMarkFalsePositive={(id) =>
                            markFalsePositive.mutate({ issueId: id })
                          }
                          onResolve={(id) => resolveIssue.mutate({ issueId: id })}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Medium Issues */}
              {mediumCount > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Medium ({mediumCount})
                  </h3>
                  <div className="space-y-3">
                    {unresolvedIssues
                      .filter((i) => i.severity === "MEDIUM")
                      .map((issue) => (
                        <SecurityIssueCard
                          key={issue.id}
                          issue={issue}
                          onMarkFalsePositive={(id) =>
                            markFalsePositive.mutate({ issueId: id })
                          }
                          onResolve={(id) => resolveIssue.mutate({ issueId: id })}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Low Issues */}
              {lowCount > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <AlertTriangle className="h-5 w-5 text-blue-500" />
                    Low ({lowCount})
                  </h3>
                  <div className="space-y-3">
                    {unresolvedIssues
                      .filter((i) => i.severity === "LOW")
                      .map((issue) => (
                        <SecurityIssueCard
                          key={issue.id}
                          issue={issue}
                          onMarkFalsePositive={(id) =>
                            markFalsePositive.mutate({ issueId: id })
                          }
                          onResolve={(id) => resolveIssue.mutate({ issueId: id })}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-3">
          {resolvedIssues.length === 0 ? (
            <Alert>
              <AlertDescription>No resolved issues yet.</AlertDescription>
            </Alert>
          ) : (
            resolvedIssues.map((issue) => (
              <SecurityIssueCard
                key={issue.id}
                issue={issue}
                onReopen={(id) => reopenIssue.mutate({ issueId: id })}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {securityIssues.map((issue) => (
            <SecurityIssueCard
              key={issue.id}
              issue={issue}
              onMarkFalsePositive={(id) =>
                markFalsePositive.mutate({ issueId: id })
              }
              onResolve={(id) => resolveIssue.mutate({ issueId: id })}
              onReopen={(id) => reopenIssue.mutate({ issueId: id })}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
