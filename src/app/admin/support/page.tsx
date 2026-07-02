"use client";

import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
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
import { Mail, Reply } from "lucide-react";

export default function AdminSupportPage() {
  const utils = trpc.useUtils();
  const { data: messages, isLoading } =
    trpc.admin.getSupportMessages.useQuery();

  const [replyMessage, setReplyMessage] = useState<{
    id: string;
    email: string;
    message: string;
  } | null>(null);
  const [replyText, setReplyText] = useState("");

  const updateMutation = trpc.admin.updateSupportStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.admin.getSupportMessages.invalidate();
    },
  });

  const replyMutation = trpc.admin.replyToSupportMessage.useMutation({
    onSuccess: () => {
      toast.success("Reply sent successfully");
      setReplyMessage(null);
      setReplyText("");
      utils.admin.getSupportMessages.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send reply");
    },
  });

  const toggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PENDING" ? "RESOLVED" : "PENDING";
    updateMutation.mutate({ id, status: nextStatus });
  };

  const handleReply = () => {
    if (!replyMessage || !replyText.trim()) return;
    replyMutation.mutate({
      id: replyMessage.id,
      email: replyMessage.email,
      replyMessage: replyText,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Messages</h1>
        <p className="text-muted-foreground">
          Manage messages received from the maintenance page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Direct inquiries from users during downtime.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No support messages found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>User / Email</TableHead>
                  <TableHead className="w-[40%]">Message</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">
                      {msg.email || (
                        <span className="text-muted-foreground italic">
                          Anonymous
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="whitespace-pre-wrap text-xs">
                        {msg.message}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          msg.status === "RESOLVED" ? "secondary" : "default"
                        }
                      >
                        {msg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {msg.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => {
                              setReplyMessage({
                                id: msg.id,
                                email: msg.email!,
                                message: msg.message,
                              });
                            }}
                          >
                            <Reply className="h-3.5 w-3.5" />
                            Reply
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => toggleStatus(msg.id, msg.status)}
                          disabled={updateMutation.isPending}
                        >
                          Mark as{" "}
                          {msg.status === "PENDING" ? "Resolved" : "Pending"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!replyMessage}
        onOpenChange={(open) => !open && setReplyMessage(null)}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Reply to Support Inquiry
            </DialogTitle>
            <DialogDescription>
              Sending an email to <strong>{replyMessage?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Original Message
              </Label>
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground max-h-32 overflow-y-auto italic">
                &quot;{replyMessage?.message}&quot;
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply" className="text-sm font-medium">
                Your Response
              </Label>
              <Textarea
                id="reply"
                placeholder="Type your reply here..."
                className="min-h-[150px] resize-none"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setReplyMessage(null)}
              disabled={replyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={replyMutation.isPending || !replyText.trim()}
              className="gap-2"
            >
              {replyMutation.isPending ? (
                "Sending..."
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
