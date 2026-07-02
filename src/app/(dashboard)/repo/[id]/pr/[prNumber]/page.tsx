"use client";

import { use, useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  ExternalLink,
  Clock,
  FileText,
  XCircle,
  Loader2,
  GitBranch,
  ArrowRight,
  Wand2,
  ScanSearch,
  MessageCircle,
  Database,
  ArrowLeftRight,
  History,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiffViewer } from "@/features/diff-viewer";
import { ReviewResult } from "@/features/review";
import { SecurityDashboard } from "@/features/security/security-dashboard";
import { CollaborativeReview } from "@/features/collaborative-review";
import { DiagramPanel } from "@/features/review/components/diagram-panel";
import { ReviewDiffPanel } from "@/features/review/components/review-diff-panel";
import { useSession } from "@/lib/auth-client";
import { usePrivateChannel } from "@/lib/pusher/client";
import { TabButton } from "@/features/repo/utils/pr-helpers";
import { toast } from "sonner";

type PageProps = { params: Promise<{ id: string; prNumber: string }> };

export default function PullRequestPage({ params }: PageProps) {
  const { id, prNumber } = use(params);
  const prNum = parseInt(prNumber, 10);
  const [activeTab, setActiveTab] = useState<"review" | "files" | "discussion" | "entity" | "compare" | "security">("files");
  const [compareCurrentId, setCompareCurrentId] = useState<string | null>(null);
  const [comparePreviousId, setComparePreviousId] = useState<string | null>(null);
  const { data: session } = useSession();

  const pr = trpc.pullRequest.get.useQuery({ repositoryId: id, prNumber: prNum }, { enabled: !!id && !isNaN(prNum) });
  const files = trpc.pullRequest.files.useQuery({ repositoryId: id, prNumber: prNum }, { enabled: !!id && !isNaN(prNum) });

  const [timeAgo, setTimeAgo] = useState<string | null>(null);
  useEffect(() => {
    const date = pr.data?.createdAt ? new Date(pr.data.createdAt) : null;
    if (!date) {
      const timeoutId = setTimeout(() => {
        setTimeAgo(null);
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    const compute = () => {
      const diffMs = Date.now() - date.getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return `${Math.floor(days / 7)}w ago`;
    };

    // Update asynchronously to prevent synchronous cascading renders during commit phase
    const timeoutId = setTimeout(() => {
      setTimeAgo(compute());
    }, 0);

    // Keep it up to date every minute
    const intervalId = setInterval(() => {
      setTimeAgo(compute());
    }, 60000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [pr.data?.createdAt]);

  const MAX_POLL_MS = 5 * 60 * 1000;
  const pollStartRef = useRef<number | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  const latestReview = trpc.review.getLatestForPR.useQuery(
    { repositoryId: id, prNumber: prNum },
    {
      enabled: !!id && !isNaN(prNum),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "PROCESSING" || status === "PENDING") {
          if (pollStartRef.current === null) pollStartRef.current = Date.now();
          if (Date.now() - pollStartRef.current > MAX_POLL_MS) { pollStartRef.current = null; setPollTimedOut(true); return false; }
          return 3000;
        }
        pollStartRef.current = null; setPollTimedOut(false); return false;
      },
    },
  );

  const reviewHistory = trpc.review.listHistoryForPR.useQuery({ repositoryId: id, prNumber: prNum }, { enabled: !!id && !isNaN(prNum) });
  const completedReviews = (reviewHistory.data ?? []).filter((r) => r.status === "COMPLETED");
  const utils = trpc.useUtils();
  const triggerReview = trpc.review.trigger.useMutation();

  const triggerReReview = () => {
    triggerReview.mutate(
      { repositoryId: id, prNumber: prNum, parentReviewId: latestReview.data?.id ?? undefined },
      {
        onSuccess: () => { pollStartRef.current = Date.now(); setPollTimedOut(false); latestReview.refetch(); reviewHistory.refetch(); pr.refetch(); utils.pullRequest.list.invalidate(); utils.review.list.invalidate(); toast.success("Review triggered"); },
        onError: (err) => toast.error(err.message || "Failed to trigger review"),
      },
    );
  };

  const isReviewing = !pollTimedOut && (latestReview.data?.status === "PROCESSING" || latestReview.data?.status === "PENDING");
  const reviewId = latestReview.data?.id;

  const hasEntityFiles = trpc.diagram.hasEntityFiles.useQuery(
    { repositoryId: id },
    { enabled: !!id, staleTime: 5 * 60 * 1000 },
  );

  const diagrams = trpc.diagram.listForRepository.useQuery({ repositoryId: id }, {
    enabled: !!id && hasEntityFiles.data !== false,
    refetchInterval: (query) => { if (query.state.data?.some((d) => d.status === "PENDING")) return 3000; return false; },
  });
  const requestDiagram = trpc.diagram.requestDiagram.useMutation({ onSuccess: () => void diagrams.refetch() });

  usePrivateChannel<{ diagramId: string; status: string }>(
    id ? `private-repository-${id}` : null, "diagram.updated",
    () => { void utils.diagram.listForRepository.invalidate({ repositoryId: id }); },
  );

  const reviewStatus = latestReview.data?.status;
  useEffect(() => {
    if (reviewStatus === "COMPLETED" || reviewStatus === "FAILED") { void utils.pullRequest.list.invalidate(); void utils.review.list.invalidate(); }
  }, [reviewStatus, utils]);

  // Loading
  if (pr.isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  // Error
  if (pr.isError || !pr.data) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto size-10 rounded-md bg-destructive/10 flex items-center justify-center mb-3">
          <XCircle className="size-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-destructive">{pr.error?.message || "Failed to load pull request."}</p>
        <Link href={`/repo/${id}`} className="mt-4 inline-block">
          <Button variant="outline" size="sm"><ArrowLeft className="size-3.5 mr-1.5" />Back</Button>
        </Link>
      </div>
    );
  }

  const isMerged = pr.data.state === "closed" && pr.data.mergedAt;
  const StateIcon = isMerged ? GitMerge : pr.data.state === "closed" ? XCircle : GitPullRequest;
  const stateColor = isMerged ? "text-purple-500" : pr.data.state === "closed" ? "text-red-500" : "text-emerald-500";
  const stateLabel = isMerged ? "Merged" : pr.data.state === "closed" ? "Closed" : pr.data.draft ? "Draft" : "Open";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/repo/${id}`}>
          <Button variant="outline" size="icon" className="size-8 shrink-0 mt-0.5"><ArrowLeft className="size-3.5" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StateIcon className={cn("size-4 shrink-0", stateColor)} />
                <h1 className="text-lg font-semibold tracking-tight line-clamp-2">{pr.data.title}</h1>
                <span className="font-mono text-xs text-muted-foreground">#{pr.data.number}</span>
                <Badge variant="secondary" className={cn("text-xs", isMerged ? "bg-purple-500/10 text-purple-500" : pr.data.state === "closed" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>{stateLabel}</Badge>
              </div>
              <div className="flex items-center gap-2.5 mt-1.5 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Avatar className="size-4"><AvatarImage src={pr.data.author.avatarUrl} /><AvatarFallback className="text-xs">{pr.data.author.login[0]}</AvatarFallback></Avatar>
                  {pr.data.author.login}
                </span>
                {timeAgo && <span>{timeAgo}</span>}
              </div>
            </div>
            <a href={pr.data.htmlUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs"><ExternalLink className="size-3.5" />GitHub</Button>
            </a>
          </div>
        </div>
      </div>

      {/* Stats + branch + review status (inline, no Card) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border border-border">
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <span className="flex items-center gap-1.5 font-mono">
            <GitBranch className="size-3.5 text-muted-foreground" />
            <code className="text-foreground/70">{pr.data.headRef}</code>
            <ArrowRight className="size-3 text-muted-foreground" />
            <code className="text-foreground/70">{pr.data.baseRef}</code>
          </span>
          <span className="font-mono"><span className="text-emerald-500">+{pr.data.additions}</span> <span className="text-red-500">-{pr.data.deletions}</span></span>
          <span className="text-muted-foreground">{pr.data.changedFiles} files</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ReviewBadge status={pollTimedOut ? "TIMED_OUT" : (latestReview.data?.status ?? null)} />
          {isReviewing ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />Working</span>
          ) : (
            <Button variant="outline" size="sm" onClick={triggerReReview} disabled={triggerReview.isPending} className="h-7 text-xs gap-1.5">
              {triggerReview.isPending ? <Loader2 className="size-3 animate-spin" /> : latestReview.data ? <RefreshCw className="size-3" /> : <Wand2 className="size-3" />}
              {pollTimedOut ? "Retry" : latestReview.data ? "Re-review" : "Review"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-0.5 overflow-x-auto">
          <TabButton active={activeTab === "review"} onClick={() => setActiveTab("review")} icon={ScanSearch} label="Review" count={latestReview.data?.status === "COMPLETED" && Array.isArray(latestReview.data.comments) ? latestReview.data.comments.length : 0} />
          <TabButton active={activeTab === "files"} onClick={() => setActiveTab("files")} icon={FileText} label="Files" count={files.data?.length ?? 0} />
          <TabButton active={activeTab === "discussion"} onClick={() => setActiveTab("discussion")} icon={MessageCircle} label="Discussion" />
          {completedReviews.length >= 2 && (
            <TabButton active={activeTab === "compare"} onClick={() => { setActiveTab("compare"); if (!compareCurrentId && completedReviews.length >= 2) { setCompareCurrentId(completedReviews[0].id); setComparePreviousId(completedReviews[1].id); } }} icon={ArrowLeftRight} label="Compare" />
          )}
          <TabButton active={activeTab === "security"} onClick={() => setActiveTab("security")} icon={ScanSearch} label="Security" />
          {hasEntityFiles.data !== false && (
            <TabButton active={activeTab === "entity"} onClick={() => setActiveTab("entity")} icon={Database} label="Entity" count={diagrams.data?.length ?? 0} />
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "files" && (
        files.isLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}</div> :
        files.error ? <EmptyState icon={XCircle} text={files.error?.message || "Failed to load files."} destructive /> :
        files.data && files.data.length > 0 ? <DiffViewer files={files.data} /> : null
      )}

      {activeTab === "review" && (
        latestReview.data ? <ReviewResult review={latestReview.data} onRetry={triggerReReview} isRetrying={triggerReview.isPending} /> : (
          <EmptyState icon={ScanSearch} text="No reviews yet. Run an AI review to get feedback on code quality and potential bugs.">
            <Button className="mt-4 gap-1.5" onClick={triggerReReview} disabled={triggerReview.isPending || isReviewing} size="sm">
              {triggerReview.isPending || isReviewing ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
              {triggerReview.isPending || isReviewing ? "Starting..." : "Run AI Review"}
            </Button>
          </EmptyState>
        )
      )}

      {activeTab === "compare" && (
        <div className="space-y-4">
          <div className="rounded-md border border-border p-4">
            <h3 className="text-[0.9375rem] font-semibold mb-3 flex items-center gap-2"><History className="size-4 text-primary" />Compare Reviews</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Current (newer)</label>
                <select aria-label="Current review" value={compareCurrentId ?? ""} onChange={(e) => setCompareCurrentId(e.target.value || null)} className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select...</option>
                  {completedReviews.map((r) => <option key={r.id} value={r.id}>{new Date(r.createdAt).toLocaleString()} — Risk: {r.riskScore ?? "N/A"}{r.parentReviewId ? " (re-review)" : ""}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Previous (older)</label>
                <select aria-label="Previous review" value={comparePreviousId ?? ""} onChange={(e) => setComparePreviousId(e.target.value || null)} className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select...</option>
                  {completedReviews.filter((r) => r.id !== compareCurrentId).map((r) => <option key={r.id} value={r.id}>{new Date(r.createdAt).toLocaleString()} — Risk: {r.riskScore ?? "N/A"}{r.parentReviewId ? " (re-review)" : ""}</option>)}
                </select>
              </div>
            </div>
          </div>
          {compareCurrentId && comparePreviousId ? (
            <ReviewDiffPanel reviewId={compareCurrentId} compareReviewId={comparePreviousId} />
          ) : (
            <EmptyState icon={ArrowLeftRight} text="Select two reviews above to see what changed." />
          )}
        </div>
      )}

      {activeTab === "security" && (
        reviewId ? <SecurityDashboard reviewId={reviewId} /> : <EmptyState icon={ScanSearch} text="Run an AI review first to see security results." />
      )}

      {activeTab === "entity" && (
        <DiagramPanel diagrams={diagrams.data ?? []} repositoryId={id} onRequestDiagram={(type) => requestDiagram.mutate({ repositoryId: id, prNumber: prNum, type })} />
      )}

      {activeTab === "discussion" && latestReview.data && session?.user ? (
        <CollaborativeReview reviewId={latestReview.data.id} currentUserId={session.user.id} currentUserName={session.user.name} isAdmin={Boolean(pr.data?.isAdmin)} prFiles={files.data?.map((f) => f.filename) || []} />
      ) : activeTab === "discussion" && (
        <EmptyState icon={MessageCircle} text={!latestReview.data ? "Run an AI review first to start a discussion." : "Sign in to participate."} />
      )}
    </div>
  );
}

// Helpers (local to this file)

function ReviewBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline" className="text-xs gap-1 text-muted-foreground"><Clock className="size-3" />Not reviewed</Badge>;
  const map: Record<string, { icon: typeof Clock; label: string; cls: string; spin?: boolean }> = {
    COMPLETED: { icon: ScanSearch, label: "Reviewed", cls: "bg-emerald-500/10 text-emerald-500" },
    PROCESSING: { icon: Loader2, label: "Analyzing", cls: "bg-blue-500/10 text-blue-500", spin: true },
    PENDING: { icon: Clock, label: "Queued", cls: "bg-amber-500/10 text-amber-500" },
    FAILED: { icon: XCircle, label: "Failed", cls: "bg-red-500/10 text-red-500" },
    TIMED_OUT: { icon: Clock, label: "Timed out", cls: "bg-orange-500/10 text-orange-500" },
  };
  const cfg = map[status] ?? map.PENDING!;
  const Icon = cfg.icon;
  return <Badge variant="secondary" className={cn("text-xs gap-1", cfg.cls)}><Icon className={cn("size-3", cfg.spin && "animate-spin")} />{cfg.label}</Badge>;
}

function EmptyState({ icon: Icon, text, destructive, children }: { icon: typeof Clock; text: string; destructive?: boolean; children?: React.ReactNode }) {
  return (
    <div className="py-12 text-center">
      <Icon className={cn("size-6 mx-auto mb-2", destructive ? "text-destructive" : "text-muted-foreground/40")} />
      <p className={cn("text-sm", destructive ? "text-destructive" : "text-muted-foreground")}>{text}</p>
      {children}
    </div>
  );
}
