"use client";

import { Button } from "@/components/ui/button";
import { Clock, XCircle, Loader2, Wand2, CheckCircle2 } from "lucide-react";

export function PendingCard() {
  return (
    <div className="py-12 text-center border border-border rounded-md">
      <Clock className="size-6 text-amber-500 mx-auto mb-2" />
      <p className="text-sm font-medium">Queued for review</p>
      <p className="text-xs text-muted-foreground mt-1">Will be processed shortly.</p>
    </div>
  );
}

export function ProcessingCard() {
  return (
    <div className="py-12 text-center border border-border rounded-md">
      <Loader2 className="size-6 text-primary mx-auto mb-2 animate-spin" />
      <p className="text-sm font-medium">Analyzing code</p>
      <p className="text-xs text-muted-foreground mt-1">Scanning for bugs, security issues, and improvements.</p>
    </div>
  );
}

export function FailedCard({ error, onRetry, isRetrying }: { error: string | null; onRetry?: () => void; isRetrying?: boolean }) {
  return (
    <div className="py-12 text-center border border-destructive/30 rounded-md">
      <XCircle className="size-6 text-destructive mx-auto mb-2" />
      <p className="text-sm font-medium text-destructive">Analysis failed</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{error || "An unexpected error occurred. Please try again."}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
          {isRetrying ? "Retrying..." : "Retry"}
        </Button>
      )}
    </div>
  );
}

export function NoIssuesCard() {
  return (
    <div className="py-12 text-center border border-emerald-500/20 rounded-md bg-emerald-500/5">
      <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-2" />
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">No issues found</p>
      <p className="text-xs text-muted-foreground mt-1">Code follows best practices and appears clean and secure.</p>
    </div>
  );
}
