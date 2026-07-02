import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GitPullRequest,
  GitMerge,
  XCircle,
  ExternalLink,
  GitBranch,
  FileText,
  Sparkles,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CircleDot,
  Bug,
  Shield,
  Zap,
  BookMarked,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export interface PullRequestCardData {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  htmlUrl: string;
  author: { login: string; avatarUrl: string };
  headRef: string;
  baseRef: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  mergedAt: string | null;
  review: {
    status: string;
    summary?: string | null;
    riskScore?: number | null;
    severityCounts?: { critical: number; high: number; medium: number; low: number };
    categories?: string[];
    createdAt: Date;
  } | null;
}

function getRiskConfig(score: number) {
  if (score < 25) return { label: "Low", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: ShieldCheck };
  if (score < 50) return { label: "Med", color: "text-amber-500", bg: "bg-amber-500/10", icon: CircleDot };
  if (score < 75) return { label: "High", color: "text-orange-500", bg: "bg-orange-500/10", icon: ShieldAlert };
  return { label: "Crit", color: "text-red-500", bg: "bg-red-500/10", icon: ShieldX };
}

function getCategoryConfig(cat: string) {
  switch (cat) {
    case "bug": return { icon: Bug, color: "text-red-500 bg-red-500/10" };
    case "security": return { icon: Shield, color: "text-orange-500 bg-orange-500/10" };
    case "performance": return { icon: Zap, color: "text-blue-500 bg-blue-500/10" };
    case "custom-rule": return { icon: BookMarked, color: "text-violet-500 bg-violet-500/10" };
    default: return { icon: AlertTriangle, color: "text-muted-foreground bg-muted" };
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: typeof Clock; label: string; cls: string; spin?: boolean }> = {
    COMPLETED: { icon: CheckCircle, label: "Reviewed", cls: "bg-emerald-500/10 text-emerald-500" },
    PROCESSING: { icon: Loader2, label: "Analyzing", cls: "bg-blue-500/10 text-blue-500", spin: true },
    PENDING: { icon: Clock, label: "Queued", cls: "bg-amber-500/10 text-amber-500" },
    FAILED: { icon: XCircle, label: "Failed", cls: "bg-red-500/10 text-red-500" },
  };
  const cfg = map[status] ?? map.PENDING!;
  const Icon = cfg.icon;
  return (
    <Badge variant="secondary" className={cn("text-xs gap-1", cfg.cls)}>
      <Icon className={cn("size-3", cfg.spin && "animate-spin")} />{cfg.label}
    </Badge>
  );
}

export function PullRequestCard({ pr, repositoryId }: { pr: PullRequestCardData; repositoryId: string }) {
  const [expanded, setExpanded] = useState(false);
  const isMerged = pr.state === "closed" && pr.mergedAt !== null;
  const reviewed = pr.review?.status === "COMPLETED";
  const riskCfg = reviewed && pr.review?.riskScore != null ? getRiskConfig(pr.review.riskScore) : null;
  const sev = pr.review?.severityCounts;
  const categories = pr.review?.categories ?? [];
  const totalChurn = pr.additions + pr.deletions;
  const addPct = totalChurn > 0 ? Math.round((pr.additions / totalChurn) * 100) : 50;

  const timeAgo = useMemo(() => {
    const diffMs = Date.now() - new Date(pr.createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return formatDate(pr.createdAt);
  }, [pr.createdAt]);

  const StateIcon = isMerged ? GitMerge : pr.state === "closed" ? XCircle : GitPullRequest;
  const stateColor = isMerged ? "text-purple-500" : pr.state === "closed" ? "text-red-500" : "text-emerald-500";

  return (
    <div className="rounded-md border border-border p-4 transition-colors hover:border-primary/30">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <StateIcon className={cn("size-4 mt-0.5 shrink-0", stateColor)} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/repo/${repositoryId}/pr/${pr.number}`} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1">
                {pr.title}
              </Link>
              <span className="font-mono text-xs text-muted-foreground">#{pr.number}</span>
              {pr.draft && <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500">Draft</Badge>}
            </div>
            {/* Meta */}
            <div className="flex items-center gap-2.5 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Avatar className="size-4">
                  <AvatarImage src={pr.author.avatarUrl} alt={pr.author.login} />
                  <AvatarFallback className="text-xs">{pr.author.login[0]}</AvatarFallback>
                </Avatar>
                {pr.author.login}
              </span>
              <span>{timeAgo}</span>
              <span className="font-mono text-xs hidden sm:flex items-center gap-1">
                <GitBranch className="size-3" />{pr.baseRef} ← {pr.headRef}
              </span>
            </div>
          </div>
        </div>

        {/* Right: risk or status */}
        <div className="shrink-0 flex items-center gap-2">
          {riskCfg && pr.review?.riskScore != null && (
            <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md", riskCfg.bg, riskCfg.color)}>
              <riskCfg.icon className="size-3" />{riskCfg.label} {pr.review.riskScore}
            </span>
          )}
          {pr.review && !reviewed && <StatusBadge status={pr.review.status} />}
        </div>
      </div>

      {/* Summary (inline, no nested card) */}
      {reviewed && pr.review?.summary && (
        <div className="mt-2 ml-6">
          <p className={cn("text-xs text-muted-foreground leading-relaxed", !expanded && "line-clamp-2")}>{pr.review.summary}</p>
          {pr.review.summary.length > 140 && (
            <button onClick={() => setExpanded((v) => !v)} className="text-xs text-primary/60 hover:text-primary mt-0.5 flex items-center gap-0.5">
              {expanded ? <><ChevronDown className="size-3" />Less</> : <><ChevronRight className="size-3" />More</>}
            </button>
          )}
        </div>
      )}

      {/* Severity + categories */}
      {reviewed && sev && (sev.critical + sev.high + sev.medium + sev.low > 0) && (
        <div className="mt-2 ml-6 flex items-center gap-1.5 flex-wrap">
          {sev.critical > 0 && <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">{sev.critical} crit</span>}
          {sev.high > 0 && <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500">{sev.high} high</span>}
          {sev.medium > 0 && <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">{sev.medium} med</span>}
          {sev.low > 0 && <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{sev.low} low</span>}
          {categories.slice(0, 3).map((cat) => {
            const cfg = getCategoryConfig(cat);
            const CatIcon = cfg.icon;
            return <span key={cat} className={cn("text-xs px-1.5 py-0.5 rounded flex items-center gap-1 capitalize", cfg.color)}><CatIcon className="size-3" />{cat}</span>;
          })}
        </div>
      )}

      {/* Bottom: churn + actions */}
      <div className="mt-3 ml-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono"><span className="text-emerald-500">+{pr.additions}</span>/<span className="text-red-500">-{pr.deletions}</span></span>
          <div className="w-12 h-1 rounded-full overflow-hidden bg-muted flex">
            <div className="h-full bg-emerald-500" style={{ width: `${addPct}%` }} />
            <div className="h-full bg-red-500" style={{ width: `${100 - addPct}%` }} />
          </div>
          <span className="text-muted-foreground flex items-center gap-0.5"><FileText className="size-3" />{pr.changedFiles}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <a href={pr.htmlUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1"><ExternalLink className="size-3" />GitHub</Button>
          </a>
          <Link href={`/repo/${repositoryId}/pr/${pr.number}`}>
            <Button
              size="sm"
              variant={reviewed || pr.review?.status === "PENDING" || pr.review?.status === "PROCESSING" ? "outline" : "default"}
              className="h-7 px-2.5 text-xs gap-1"
            >
              {pr.review?.status === "PROCESSING" ? <><Loader2 className="size-3 animate-spin" />Analyzing</> :
               pr.review?.status === "PENDING" ? <><Clock className="size-3" />Queued</> :
               pr.review?.status === "FAILED" ? <><RefreshCw className="size-3" />Retry</> :
               reviewed ? <><Eye className="size-3" />Review</> :
               <><Sparkles className="size-3" />Review</>}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
