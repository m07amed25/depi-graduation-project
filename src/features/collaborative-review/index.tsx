"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  PusherProvider,
  usePresenceChannel,
  useChannelEvent,
  useTypingIndicator,
  PUSHER_EVENTS,
} from "@/lib/pusher/client";
import { reviewChannel } from "@/server/pusher";
import {
  MessageCircle,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react";
import { PresenceAvatars } from "./components/presence-avatars";
import { NewThreadForm } from "./components/new-thread-form";
import { ThreadCard } from "./components/thread-card";

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

interface CollaborativeReviewProps {
  reviewId: string;
  currentUserId: string;
  currentUserName: string;
  isAdmin?: boolean;
  prFiles?: string[];
}

export function CollaborativeReview(props: CollaborativeReviewProps) {
  return (
    <PusherProvider>
      <CollaborativeReviewInner {...props} />
    </PusherProvider>
  );
}

function CollaborativeReviewInner({
  reviewId,
  currentUserId,
  currentUserName,
  isAdmin,
  prFiles = [],
}: CollaborativeReviewProps) {
  const channelName = reviewChannel(reviewId);
  const { members, myId } = usePresenceChannel(channelName);
  const { typingNames, triggerTyping } = useTypingIndicator(channelName);
  const [showResolved, setShowResolved] = useState(false);
  const [newThread, setNewThread] = useState<{ file: string; line: number } | null>(null);

  const threadsQuery = trpc.collaboration.getThreads.useQuery(
    { reviewId },
    { refetchOnWindowFocus: false },
  );
  const threads: Thread[] = (threadsQuery.data ?? []) as Thread[];

  useChannelEvent<Thread>(channelName, PUSHER_EVENTS.THREAD_CREATED, () => { threadsQuery.refetch(); });
  useChannelEvent(channelName, PUSHER_EVENTS.COMMENT_ADDED, () => { threadsQuery.refetch(); });
  useChannelEvent(channelName, PUSHER_EVENTS.COMMENT_DELETED, () => { threadsQuery.refetch(); });
  useChannelEvent(channelName, PUSHER_EVENTS.THREAD_RESOLVED, () => { threadsQuery.refetch(); });
  useChannelEvent(channelName, PUSHER_EVENTS.THREAD_REOPENED, () => { threadsQuery.refetch(); });

  const activeThreads = threads.filter((t) => !t.resolved);
  const resolvedThreads = threads.filter((t) => t.resolved);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[0.8125rem] font-medium text-[oklch(0.82_0.02_250)]">
            {activeThreads.length} <span className="text-[oklch(0.60_0.03_250)] font-normal">open</span>
          </span>
          {resolvedThreads.length > 0 && (
            <button
              onClick={() => setShowResolved((v) => !v)}
              className="flex items-center gap-1 text-[0.8125rem] text-[oklch(0.55_0.15_155)] hover:text-[oklch(0.65_0.15_155)] transition-colors duration-150 cursor-pointer"
            >
              <CheckCircle2 className="size-3" />
              <span className="font-mono tabular-nums">{resolvedThreads.length}</span>
              <span className="font-normal">resolved</span>
            </button>
          )}
        </div>
        <PresenceAvatars members={members} myId={myId} isAdmin={isAdmin} />
      </div>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <p className="text-[0.6875rem] text-[oklch(0.40_0.03_250)]">
          {typingNames.length === 1
            ? `${typingNames[0]} is typing…`
            : `${typingNames.slice(0, -1).join(", ")} and ${typingNames[typingNames.length - 1]} are typing…`}
        </p>
      )}

      {/* New thread trigger */}
      {!newThread && (
        <button
          onClick={() => setNewThread({ file: "", line: 0 })}
          className="w-full h-8 rounded-[4px] border border-[oklch(0.30_0.02_250)] text-xs font-medium text-[oklch(0.60_0.03_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="size-3.5" />
          New thread
        </button>
      )}

      {/* New thread form */}
      {newThread && (
        <NewThreadForm
          reviewId={reviewId}
          onCancel={() => setNewThread(null)}
          onCreated={() => { setNewThread(null); threadsQuery.refetch(); }}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          triggerTyping={triggerTyping}
          prFiles={prFiles}
        />
      )}

      {/* Thread list */}
      {threadsQuery.isLoading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-xs text-[oklch(0.40_0.03_250)]">
          <Loader2 className="size-3.5 animate-spin" />
          Loading…
        </div>
      ) : activeThreads.length === 0 && resolvedThreads.length === 0 ? (
        <div className="py-10 text-center">
          <MessageCircle className="size-5 mx-auto mb-2 text-[oklch(0.40_0.03_250)] opacity-40" />
          <p className="text-[0.8125rem] text-[oklch(0.60_0.03_250)]">No discussions yet.</p>
        </div>
      ) : (
        <div className="border border-[oklch(0.30_0.02_250)] rounded-[6px] overflow-hidden">
          {activeThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} currentUserId={currentUserId} currentUserName={currentUserName} triggerTyping={triggerTyping} />
          ))}
        </div>
      )}

      {/* Resolved threads */}
      {showResolved && resolvedThreads.length > 0 && (
        <div className="space-y-0">
          <div className="flex items-center gap-2 text-[0.6875rem] text-[oklch(0.40_0.03_250)] py-2">
            <CheckCircle2 className="size-3" />
            <span className="font-medium">Resolved</span>
          </div>
          <div className="border border-[oklch(0.30_0.02_250)] rounded-[6px] overflow-hidden opacity-60">
            {resolvedThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} currentUserId={currentUserId} currentUserName={currentUserName} triggerTyping={triggerTyping} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
