"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  AlertTriangle,
  Info,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Fades } from "@/components/animate-ui/primitives/effects/fade";

import { RiskScoreCard } from "./components/risk-score-card";
import {
  SeverityStatCard,
  SeverityDistributionBar,
} from "./components/severity-cards";
import {
  AISummaryCard,
  QualityMetricsCard,
} from "./components/quality-metrics-card";
import { CommentCard, FileGroup } from "./components/comment-card";
import { CommentsToolbar } from "./components/comments-toolbar";
import {
  PendingCard,
  ProcessingCard,
  FailedCard,
  NoIssuesCard,
} from "./components/status-cards";
import { FeedbackWidget } from "./components/feedback-widget";
import type {
  ReviewResultProps,
  ReviewComment,
  QualityMetrics,
  SortKey,
  SortDir,
  ViewMode,
} from "./components/types";
import { SEVERITY_ORDER } from "./components/types";

export function ReviewResult({
  review,
  onRetry,
  isRetrying,
}: ReviewResultProps) {
  const [activeSeverities, setActiveSeverities] = useState<Set<string>>(
    new Set(),
  );
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null);
  const [expandKey, setExpandKey] = useState(0);

  const [resolvedKeys, setResolvedKeys] = useState<Set<string>>(
    () => new Set(review.resolvedComments ?? []),
  );

  const resolvedCommentsStr = JSON.stringify(review.resolvedComments ?? []);
  const [prevResolvedStr, setPrevResolvedStr] = useState(resolvedCommentsStr);

  if (resolvedCommentsStr !== prevResolvedStr) {
    setPrevResolvedStr(resolvedCommentsStr);
    setResolvedKeys(new Set(JSON.parse(resolvedCommentsStr) as string[]));
  }
  const [showResolved, setShowResolved] = useState(true);
  const toggleResolvedMutation =
    trpc.review.toggleResolvedComment.useMutation();

  if (review.status === "PENDING") {
    return <PendingCard />;
  }

  if (review.status === "PROCESSING") {
    return <ProcessingCard />;
  }

  if (review.status === "FAILED") {
    return (
      <FailedCard
        error={review.error}
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    );
  }

  const comments = Array.isArray(review.comments)
    ? (review.comments as ReviewComment[])
    : [];

  const qualityMetrics =
    review.qualityMetrics &&
    typeof review.qualityMetrics === "object" &&
    !Array.isArray(review.qualityMetrics) &&
    "complexity" in (review.qualityMetrics as Record<string, unknown>)
      ? (review.qualityMetrics as QualityMetrics)
      : null;

  const avgConfidence =
    comments.length > 0
      ? Math.round(
          comments.reduce((sum, c) => sum + (c.confidence ?? 75), 0) /
            comments.length,
        )
      : null;

  const severityCounts = {
    critical: comments.filter((c) => c.severity === "critical").length,
    high: comments.filter((c) => c.severity === "high").length,
    medium: comments.filter((c) => c.severity === "medium").length,
    low: comments.filter((c) => c.severity === "low").length,
    info: comments.filter((c) => c.severity === "info").length,
  };

  const totalIssues = comments.filter((c) => c.severity !== "info").length;

  const allCategories = Array.from(
    new Set(comments.map((c) => c.category).filter(Boolean) as string[]),
  );

  const toggleSeverity = (sev: string) => {
    setActiveSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveSeverities(new Set());
    setActiveCategories(new Set());
    setSearchQuery("");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleExpandAll = () => {
    setAllExpanded((prev) => prev !== true);
    setExpandKey((k) => k + 1);
  };

  const getCommentKey = (c: ReviewComment) =>
    `${c.file}:${c.line}:${c.severity}:${c.category ?? ""}`;

  const toggleResolved = (key: string) => {
    const nextResolved = !resolvedKeys.has(key);
    // Optimistic update
    setResolvedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    // Persist to DB, rollback on error
    toggleResolvedMutation.mutate(
      { reviewId: review.id, commentKey: key, resolved: nextResolved },
      {
        onError: () => {
          setResolvedKeys((prev) => {
            const next = new Set(prev);
            if (nextResolved) next.delete(key);
            else next.add(key);
            return next;
          });
        },
      },
    );
  };

  const filteredComments = comments.filter((c) => {
    if (activeSeverities.size > 0 && !activeSeverities.has(c.severity))
      return false;
    if (
      activeCategories.size > 0 &&
      (!c.category || !activeCategories.has(c.category))
    )
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.message.toLowerCase().includes(q) ||
        c.file.toLowerCase().includes(q) ||
        (c.suggestion?.toLowerCase().includes(q) ?? false) ||
        (c.category?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const sortedComments = [...filteredComments].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "severity":
        cmp =
          (SEVERITY_ORDER[a.severity] ?? 99) -
          (SEVERITY_ORDER[b.severity] ?? 99);
        break;
      case "file":
        cmp = a.file.localeCompare(b.file);
        break;
      case "line":
        cmp = a.line - b.line;
        break;
      case "category":
        cmp = (a.category ?? "").localeCompare(b.category ?? "");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const groupedByFile = sortedComments.reduce(
    (acc, comment) => {
      const key = comment.file;
      if (!acc[key]) acc[key] = [];
      acc[key].push(comment);
      return acc;
    },
    {} as Record<string, ReviewComment[]>,
  );

  // If hiding resolved, remove them from the visible list
  const visibleComments = showResolved
    ? sortedComments
    : sortedComments.filter((c) => !resolvedKeys.has(getCommentKey(c)));

  const hasActiveFilters =
    activeSeverities.size > 0 ||
    activeCategories.size > 0 ||
    searchQuery !== "";

  const exportMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# Code Review Report`);
    lines.push("");
    lines.push(`- **Risk Score:** ${review.riskScore ?? "N/A"} / 100`);
    lines.push(`- **Total Issues:** ${totalIssues}`);
    lines.push(`- **Date:** ${new Date(review.createdAt).toLocaleString()}`);
    lines.push("");
    if (review.summary) {
      lines.push(`## AI Summary`);
      lines.push("");
      lines.push(review.summary);
      lines.push("");
    }
    lines.push(`## Severity Breakdown`);
    lines.push("");
    lines.push(`| Severity | Count |`);
    lines.push(`| -------- | ----- |`);
    lines.push(`| Critical | ${severityCounts.critical} |`);
    lines.push(`| High     | ${severityCounts.high} |`);
    lines.push(`| Medium   | ${severityCounts.medium} |`);
    lines.push(`| Low      | ${severityCounts.low} |`);
    lines.push("");
    if (qualityMetrics) {
      lines.push(`## Quality Metrics`);
      lines.push("");
      lines.push(`| Metric          | Score |`);
      lines.push(`| --------------- | ----- |`);
      lines.push(`| Complexity      | ${qualityMetrics.complexity}/100 |`);
      lines.push(`| Maintainability | ${qualityMetrics.maintainability}/100 |`);
      lines.push(`| Readability     | ${qualityMetrics.readability}/100 |`);
      lines.push(`| Testability     | ${qualityMetrics.testability}/100 |`);
      lines.push("");
      if (avgConfidence !== null) {
        lines.push(`**Average AI Confidence:** ${avgConfidence}%`);
        lines.push("");
      }
    }
    if (comments.length > 0) {
      lines.push(`## Issues`);
      lines.push("");
      comments.forEach((c, i) => {
        lines.push(
          `### ${i + 1}. [${c.severity.toUpperCase()}] ${c.file}:${c.line}`,
        );
        lines.push("");
        if (c.category) lines.push(`**Category:** ${c.category}`);
        if (c.confidence !== undefined)
          lines.push(`**Confidence:** ${c.confidence}%`);
        lines.push("");
        lines.push(c.message);
        if (c.suggestion) {
          lines.push("");
          lines.push(`> **Suggestion:** ${c.suggestion}`);
        }
        lines.push("");
        lines.push("---");
        lines.push("");
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `review-${review.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <Fades holdDelay={80}>
        <div>
          <RiskScoreCard
            score={review.riskScore ?? 0}
            totalIssues={totalIssues}
            createdAt={review.createdAt}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <SeverityStatCard
            label="Critical"
            count={severityCounts.critical}
            icon={XCircle}
            color="red"
            active={activeSeverities.has("critical")}
            onClick={() => toggleSeverity("critical")}
          />
          <SeverityStatCard
            label="High"
            count={severityCounts.high}
            icon={AlertTriangle}
            color="orange"
            active={activeSeverities.has("high")}
            onClick={() => toggleSeverity("high")}
          />
          <SeverityStatCard
            label="Medium"
            count={severityCounts.medium}
            icon={Info}
            color="amber"
            active={activeSeverities.has("medium")}
            onClick={() => toggleSeverity("medium")}
          />
          <SeverityStatCard
            label="Low"
            count={severityCounts.low}
            icon={TrendingUp}
            color="slate"
            active={activeSeverities.has("low")}
            onClick={() => toggleSeverity("low")}
          />
          <SeverityStatCard
            label="Info"
            count={severityCounts.info}
            icon={Info}
            color="sky"
            active={activeSeverities.has("info")}
            onClick={() => toggleSeverity("info")}
          />
        </div>

        <div>
          <SeverityDistributionBar
            counts={severityCounts}
            total={totalIssues}
          />
        </div>

        {qualityMetrics && (
          <div>
            <QualityMetricsCard
              metrics={qualityMetrics}
              avgConfidence={avgConfidence}
            />
          </div>
        )}

        {review.summary && (
          <div>
            <AISummaryCard summary={review.summary} />
          </div>
        )}

        {comments.length > 0 ? (
          <div className="space-y-3">
            <CommentsToolbar
              totalComments={totalIssues}
              filteredCount={
                visibleComments.filter((c) => c.severity !== "info").length
              }
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              allCategories={allCategories}
              activeCategories={activeCategories}
              onToggleCategory={toggleCategory}
              sortKey={sortKey}
              sortDir={sortDir}
              onToggleSort={toggleSort}
              viewMode={viewMode}
              onToggleViewMode={() =>
                setViewMode((m) => (m === "list" ? "grouped" : "list"))
              }
              allExpanded={allExpanded}
              onToggleExpandAll={toggleExpandAll}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              onExport={exportMarkdown}
              resolvedCount={resolvedKeys.size}
              showResolved={showResolved}
              onToggleShowResolved={() => setShowResolved((v) => !v)}
            />
            {sortedComments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="size-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No comments match your filters
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-xs gap-1.5"
                    onClick={clearFilters}
                  >
                    <X className="size-3" />
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === "list" ? (
              <div className="space-y-2.5">
                {visibleComments.map((comment, index) => (
                  <CommentCard
                    key={`${comment.file}:${comment.line}:${index}`}
                    comment={comment}
                    index={index}
                    forceExpanded={allExpanded}
                    expandKey={expandKey}
                    resolved={resolvedKeys.has(getCommentKey(comment))}
                    onToggleResolved={() =>
                      toggleResolved(getCommentKey(comment))
                    }
                    reviewId={review.id}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedByFile).map(([file, fileComments]) => (
                  <FileGroup
                    key={file}
                    file={file}
                    comments={fileComments}
                    allExpanded={allExpanded}
                    expandKey={expandKey}
                    resolvedKeys={resolvedKeys}
                    onToggleResolved={toggleResolved}
                    reviewId={review.id}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          review.status === "COMPLETED" && (
            <div>
              <NoIssuesCard />
            </div>
          )
        )}

        {review.status === "COMPLETED" && (
          <div>
            <FeedbackWidget reviewId={review.id} />
          </div>
        )}
      </Fades>
    </div>
  );
}
