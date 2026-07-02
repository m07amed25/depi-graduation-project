import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  GitBranch,
  GitCommit,
  User,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CommitNode, getBranchColor } from "../types";

interface CommitDetailDialogProps {
  commit: CommitNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommitDetailDialog({
  commit,
  open,
  onOpenChange,
}: CommitDetailDialogProps) {
  if (!commit) return null;
  const firstLine = commit.message.split("\n")[0];
  const bodyLines = commit.message.split("\n").slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommit className="size-5" />
            Commit Details
          </DialogTitle>
          <DialogDescription className="sr-only">
            Details for commit {commit.sha}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">SHA:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
              {commit.sha}
            </code>
            <a
              href={commit.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>

          {commit.branches && commit.branches.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Branches:</span>
              {commit.branches.map((branch) => (
                <Badge
                  key={branch}
                  variant="outline"
                  style={{
                    borderColor: getBranchColor(branch),
                    color: getBranchColor(branch),
                  }}
                >
                  <GitBranch className="size-3 mr-1" />
                  {branch}
                </Badge>
              ))}
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-1">Message</h4>
            <div className="bg-muted rounded-lg p-4">
              <p className="font-medium">{firstLine}</p>
              {bodyLines.length > 0 && bodyLines.some((l) => l.trim()) && (
                <pre className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                  {bodyLines.filter((l) => l.trim()).join("\n")}
                </pre>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Author:</span>
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={commit.author.avatarUrl || undefined} />
                <AvatarFallback>
                  <User className="size-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{commit.author.login}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Date:</span>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="size-4" />
              {formatDate(commit.date)}
            </div>
          </div>

          {commit.parents.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Parent Commits</h4>
              <div className="space-y-1">
                {commit.parents.map((parentSha, i) => (
                  <div
                    key={parentSha}
                    className="flex items-center gap-2 text-sm"
                  >
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <code className="text-muted-foreground font-mono">
                      {parentSha.slice(0, 7)}
                    </code>
                    {i === 0 && commit.isMergeCommit && (
                      <Badge variant="secondary" className="text-xs">
                        merge
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
