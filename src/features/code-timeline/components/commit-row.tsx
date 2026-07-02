import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, GitBranch, GitMerge, User } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { CommitNode, getBranchColor } from "../types";

interface CommitRowProps {
  commit: CommitNode;
  index: number;
  totalCommits: number;
  onSelect: (commit: CommitNode) => void;
  onKeyDown: (e: React.KeyboardEvent, commit: CommitNode) => void;
  branchColor?: string;
}

export function CommitRow({
  commit,
  index,
  totalCommits,
  onSelect,
  onKeyDown,
  branchColor,
}: CommitRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const firstLine = commit.message.split("\n")[0];
  const hasMoreLines = commit.message.split("\n").length > 1;

  const timeAgo = useMemo(() => {
    const now = new Date();
    const date = new Date(commit.date);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(commit.date);
  }, [commit.date]);

  const isFirst = index === 0;
  const isLast = index === totalCommits - 1;

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
        isHovered && "bg-muted/50",
      )}
      onClick={() => onSelect(commit)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => onKeyDown(e, commit)}
      tabIndex={0}
      role="listitem"
      aria-label={`Commit by ${commit.author.login}: ${firstLine}`}
    >
      <div className="flex flex-col items-center">
        {!isFirst && (
          <div
            className="w-0.5 h-4"
            style={{ backgroundColor: branchColor || "#6b7280" }}
          />
        )}
        <div
          className={cn(
            "relative z-10 w-3 h-3 rounded-full border-2 border-background",
            commit.isMergeCommit ? "ring-2 ring-offset-2" : "",
          )}
          style={{
            backgroundColor: commit.isMergeCommit
              ? "#8b5cf6"
              : branchColor || "#6b7280",
          }}
          aria-hidden="true"
        />
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-[40px]"
            style={{ backgroundColor: branchColor || "#6b7280" }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {commit.branches?.map((branch) => (
                <Badge
                  key={branch}
                  variant="outline"
                  className="text-xs font-normal"
                  style={{
                    borderColor: getBranchColor(branch),
                    color: getBranchColor(branch),
                  }}
                >
                  <GitBranch className="size-3 mr-1" />
                  {branch}
                </Badge>
              ))}
              {commit.isMergeCommit && (
                <Badge
                  variant="secondary"
                  className="text-xs font-normal text-violet-600"
                >
                  <GitMerge className="size-3 mr-1" />
                  Merge
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-sm font-medium line-clamp-2">
              {firstLine}
            </p>
            {hasMoreLines && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {commit.message.split("\n").slice(1).join(" ").trim()}
              </p>
            )}
          </div>
          <a
            href={commit.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="View commit on GitHub"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarImage src={commit.author.avatarUrl || undefined} />
              <AvatarFallback className="text-[10px]">
                <User className="size-3" />
              </AvatarFallback>
            </Avatar>
            <span>{commit.author.login}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{timeAgo}</span>
          </div>
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
            {commit.sha.slice(0, 7)}
          </code>
        </div>
      </div>
    </div>
  );
}
