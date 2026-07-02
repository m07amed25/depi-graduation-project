"use client";

import { useState } from "react";
import { Send, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SupportDialogProps {
  trigger?: React.ReactNode;
}

export function SupportDialog({ trigger }: SupportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submitMutation = trpc.admin.submitSupportMessage.useMutation({
    onSuccess: () => {
      toast.success("Message sent! We'll get back to you soon.");
      setIsOpen(false);
      setMessage("");
      setEmail("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send message.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitMutation.mutate({ email: email || undefined, message });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Contact Support</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-primary" />
              Contact Support
            </DialogTitle>
            <DialogDescription>
              Need help or want to report an issue? Leave us a message below and
              we&apos;ll get back to you.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Email address (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-2 text-left">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                required
                placeholder="How can we help you?"
                className="min-h-[120px] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="w-full gap-2 h-11"
              disabled={submitMutation.isPending}
            >
              <Send className="h-4 w-4" />
              {submitMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
