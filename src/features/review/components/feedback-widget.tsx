"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FeedbackWidgetProps {
  reviewId: string;
}

export function FeedbackWidget({ reviewId }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.review.submitFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = () => {
    if (rating === null) return;
    submitFeedback.mutate({
      reviewId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  if (submitted) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="py-8 flex flex-col items-center text-center">
          <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="size-6 text-emerald-500" />
          </div>
          <CardTitle className="text-lg">
            Thank you for your feedback!
          </CardTitle>
          <CardDescription className="mt-2">
            Your input helps us improve the quality of AI reviews.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed p-4 ">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          How was this review?
        </CardTitle>
        <CardDescription>
          Help us improve the AI by rating the usefulness of these suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRating(1)}
            className={cn(
              "gap-2 h-10 px-4 transition-all",
              rating === 1 &&
                "border-emerald-500 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700",
            )}
          >
            <ThumbsUp
              className={cn("size-4", rating === 1 && "fill-current")}
            />
            <span>Helpful</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRating(-1)}
            className={cn(
              "gap-2 h-10 px-4 transition-all",
              rating === -1 &&
                "border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700",
            )}
          >
            <ThumbsDown
              className={cn("size-4", rating === -1 && "fill-current")}
            />
            <span>Not helpful</span>
          </Button>
        </div>

        {rating !== null && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Textarea
              placeholder="Any specific feedback? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none min-h-[80px] bg-muted/30 focus-visible:ring-primary/20"
            />
            <Button
              className="w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={submitFeedback.isPending}
            >
              {submitFeedback.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
