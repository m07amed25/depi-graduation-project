"use client";

import React, { useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  FileCode2,
  ShieldX,
  ShieldAlert,
  AlertTriangle,
  Info,
  Lightbulb,
  FolderOpen,
  CheckCircle2,
  MessageSquare,
  Send,
  Loader2,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSeverityStyles, getCategoryIcon } from "./helpers";
import { ConfidenceBadge } from "./quality-metrics-card";
import type { ReviewComment } from "./types";
import { trpc } from "@/lib/trpc/client";

export function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "critical": return <ShieldX className="size-3.5 text-red-500" />;
    case "high": return <ShieldAlert className="size-3.5 text-orange-500" />;
    case "medium": return <AlertTriangle className="size-3.5 text-amber-500" />;
    case "info": return <Info className="size-3.5 text-sky-500" />;
    default: return <Info className="size-3.5 text-muted-foreground" />;
  }
}

function InlineAIChat({ reviewId, comment }: { reviewId: string; comment: ReviewComment }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<{ q: string; a: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const askAI = trpc.review.askAI.useMutation({
    onSuccess: ({ answer }) => { setThread((prev) => { const u = [...prev]; const l = u[u.length - 1]; if (l) u[u.length - 1] = { ...l, a: answer }; return u; }); },
    onError: () => { setThread((prev) => { const u = [...prev]; const l = u[u.length - 1]; if (l) u[u.length - 1] = { ...l, a: "Failed to generate response." }; return u; }); },
  });

  const handleSubmit = () => {
    const q = question.trim();
    if (!q || askAI.isPending) return;
    setThread((prev) => [...prev, { q, a: "" }]);
    setQuestion("");
    askAI.mutate({ reviewId, file: comment.file, line: comment.line, severity: comment.severity, category: comment.category, message: comment.message, suggestion: comment.suggestion, question: q });
  };

  if (!open) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/5">
        <MessageSquare className="size-3" />Ask AI
      </button>
    );
  }

  return (
    <div className="space-y-2.5 mt-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {thread.map((item, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-primary/60 shrink-0">You</span>
            <p className="text-xs text-foreground/80">{item.q}</p>
          </div>
          {item.a ? (
            <div className="flex items-start gap-2">
              <Bot className="size-3.5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&_code]:text-xs [&_code]:font-mono">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.a}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />Thinking</div>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input ref={inputRef} value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }} placeholder="Ask a follow-up..." disabled={askAI.isPending} className="flex-1 text-xs bg-muted/50 rounded-md px-3 py-1.5 border border-border outline-none focus:border-primary/30 transition-colors disabled:opacity-60" />
        <button onClick={handleSubmit} disabled={!question.trim() || askAI.isPending} className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"><Send className="size-3" /></button>
      </div>
    </div>
  );
}

export function FileGroup({ file, comments, allExpanded, expandKey, resolvedKeys, onToggleResolved, reviewId }: { file: string; comments: ReviewComment[]; allExpanded: boolean | null; expandKey: number; resolvedKeys?: Set<string>; onToggleResolved?: (key: string) => void; reviewId?: string }) {
  const [open, setOpen] = useState(true);
  const pathParts = file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <div className="space-y-1.5">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 px-2 py-1.5 w-full text-left rounded-md hover:bg-muted/50 transition-colors">
        {open ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
        <FolderOpen className="size-3.5 text-muted-foreground/70" />
        <span className="text-xs font-mono text-muted-foreground flex-1 truncate">
          {directory && <span className="opacity-40">{directory}/</span>}
          <span className="font-medium text-foreground/90">{fileName}</span>
        </span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{comments.length}</span>
      </button>
      {open && (
        <div className="space-y-1.5 pl-1">
          {comments.map((comment, index) => {
            const rKey = `${comment.file}:${comment.line}:${comment.severity}:${comment.category ?? ""}`;
            return <CommentCard key={`${comment.file}:${comment.line}:${index}`} comment={comment} index={index} forceExpanded={allExpanded} expandKey={expandKey} resolved={resolvedKeys?.has(rKey)} onToggleResolved={onToggleResolved ? () => onToggleResolved(rKey) : undefined} reviewId={reviewId} />;
          })}
        </div>
      )}
    </div>
  );
}

export function CommentCard({ comment, index, forceExpanded, expandKey, resolved, onToggleResolved, reviewId }: { comment: ReviewComment; index: number; forceExpanded?: boolean | null; expandKey?: number; resolved?: boolean; onToggleResolved?: () => void; reviewId?: string }) {
  const [expanded, setExpanded] = useState(index < 3);
  const [prevExpandKey, setPrevExpandKey] = useState(expandKey);
  if (expandKey !== prevExpandKey) { setPrevExpandKey(expandKey); if (forceExpanded !== null && forceExpanded !== undefined) setExpanded(forceExpanded); }

  const [copied, setCopied] = useState(false);
  const CategoryIcon = getCategoryIcon(comment.category);
  const severityConfig = getSeverityStyles(comment.severity);

  const toggleExpand = useCallback(() => setExpanded((p) => !p), []);
  const copyLocation = useCallback(() => { navigator.clipboard.writeText(`${comment.file}:${comment.line}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }, [comment.file, comment.line]);

  const pathParts = comment.file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <div className={cn("rounded-md border transition-colors", resolved ? "opacity-50 border-emerald-500/20" : "border-border hover:border-primary/30")}>
      <div role="button" tabIndex={0} onClick={toggleExpand} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(); } }} className="w-full text-left cursor-pointer p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          <SeverityIcon severity={comment.severity} />
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Header */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className={cn("text-xs font-medium capitalize", severityConfig.badge)}>{comment.severity}</Badge>
              {comment.category && <Badge variant="secondary" className="gap-1 text-xs">{React.createElement(CategoryIcon, { className: "size-3" })}{comment.category}</Badge>}
              {comment.confidence !== undefined && <ConfidenceBadge confidence={comment.confidence} />}
              <div className="flex-1" />
              {onToggleResolved && (
                <button onClick={(e) => { e.stopPropagation(); onToggleResolved(); }} className={cn("flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border transition-colors", resolved ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-border text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30")}>
                  <CheckCircle2 className="size-3" />{resolved ? "Resolved" : "Resolve"}
                </button>
              )}
              {expanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
            </div>
            {/* Message */}
            <p className={cn("text-sm leading-relaxed", !expanded && "line-clamp-2", resolved && "line-through opacity-60")}>{comment.message}</p>
            {/* File location */}
            <button onClick={(e) => { e.stopPropagation(); copyLocation(); }} className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
              <FileCode2 className="size-3 shrink-0" />
              {directory && <span className="opacity-40 hidden sm:inline">{directory}/</span>}
              <span className="font-medium text-foreground/80">{fileName}</span>
              <span className="opacity-40">:</span>
              <span className="text-primary font-medium">{comment.line}</span>
              {copied && <Check className="size-3 text-emerald-500 ml-1" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (comment.suggestion || reviewId) && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 ml-6">
          {comment.suggestion && (
            <div className="rounded-md bg-emerald-500/5 border border-emerald-500/15 p-3 mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="size-3 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Suggestion</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">{comment.suggestion}</p>
            </div>
          )}
          {reviewId && <InlineAIChat reviewId={reviewId} comment={comment} />}
        </div>
      )}
    </div>
  );
}
