"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "GENERAL", label: "General Feedback" },
  { value: "BUG", label: "Bug Report" },
  { value: "FEATURE", label: "Feature Request" },
  { value: "OTHER", label: "Other" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<Category>("GENERAL");

  const submitMutation = trpc.admin.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Thank you! Your feedback has been received.");
      setOpen(false);
      setSubject("");
      setMessage("");
      setCategory("GENERAL");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit feedback.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    submitMutation.mutate({ subject, message, category });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        data-feedback-button
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-115">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
              Share Your Feedback
            </DialogTitle>
            <DialogDescription>
              Got a suggestion, found a bug, or want to share your thoughts?
              We&apos;d love to hear from you.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="fb-category">Category</Label>
              <Select
                id="fb-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fb-subject">Subject</Label>
              <Input
                id="fb-subject"
                placeholder="Brief summary of your feedback"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fb-message">Message</Label>
              <Textarea
                id="fb-message"
                placeholder="Describe your feedback in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={5000}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  submitMutation.isPending || !subject.trim() || !message.trim()
                }
              >
                <Send className="mr-1.5 h-4 w-4" />
                {submitMutation.isPending ? "Sending…" : "Send Feedback"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
