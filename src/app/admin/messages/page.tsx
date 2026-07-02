"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare, CheckCircle2, Trash2, Inbox, Reply, Send } from "lucide-react";
import type { MessageCategory } from "@/server/db/client";

const CATEGORY_LABELS: Record<string, string> = {
  CONTACT: "Contact",
  FEEDBACK: "Feedback",
  REVIEW_FEEDBACK: "Review Feedback",
  MAINTENANCE_FEEDBACK: "Maintenance Feedback",
};

const CATEGORY_COLORS: Record<string, string> = {
  CONTACT: "bg-blue-500/10 text-blue-500",
  FEEDBACK: "bg-violet-500/10 text-violet-500",
  REVIEW_FEEDBACK: "bg-amber-500/10 text-amber-500",
  MAINTENANCE_FEEDBACK: "bg-rose-500/10 text-rose-500",
};

interface ReplyTarget {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function AdminMessagesPage() {
  const [filter, setFilter] = useState<MessageCategory | undefined>(undefined);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [replyText, setReplyText] = useState("");
  const utils = trpc.useUtils();

  const { data: counts, isLoading: countsLoading } = trpc.admin.counts.useQuery();
  const { data, isLoading } = trpc.admin.list.useQuery({ category: filter, limit: 50 });

  const resolve = trpc.admin.resolve.useMutation({
    onSuccess: () => { utils.admin.list.invalidate(); utils.admin.counts.invalidate(); toast.success("Updated"); },
  });
  const deleteMut = trpc.admin.delete.useMutation({
    onSuccess: () => { utils.admin.list.invalidate(); utils.admin.counts.invalidate(); toast.success("Deleted"); },
  });
  const reply = trpc.admin.reply.useMutation({
    onSuccess: () => {
      utils.admin.list.invalidate();
      utils.admin.counts.invalidate();
      toast.success("Reply sent & message resolved");
      setReplyTarget(null);
      setReplyText("");
    },
    onError: (err) => toast.error(err.message),
  });

  const totalUnresolved = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground">Manage contact and feedback messages</p>
      </div>

      {/* Counts cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {countsLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          : Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-colors ${filter === key ? "ring-2 ring-primary" : ""}`}
                onClick={() => setFilter(filter === key ? undefined : (key as MessageCategory))}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{counts?.[key] ?? 0}</p>
                  <p className="text-xs text-muted-foreground">unresolved</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Total badge */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Inbox className="h-3 w-3" />
          {totalUnresolved} unresolved total
        </Badge>
        {filter && (
          <Button variant="ghost" size="sm" onClick={() => setFilter(undefined)}>
            Clear filter
          </Button>
        )}
      </div>

      {/* Messages list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {filter ? CATEGORY_LABELS[filter] : "All Messages"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !data?.messages.length ? (
            <p className="py-8 text-center text-muted-foreground">No messages found.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-foreground truncate">{msg.name}</span>
                      <span className="text-xs text-muted-foreground">&lt;{msg.email}&gt;</span>
                      <Badge className={`text-[10px] ${CATEGORY_COLORS[msg.category]}`}>
                        {CATEGORY_LABELS[msg.category]}
                      </Badge>
                      {msg.resolved && (
                        <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{msg.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(msg.createdAt).toLocaleDateString()} at{" "}
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Reply"
                      onClick={() => {
                        setReplyTarget({ id: msg.id, name: msg.name, email: msg.email, subject: msg.subject, message: msg.message });
                        setReplyText("");
                      }}
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolve.mutate({ id: msg.id, resolved: !msg.resolved })}
                      title={msg.resolved ? "Mark unresolved" : "Mark resolved"}
                    >
                      <CheckCircle2 className={`h-4 w-4 ${msg.resolved ? "text-emerald-500" : "text-muted-foreground"}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (confirm("Delete this message?")) deleteMut.mutate({ id: msg.id }); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={!!replyTarget} onOpenChange={(open) => { if (!open) setReplyTarget(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {replyTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Original message:</p>
              <p className="text-sm text-foreground">{replyTarget?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply">Your reply to {replyTarget?.email}</Label>
              <Textarea
                id="reply"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplyTarget(null)}>Cancel</Button>
            <Button
              disabled={!replyText.trim() || reply.isPending}
              onClick={() => { if (replyTarget) reply.mutate({ id: replyTarget.id, replyMessage: replyText }); }}
            >
              {reply.isPending ? "Sending..." : "Send reply"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
