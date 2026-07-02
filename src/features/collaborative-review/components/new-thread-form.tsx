"use client";

import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { DropdownSelect } from "@/components/ui/select";
import { FileCode2, X, Send, Loader2 } from "lucide-react";

interface NewThreadFormProps {
  reviewId: string;
  onCancel: () => void;
  onCreated: () => void;
  currentUserId: string;
  currentUserName: string;
  triggerTyping: (userId: string, name: string) => void;
  prFiles: string[];
}

export function NewThreadForm({
  reviewId,
  onCancel,
  onCreated,
  currentUserId,
  currentUserName,
  triggerTyping,
  prFiles,
}: NewThreadFormProps) {
  const [file, setFile] = useState("");
  const [line, setLine] = useState("");
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createThread = trpc.collaboration.createThread.useMutation({
    onSuccess: () => onCreated(),
  });

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createThread.mutate({
      reviewId,
      file: file || "general",
      line: parseInt(line) || 0,
      content: content.trim(),
    });
  };

  return (
    <div className="border border-[oklch(0.30_0.02_250)] rounded-[6px] bg-[oklch(0.16_0.025_250)] overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-[oklch(0.30_0.02_250/0.6)]">
          <span className="text-xs font-medium text-[oklch(0.82_0.02_250)]">New thread</span>
          <button type="button" onClick={onCancel} className="size-6 rounded-[4px] flex items-center justify-center text-[oklch(0.40_0.03_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors duration-150 cursor-pointer">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="px-3 py-2.5 space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FileCode2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[oklch(0.40_0.03_250)] pointer-events-none" />
              <DropdownSelect
                value={file}
                onValueChange={setFile}
                className="w-full h-7 pl-8 pr-2 text-xs font-mono rounded-[4px] border border-[oklch(0.30_0.02_250)] bg-[oklch(0.14_0.025_250)] text-[oklch(0.82_0.02_250)] focus:border-[oklch(0.62_0.16_250)] focus:ring-0"
                placeholder="File (optional)"
              >
                <option value="general">General</option>
                {prFiles.map((f) => <option key={f} value={f}>{f}</option>)}
              </DropdownSelect>
            </div>
            <input
              type="number"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder="Line"
              className="w-20 h-7 px-2 text-xs font-mono rounded-[4px] border border-[oklch(0.30_0.02_250)] bg-[oklch(0.14_0.025_250)] text-[oklch(0.82_0.02_250)] placeholder:text-[oklch(0.40_0.03_250)] focus:outline-none focus:border-[oklch(0.62_0.16_250)]"
            />
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); triggerTyping(currentUserId, currentUserName); }}
            placeholder="Write your comment…"
            rows={3}
            className="w-full px-3 py-2 text-[0.8125rem] rounded-[4px] border border-[oklch(0.30_0.02_250)] bg-[oklch(0.14_0.025_250)] text-[oklch(0.82_0.02_250)] placeholder:text-[oklch(0.40_0.03_250)] focus:outline-none focus:border-[oklch(0.62_0.16_250)] resize-none leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!content.trim() || createThread.isPending}
              className="h-7 px-3 rounded-[4px] text-xs font-medium bg-[oklch(0.62_0.16_250)] text-[oklch(0.12_0.03_250)] hover:bg-[oklch(0.55_0.14_250)] transition-colors duration-150 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              {createThread.isPending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
              Post
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
