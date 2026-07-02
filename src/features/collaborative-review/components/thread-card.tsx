"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  ChevronRight,
  FileCode2,
  Trash2,
  RotateCcw,
  Loader2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "./helpers";

interface ThreadComment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; name: string; image?: string | null };
}

interface Thread {
  id: string;
  file: string;
  line: number;
  resolved: boolean;
  createdAt: string | Date;
  comments: ThreadComment[];
}

interface ThreadCardProps {
  thread: Thread;
  currentUserId: string;
  currentUserName: string;
  triggerTyping: (userId: string, name: string) => void;
}

export function ThreadCard({ thread, currentUserId, currentUserName, triggerTyping }: ThreadCardProps) {
  const [expanded, setExpanded] = useState(!thread.resolved);
  const [replyContent, setReplyContent] = useState("");
  const [showReply, setShowReply] = useState(false);

  const toggleResolve = trpc.collaboration.toggleResolve.useMutation();
  const addComment = trpc.collaboration.addComment.useMutation({
    onSuccess: () => { setReplyContent(""); setShowReply(false); },
  });
  const deleteComment = trpc.collaboration.deleteComment.useMutation();

  const firstComment = thread.comments[0];
  const pathParts = thread.file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <div className="border-b border-[oklch(0.30_0.02_250)]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors duration-150 cursor-pointer",
          "hover:bg-[oklch(0.20_0.02_250)]",
          expanded && "bg-[oklch(0.18_0.025_250)]",
        )}
      >
        <ChevronRight className={cn(
          "size-3.5 text-[oklch(0.60_0.03_250)] shrink-0 transition-transform duration-150",
          expanded && "rotate-90",
        )} />
        {thread.file !== "general" && (
          <span className="flex items-center gap-1 text-[0.6875rem] font-mono shrink-0 text-[oklch(0.60_0.03_250)]">
            <FileCode2 className="size-3" />
            {directory && <span className="opacity-50 max-w-20 truncate">{directory}/</span>}
            <span className="text-[oklch(0.82_0.02_250)] font-medium">{fileName}</span>
            {thread.line > 0 && (
              <span className="text-[oklch(0.62_0.16_250)]">:{thread.line}</span>
            )}
          </span>
        )}
        <span className="text-[0.8125rem] truncate flex-1 text-[oklch(0.82_0.02_250)]">
          {firstComment?.content.slice(0, 80)}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {thread.resolved && <CheckCircle2 className="size-3 text-[oklch(0.55_0.15_155)]" />}
          <span className="text-[0.6875rem] font-mono tabular-nums text-[oklch(0.40_0.03_250)]">
            {thread.comments.length}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="bg-[oklch(0.14_0.025_250)] border-t border-[oklch(0.30_0.02_250/0.6)]">
          {/* Comments */}
          <div className="divide-y divide-[oklch(0.30_0.02_250/0.4)]">
            {thread.comments.map((comment) => (
              <div key={comment.id} className="px-3 py-3 flex gap-2.5 group/comment">
                <Avatar className="size-6 shrink-0 mt-0.5">
                  <AvatarImage src={comment.user.image ?? undefined} />
                  <AvatarFallback className="text-[8px] font-medium bg-[oklch(0.20_0.02_250)] text-[oklch(0.60_0.03_250)]">
                    {comment.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[oklch(0.82_0.02_250)]">{comment.user.name}</span>
                    <span className="text-[0.6875rem] font-mono text-[oklch(0.40_0.03_250)]">{formatTime(comment.createdAt)}</span>
                    {comment.user.id === currentUserId && (
                      <button
                        className="opacity-0 group-hover/comment:opacity-100 transition-opacity duration-150 ml-auto cursor-pointer"
                        onClick={() => deleteComment.mutate({ commentId: comment.id })}
                        disabled={deleteComment.isPending}
                      >
                        <Trash2 className="size-3 text-[oklch(0.40_0.03_250)] hover:text-[oklch(0.55_0.2_25)] transition-colors duration-150" />
                      </button>
                    )}
                  </div>
                  <p className="text-[0.8125rem] text-[oklch(0.82_0.02_250)] leading-relaxed mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-3 py-2 flex items-center gap-2 border-t border-[oklch(0.30_0.02_250/0.4)]">
            <button
              onClick={() => setShowReply((v) => !v)}
              className="h-7 px-2.5 rounded-[4px] text-xs font-medium text-[oklch(0.60_0.03_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors duration-150 cursor-pointer"
            >
              Reply
            </button>
            <button
              onClick={() => toggleResolve.mutate({ threadId: thread.id })}
              disabled={toggleResolve.isPending}
              className={cn(
                "h-7 px-2.5 rounded-[4px] text-xs font-medium transition-colors duration-150 cursor-pointer",
                thread.resolved
                  ? "text-[oklch(0.65_0.15_75)] hover:bg-[oklch(0.65_0.15_75/0.1)]"
                  : "text-[oklch(0.55_0.15_155)] hover:bg-[oklch(0.55_0.15_155/0.1)]",
              )}
            >
              {toggleResolve.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : thread.resolved ? (
                <span className="flex items-center gap-1"><RotateCcw className="size-3" />Reopen</span>
              ) : (
                <span className="flex items-center gap-1"><CheckCircle2 className="size-3" />Resolve</span>
              )}
            </button>
          </div>

          {/* Reply form */}
          {showReply && (
            <div className="px-3 py-2.5 border-t border-[oklch(0.30_0.02_250/0.4)]">
              <div className="flex gap-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => { setReplyContent(e.target.value); triggerTyping(currentUserId, currentUserName); }}
                  placeholder="Write a reply…"
                  rows={2}
                  className="flex-1 px-3 py-2 text-[0.8125rem] rounded-[4px] border border-[oklch(0.30_0.02_250)] bg-[oklch(0.16_0.025_250)] text-[oklch(0.82_0.02_250)] placeholder:text-[oklch(0.40_0.03_250)] focus:outline-none focus:border-[oklch(0.62_0.16_250)] resize-none"
                  autoFocus
                />
                <button
                  className="self-end h-8 w-8 rounded-[4px] bg-[oklch(0.62_0.16_250)] text-[oklch(0.12_0.03_250)] flex items-center justify-center hover:bg-[oklch(0.55_0.14_250)] transition-colors duration-150 disabled:opacity-40 cursor-pointer"
                  disabled={!replyContent.trim() || addComment.isPending}
                  onClick={() => addComment.mutate({ threadId: thread.id, content: replyContent.trim() })}
                >
                  {addComment.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
