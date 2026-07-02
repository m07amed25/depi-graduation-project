"use client";

import { useCallback, useTransition } from "react";

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
import { Select } from "@/components/ui/select";
import {
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type RatingFilter = 1 | -1 | 0;

export default function AdminFeedbackPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const rating = (Number(searchParams.get("rating")) || 0) as RatingFilter;

  const { data, isLoading } = trpc.admin.getFeedbacks.useQuery({
    page,
    limit: 20,
    rating,
  });

  const [isPending, startTransition] = useTransition();

  const updateFilters = useCallback(
    (newPage: number, newRating: RatingFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) params.set("page", newPage.toString());
      else params.delete("page");

      if (newRating !== 0) params.set("rating", newRating.toString());
      else params.delete("rating");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router],
  );

  const handleRatingChange = useCallback(
    (val: string) => {
      updateFilters(1, Number(val) as RatingFilter);
    },
    [updateFilters],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          PR Review Feedback
        </h1>
        <p className="text-muted-foreground">
          Analyze author sentiment and comments to improve AI review quality.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Rating:
        </span>
        <Select
          value={rating.toString()}
          onChange={(e) => handleRatingChange(e.target.value)}
          className="w-40"
        >
          <option value="0">All Ratings</option>
          <option value="1">Helpful (Up)</option>
          <option value="-1">Not Helpful (Down)</option>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback Feed</CardTitle>
          <CardDescription>
            Showing {data?.feedbacks.length ?? 0} of {data?.total ?? 0} total
            entries
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {data?.feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="flex flex-col gap-4 p-6 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        {fb.user.image && <AvatarImage src={fb.user.image} />}
                        <AvatarFallback>
                          {fb.user.name?.charAt(0) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {fb.user.name ?? "Anonymous User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {fb.user.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          fb.rating === 1
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }`}
                      >
                        {fb.rating === 1 ? (
                          <ThumbsUp className="size-3 fill-current" />
                        ) : (
                          <ThumbsDown className="size-3 fill-current" />
                        )}
                        <span>
                          {fb.rating === 1 ? "Helpful" : "Not Helpful"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {fb.comment ? (
                      <div className="bg-muted/30 p-4 rounded-lg border border-border/50 italic text-sm text-foreground/80 leading-relaxed relative">
                        <MessageSquare className="size-4 absolute -top-2 -left-2 text-muted-foreground/30 fill-current" />
                        &quot;{fb.comment}&quot;
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No comment provided.
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Attached Review
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/repo/${fb.review.repository.id}/pr/${fb.review.prNumber}`}
                            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {fb.review.prTitle || `PR #${fb.review.prNumber}`}
                            <ExternalLink className="size-2.5" />
                          </Link>
                          <span className="text-[10px] text-muted-foreground opacity-50">
                            ·
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {fb.review.repository.fullName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {data?.feedbacks.length === 0 && (
                <div className="py-24 text-center space-y-3">
                  <div className="inline-flex size-12 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="size-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">No feedback yet</p>
                    <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                      Author feedback will appear here once reviews are rated.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => updateFilters(page - 1, rating)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.pages}
            onClick={() => updateFilters(page + 1, rating)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
