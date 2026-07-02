"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderGit2, Unlink } from "lucide-react";

export interface TeamRepository {
  id: string;
  fullName: string;
  private: boolean;
}

export interface TeamRepoListProps {
  repositories: TeamRepository[];
  isOwnerOrAdmin: boolean;
  onUnshare?: (repositoryId: string) => void;
  isUnsharing?: boolean;
}

export function TeamRepoList({
  repositories,
  isOwnerOrAdmin,
  onUnshare,
  isUnsharing = false,
}: TeamRepoListProps) {
  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
        <div>
          <CardTitle className="text-lg flex items-center gap-2 font-semibold">
            <div className="p-1.5 rounded-md bg-emerald-500/10">
              <FolderGit2 className="size-4 text-emerald-500" />
            </div>
            Shared Repositories
          </CardTitle>
          <CardDescription className="mt-1.5">
            Repositories visible to all team members
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {repositories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FolderGit2 className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No repositories yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Share a repository to collaborate on code reviews with your team.
            </p>
          </div>
        )}
        <div className="space-y-1">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors group/repo"
            >
              <Link
                href={`/repo/${repo.id}`}
                className="flex items-center gap-4 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <div className="p-2 rounded-md bg-background shadow-sm border border-border/50 group-hover/repo:border-emerald-500/30 transition-colors">
                  <FolderGit2 className="size-4 text-emerald-500/70 group-hover/repo:text-emerald-500 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover/repo:text-primary transition-colors">
                    {repo.fullName}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1 text-[9px] px-1.5 py-0 bg-muted-foreground/10 text-muted-foreground font-medium rounded-sm"
                  >
                    {repo.private ? "Private" : "Public"}
                  </Badge>
                </div>
              </Link>
              {isOwnerOrAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/repo:opacity-100 transition-all focus:opacity-100"
                  onClick={() => onUnshare?.(repo.id)}
                  disabled={isUnsharing}
                  title="Unshare repository"
                >
                  <Unlink className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
export function TeamRepoListSkeleton() {
  return (
    <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted animate-pulse">
            <FolderGit2 className="size-4 text-emerald-500" />
          </div>
          <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-lg bg-muted/20"
          >
            <div className="p-2 rounded-md bg-muted animate-pulse">
              <FolderGit2 className="size-4" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
