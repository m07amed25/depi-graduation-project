"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Check, HelpCircle } from "lucide-react";

type AutoReviewToggleProps = {
  repositoryId: string;
  repoFullName?: string;
};

export function AutoReviewToggle({
  repositoryId,
  repoFullName,
}: AutoReviewToggleProps) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.repository.getWebhookConfig.useQuery({
    repositoryId,
  });

  // Local slider state — initialised from server once loaded
  const serverThreshold = data?.scoreThreshold ?? null;
  const [localThreshold, setLocalThreshold] = useState<number | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Use local state if the user has dragged the slider, otherwise use server value
  const displayThreshold = localThreshold ?? serverThreshold;

  const update = trpc.repository.updateWebhookConfig.useMutation({
    onSuccess: async () => {
      setWebhookError(null);
      await utils.repository.getWebhookConfig.invalidate({ repositoryId });
    },
    onError: (error) => {
      setWebhookError(error.message ?? "Failed to update auto-review setting.");
    },
  });

  const updateThreshold = trpc.repository.updateScoreThreshold.useMutation({
    onSuccess: async () => {
      await utils.repository.getWebhookConfig.invalidate({ repositoryId });
      setLocalThreshold(null);
    },
    onError: (error) => {
      window.alert(error.message || "Failed to update score threshold.");
    },
  });

  const enabled = update.variables?.enabled ?? data?.enabled ?? false;
  const disabled = isLoading || update.isPending;
  const thresholdPending = updateThreshold.isPending;

  const appBase = typeof window !== "undefined" ? window.location.origin : "";
  const badgeUrl = repoFullName ? `${appBase}/api/badge/${repoFullName}` : null;
  const badgeMarkdown = badgeUrl
    ? `[![Code Catch](${badgeUrl})](${appBase})`
    : null;

  const handleCopyBadge = async () => {
    if (!badgeMarkdown) return;
    await navigator.clipboard.writeText(badgeMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Automatic Pull Request Reviews
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-xs">
                Automatically runs an AI code review on every new pull request via a GitHub webhook. No manual trigger needed.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          When enabled, Code Catch will review every pull request and post
          results as a PR comment and a commit status check.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Webhook toggle ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Switch
            id={`auto-review-${repositoryId}`}
            checked={enabled}
            disabled={disabled}
            onCheckedChange={(value) => {
              setWebhookError(null);
              update.mutate({ repositoryId, enabled: value });
            }}
          />
          <Label htmlFor={`auto-review-${repositoryId}`}>
            Enable webhook-triggered reviews for this repository
          </Label>
        </div>

        {webhookError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive space-y-1">
            <p className="font-medium">Could not register webhook</p>
            <p className="text-xs">{webhookError}</p>
            {webhookError.toLowerCase().includes("localhost") && (
              <p className="text-xs mt-1 text-muted-foreground">
                Add{" "}
                <code className="font-mono bg-muted px-1 rounded">
                  WEBHOOK_BASE_URL=https://&lt;your-ngrok-id&gt;.ngrok-free.app
                </code>{" "}
                to{" "}
                <code className="font-mono bg-muted px-1 rounded">
                  .env.local
                </code>{" "}
                and restart the dev server.
              </p>
            )}
          </div>
        )}

        <Separator />

        {/* ── Branch-protection threshold ────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Branch-protection threshold</p>
              <p className="text-xs text-muted-foreground">
                Reviews with a risk score at or above this value will fail the
                GitHub status check, blocking merges when branch protection is
                enabled.{" "}
                {displayThreshold === null
                  ? "Currently using the default (fail on any critical/high finding)."
                  : `Currently set to ${displayThreshold}/100.`}
              </p>
            </div>
            {displayThreshold !== null && (
              <span className="tabular-nums text-sm font-semibold">
                {displayThreshold}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id={`threshold-enabled-${repositoryId}`}
              checked={displayThreshold !== null}
              disabled={isLoading || thresholdPending}
              onCheckedChange={(checked) => {
                if (!checked) {
                  setLocalThreshold(null);
                  updateThreshold.mutate({
                    repositoryId,
                    scoreThreshold: null,
                  });
                } else {
                  setLocalThreshold(70);
                }
              }}
            />
            <Label
              htmlFor={`threshold-enabled-${repositoryId}`}
              className="text-sm"
            >
              Use a numeric risk-score threshold
            </Label>
          </div>

          {displayThreshold !== null && (
            <div className="space-y-2 pl-7">
              <Slider
                min={0}
                max={100}
                step={5}
                value={[displayThreshold]}
                disabled={isLoading || thresholdPending}
                onValueChange={([v]) =>
                  setLocalThreshold(v ?? displayThreshold)
                }
                className="w-full max-w-xs"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    thresholdPending ||
                    localThreshold === null ||
                    localThreshold === serverThreshold
                  }
                  onClick={() =>
                    updateThreshold.mutate({
                      repositoryId,
                      scoreThreshold: displayThreshold,
                    })
                  }
                >
                  {thresholdPending ? "Saving…" : "Save threshold"}
                </Button>
                {localThreshold !== null &&
                  localThreshold !== serverThreshold && (
                    <span className="text-xs text-muted-foreground">
                      Unsaved changes
                    </span>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* ── README badge snippet ────────────────────────────────────────── */}
        {badgeMarkdown && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">README badge</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyBadge}
                  className="h-7 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 size-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 size-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Embed this Markdown in your README to display the latest review
                status:
              </p>
              <pre
                onClick={handleCopyBadge}
                className="rounded bg-muted px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all cursor-pointer hover:bg-muted/80 transition-colors"
              >
                {badgeMarkdown}
              </pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
