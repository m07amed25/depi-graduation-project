import { Button } from "@/components/ui/button";
import { Lock, Globe, GitPullRequest, ExternalLink, Trash2, Users, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ConnectedRepo {
  id: string;
  name: string;
  fullName?: string | null;
  private: boolean;
  htmlUrl: string;
  createdAt: Date | string;
  team?: { name: string } | null;
}

function timeAgo(dateString: string): string {
  const d = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

interface ConnectedRepoCardProps {
  repo: ConnectedRepo;
  isDeleting: boolean;
  onDelete: (repo: { id: string; name: string }) => void;
}

export function ConnectedRepoCard({ repo, isDeleting, onDelete }: ConnectedRepoCardProps) {
  return (
    <article
      className="group relative flex flex-col h-full rounded-sm border border-border bg-card p-4 hover:border-primary/20 transition-colors duration-150"
      aria-labelledby={`repo-${repo.id}`}
    >
      {/* Name + visibility */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 id={`repo-${repo.id}`} className="text-[13px] font-semibold truncate leading-tight">
            {repo.name}
          </h3>
          {repo.fullName && (
            <p className="text-[11px] text-muted-foreground/60 font-mono truncate mt-0.5">{repo.fullName}</p>
          )}
        </div>
        <span className={cn(
          "shrink-0 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm",
          repo.private ? "text-amber-500 bg-amber-500/8" : "text-emerald-500 bg-emerald-500/8"
        )}>
          {repo.private ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
          {repo.private ? "Private" : "Public"}
        </span>
      </div>

      {/* Team */}
      {repo.team && (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
          <Users className="h-3 w-3" />{repo.team.name}
        </span>
      )}

      {/* Footer */}
      <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-border/40">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 font-mono">
          <Clock className="h-3 w-3" />
          {timeAgo(repo.createdAt.toString())}
        </span>

        <div className="flex items-center gap-0.5">
          {/* Hover actions */}
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-6 w-6 flex items-center justify-center rounded-sm text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Open on GitHub"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => onDelete({ id: repo.id, name: repo.name })}
            disabled={isDeleting}
            className="h-6 w-6 flex items-center justify-center rounded-sm text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
            aria-label={`Disconnect ${repo.name}`}
          >
            <Trash2 className="h-3 w-3" />
          </button>
          {/* Always visible */}
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] gap-1 font-medium" asChild>
            <Link href={`/repo/${repo.id}`}>
              <GitPullRequest className="h-3 w-3" />
              PRs
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
