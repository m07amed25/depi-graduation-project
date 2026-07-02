"use client";

import { cn } from "@/lib/utils";
import {
  Star,
  GitFork,
  ExternalLink,
  CircleDot,
  Clock,
  Lock,
  Globe,
  CheckCircle2,
} from "lucide-react";

interface GitHubRepo {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  forksCount?: number;
  watchersCount?: number;
  openIssuesCount?: number;
  updatedAt: string;
}

const githubLanguageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  PowerShell: "#012456",
  Lua: "#000080",
  Perl: "#0298c3",
  R: "#198CE7",
  Julia: "#a270ba",
  Dart: "#00B4AB",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Erlang: "#B83998",
  Clojure: "#db5855",
  "F#": "#b845fc",
  OCaml: "#3be133",
  Scala: "#c22d40",
  Assembly: "#6E4C13",
  Zig: "#ec915c",
  Nim: "#ffc200",
  Crystal: "#000100",
  "Objective-C": "#438eff",
  Makefile: "#427819",
  Dockerfile: "#384d54",
  Vim: "#199f4b",
  TeX: "#3D6117",
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function RepoSelectItem({
  repo,
  selected,
  onToggle,
}: {
  repo: GitHubRepo;
  selected: boolean;
  onToggle: (githubId: number) => void;
}) {
  const langColor = repo.language
    ? githubLanguageColors[repo.language] ?? "#8b949e"
    : "#8b949e";

  const [owner, repoName] = repo.fullName.split("/");

  return (
    <div
      onClick={() => onToggle(repo.githubId)}
      className={cn(
        "group flex flex-col h-full rounded-xl border transition-all duration-200 cursor-pointer",
        selected
          ? "border-primary/50 bg-primary/[0.04] shadow-sm"
          : "border-border bg-card hover:bg-muted/20 hover:shadow-sm",
      )}
    >

      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Repo icon / avatar */}
          <div
            className={cn(
              "shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold border transition-colors duration-200",
              selected
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-muted border-border text-muted-foreground group-hover:border-border/80",
            )}
          >
            {repoName?.charAt(0).toUpperCase() ?? "R"}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium truncate">
                {owner}/
              </span>
              <span className="text-sm font-semibold text-foreground truncate leading-tight">
                {repoName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Visibility badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
              repo.private
                ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            )}
          >
            {repo.private ? (
              <Lock className="h-2.5 w-2.5" />
            ) : (
              <Globe className="h-2.5 w-2.5" />
            )}
            {repo.private ? "Private" : "Public"}
          </span>

          {/* Selected check */}
          <div
            className={cn(
              "flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-200 shrink-0",
              selected
                ? "border-primary bg-primary text-primary-foreground scale-100"
                : "border-border bg-transparent scale-90 opacity-0 group-hover:opacity-60 group-hover:scale-100",
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-3 flex-1">
        {repo.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {repo.description}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">
            No description provided
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-border/50" />

      {/* Stats footer */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
          {repo.language && (
            <div className="flex items-center gap-1.5" title={repo.language}>
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-black/5"
                style={{ backgroundColor: langColor }}
              />
              <span className="truncate max-w-20">{repo.language}</span>
            </div>
          )}

          {repo.stars > 0 && (
            <div
              className="flex items-center gap-1"
              title={`${repo.stars.toLocaleString()} stars`}
            >
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{formatNumber(repo.stars)}</span>
            </div>
          )}

          {(repo.forksCount ?? 0) > 0 && (
            <div
              className="flex items-center gap-1"
              title={`${repo.forksCount} forks`}
            >
              <GitFork className="h-3 w-3" />
              <span>{formatNumber(repo.forksCount!)}</span>
            </div>
          )}

          {(repo.openIssuesCount ?? 0) > 0 && (
            <div
              className="flex items-center gap-1"
              title={`${repo.openIssuesCount} open issues`}
            >
              <CircleDot className="h-3 w-3 text-emerald-500" />
              <span>{formatNumber(repo.openIssuesCount!)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 shrink-0">
          <div className="flex items-center gap-1" title={`Updated ${repo.updatedAt}`}>
            <Clock className="h-3 w-3" />
            <span>{formatDate(repo.updatedAt)}</span>
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-foreground hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              window.open(repo.htmlUrl, "_blank");
            }}
            title="View on GitHub"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
