"use client";

import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  GitBranch,
  GitCommit,
  ChevronDown,
} from "lucide-react";
import { CommitNode, getBranchColor } from "./types";
import {
  TimelineSkeleton,
  CommitSkeleton,
} from "./components/timeline-skeleton";
import { CommitRow } from "./components/commit-row";
import { CommitDetailDialog } from "./components/commit-detail-dialog";

interface CodeTimelineProps {
  repositoryId: string;
}

export function CodeTimeline({ repositoryId }: CodeTimelineProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<CommitNode | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const branches = trpc.repository.getBranches.useQuery(
    { id: repositoryId },
    { enabled: !!repositoryId },
  );
  const commits = trpc.repository.getCommits.useQuery(
    { id: repositoryId, branch: selectedBranch || undefined, page, perPage },
    { enabled: !!repositoryId },
  );

  const processedCommits = useMemo(() => {
    if (!commits.data) return [];
    const commitMap = new Map<string, CommitNode>();
    const branchMap = new Map<string, string[]>();

    commits.data.forEach((commit) => {
      commitMap.set(commit.sha, {
        sha: commit.sha,
        message: commit.message,
        author: commit.author,
        date: commit.date,
        htmlUrl: commit.htmlUrl,
        parents: commit.parents,
        isMergeCommit: commit.parents.length > 1,
      });
    });

    commits.data.forEach((commit) => {
      branches.data?.branches.forEach((branch) => {
        if (branch.sha === commit.sha) {
          if (!branchMap.has(commit.sha)) branchMap.set(commit.sha, []);
          branchMap.get(commit.sha)?.push(branch.name);
        }
      });
    });

    const propagateBranches = (sha: string, branchNames: string[]) => {
      const commit = commitMap.get(sha);
      if (!commit) return;
      const currentBranches = branchMap.get(sha) || [];
      const newBranches = [...new Set([...currentBranches, ...branchNames])];
      if (newBranches.length > currentBranches.length) {
        branchMap.set(sha, newBranches);
        commit.parents.forEach((parentSha) =>
          propagateBranches(parentSha, branchNames),
        );
      }
    };

    branches.data?.branches.forEach((branch) =>
      propagateBranches(branch.sha, [branch.name]),
    );

    return commits.data.map((commit) => {
      const node = commitMap.get(commit.sha)!;
      const branchNames = branchMap.get(commit.sha) || [];
      return { ...node, branch: branchNames[0], branches: branchNames };
    });
  }, [commits.data, branches.data]);

  const handleLoadMore = useCallback(() => setPage((prev) => prev + 1), []);
  const handleBranchChange = useCallback((branch: string | null) => {
    setSelectedBranch(branch);
    setPage(1);
  }, []);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, commit: CommitNode) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelectedCommit(commit);
      }
    },
    [],
  );

  if (branches.isLoading) return <TimelineSkeleton />;

  if (branches.error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-12 text-center">
          <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <p className="mt-4 font-medium text-destructive">
            Failed to load branches.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {branches.error.message}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => branches.refetch()}
          >
            <RefreshCw className="size-4 mr-2" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Branch:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedBranch === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleBranchChange(null)}
            className="text-xs"
          >
            All
          </Button>
          {branches.data?.branches.slice(0, 8).map((branch) => (
            <Button
              key={branch.name}
              variant={selectedBranch === branch.name ? "default" : "outline"}
              size="sm"
              onClick={() => handleBranchChange(branch.name)}
              className="text-xs"
              style={
                selectedBranch === branch.name
                  ? { backgroundColor: getBranchColor(branch.name) }
                  : {}
              }
            >
              <GitBranch
                className="size-3 mr-1"
                style={{ color: getBranchColor(branch.name) }}
              />
              {branch.name}
            </Button>
          ))}
          {branches.data && branches.data.branches.length > 8 && (
            <Badge variant="secondary" className="text-xs">
              +{branches.data.branches.length - 8} more
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCommit className="size-4" />
            Commit History
            <Badge variant="secondary" className="ml-auto text-xs">
              {commits.data?.length || 0} commits
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {commits.isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <CommitSkeleton key={i} />
              ))}
            </div>
          ) : commits.error ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto size-8 text-destructive" />
              <p className="mt-4 font-medium text-destructive">
                Failed to load commits.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {commits.error.message}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => commits.refetch()}
              >
                <RefreshCw className="size-4 mr-2" />
                Try again
              </Button>
            </div>
          ) : processedCommits.length === 0 ? (
            <div className="py-12 text-center">
              <GitCommit className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 font-medium">No commits found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedBranch
                  ? `No commits on branch "${selectedBranch}"`
                  : "This repository has no commits yet."}
              </p>
            </div>
          ) : (
            <div
              className="divide-y divide-border/50"
              role="list"
              aria-label="Commit timeline"
            >
              {processedCommits.map((commit, index) => (
                <CommitRow
                  key={commit.sha}
                  commit={commit}
                  index={index}
                  totalCommits={processedCommits.length}
                  onSelect={setSelectedCommit}
                  onKeyDown={handleKeyDown}
                  branchColor={
                    commit.branch ? getBranchColor(commit.branch) : undefined
                  }
                />
              ))}
              {processedCommits.length >= perPage && (
                <div className="p-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={commits.isFetching}
                  >
                    {commits.isFetching ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-4 mr-2" />
                        Load more commits
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CommitDetailDialog
        commit={selectedCommit}
        open={!!selectedCommit}
        onOpenChange={(open) => !open && setSelectedCommit(null)}
      />
    </div>
  );
}

export default CodeTimeline;
