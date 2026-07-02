"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  MessageSquarePlus,
  Reply,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type StatusFilter = "ALL" | "PENDING" | "RESOLVED";

export default function AdminUserFeedbackPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

  const page = Number(searchParams.get("page")) || 1;
  const status = (searchParams.get("status") ?? "ALL") as StatusFilter;

  const { data, isLoading } = trpc.admin.getAppFeedbacks.useQuery({
    page,
    limit: 20,
    status,
  });

  const [isPending, startTransition] = useTransition();

  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    email: string;
    subject: string | null;
    message: string;
  } | null>(null);
  const [replyText, setReplyText] = useState("");

  const replyMutation = trpc.admin.replyToAppFeedback.useMutation({
    onSuccess: () => {
      toast.success("Reply sent successfully");
      setReplyTarget(null);
      setReplyText("");
      utils.admin.getAppFeedbacks.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send reply");
    },
  });

  const updateFilters = useCallback(
    (newPage: number, newStatus: StatusFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) params.set("page", newPage.toString());
      else params.delete("page");
      if (newStatus !== "ALL") params.set("status", newStatus);
      else params.delete("status");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router],
  );

  const handleStatusChange = (val: string) =>
    updateFilters(1, val as StatusFilter);

  const handleReply = () => {
    if (!replyTarget || !replyText.trim()) return;
    replyMutation.mutate({ id: replyTarget.id, replyMessage: replyText });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquarePlus className="h-6 w-6 text-primary" />
          User Feedback
        </h1>
        <p className="text-muted-foreground">
          View and respond to feedback submitted by users through the app.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-40"
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.total} item{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Inbox</CardTitle>
          <CardDescription>
            Reply to a feedback item to send an email to the user and mark it as
            resolved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data?.feedbacks.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No feedback items yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.feedbacks.map((fb) => (
                  <TableRow key={fb.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">
                          {fb.name ?? "Anonymous"}
                        </span>
                        {fb.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {fb.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-45 truncate text-sm">
                      {fb.subject ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-65">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {fb.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          fb.status === "RESOLVED" ? "default" : "secondary"
                        }
                      >
                        {fb.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(fb.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!fb.email || fb.status === "RESOLVED"}
                        onClick={() =>
                          setReplyTarget({
                            id: fb.id,
                            email: fb.email!,
                            subject: fb.subject,
                            message: fb.message,
                          })
                        }
                      >
                        <Reply className="mr-1.5 h-3.5 w-3.5" />
                        Reply
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => updateFilters(page - 1, status)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pages || isPending}
            onClick={() => updateFilters(page + 1, status)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog
        open={!!replyTarget}
        onOpenChange={(v) => {
          if (!v) {
            setReplyTarget(null);
            setReplyText("");
          }
        }}
      >
        <DialogContent className="sm:max-w-120">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-primary" />
              Reply to Feedback
            </DialogTitle>
            <DialogDescription>
              Your reply will be sent via email to{" "}
              <strong>{replyTarget?.email}</strong> and the item will be marked
              as resolved.
            </DialogDescription>
          </DialogHeader>

          {replyTarget && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              {replyTarget.subject && (
                <p className="mb-1 font-medium">{replyTarget.subject}</p>
              )}
              <p className="text-muted-foreground line-clamp-3">
                {replyTarget.message}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reply-text">Your Reply</Label>
            <Textarea
              id="reply-text"
              placeholder="Write your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={5}
              maxLength={5000}
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setReplyTarget(null);
                setReplyText("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={replyMutation.isPending || !replyText.trim()}
            >
              <Mail className="mr-1.5 h-4 w-4" />
              {replyMutation.isPending ? "Sending…" : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
