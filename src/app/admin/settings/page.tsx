"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Eye, Megaphone, AlertCircle, CheckCircle2 } from "lucide-react";

// ── Banner helpers ────────────────────────────────────────────────────────
const BANNER_COLORS = [
  { key: "indigo",  label: "Indigo",  swatch: "bg-indigo-600",  bar: "bg-indigo-600",  text: "text-white",      link: "text-white underline decoration-white/60" },
  { key: "emerald", label: "Emerald", swatch: "bg-emerald-600", bar: "bg-emerald-600", text: "text-white",      link: "text-white underline decoration-white/60" },
  { key: "amber",   label: "Amber",   swatch: "bg-amber-400",   bar: "bg-amber-400",   text: "text-amber-950", link: "text-amber-950 underline decoration-amber-800/60" },
  { key: "rose",    label: "Rose",    swatch: "bg-rose-600",    bar: "bg-rose-600",    text: "text-white",      link: "text-white underline decoration-white/60" },
  { key: "violet",  label: "Violet",  swatch: "bg-violet-600",  bar: "bg-violet-600",  text: "text-white",      link: "text-white underline decoration-white/60" },
] as const;

type BannerColorKey = typeof BANNER_COLORS[number]["key"];

const QUICK_EMOJIS = ["🎉", "🚀", "🔔", "⚡", "🎁", "✨", "📢", "🛠️"];
const MAX_CHARS = 500;

// ── RetentionForm ─────────────────────────────────────────────────────────
interface RetentionData {
  reviewRetentionDays: number;
  auditLogRetentionDays: number;
  sessionRetentionDays: number;
}

function RetentionForm({ initial }: { initial: RetentionData }) {
  const utils = trpc.useUtils();
  const [reviewDays, setReviewDays] = useState(String(initial.reviewRetentionDays));
  const [auditDays, setAuditDays] = useState(String(initial.auditLogRetentionDays));
  const [sessionDays, setSessionDays] = useState(String(initial.sessionRetentionDays));

  const mutation = trpc.admin.updateRetentionSettings.useMutation({
    onSuccess: () => {
      toast.success("Retention policy saved");
      utils.admin.getRetentionSettings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const parse = (v: string, fallback: number) => {
      const n = parseInt(v, 10);
      return isNaN(n) || n < 0 ? fallback : n;
    };
    mutation.mutate({
      reviewRetentionDays: parse(reviewDays, 0),
      auditLogRetentionDays: parse(auditDays, 0),
      sessionRetentionDays: parse(sessionDays, 0),
    });
  };

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ret-reviews">Reviews (days)</Label>
          <Input id="ret-reviews" type="number" min={0} max={3650} value={reviewDays} onChange={(e) => setReviewDays(e.target.value)} placeholder="0 = keep forever" />
          <p className="text-[10px] text-muted-foreground">Completed and failed reviews older than N days</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ret-audit">Audit logs (days)</Label>
          <Input id="ret-audit" type="number" min={0} max={3650} value={auditDays} onChange={(e) => setAuditDays(e.target.value)} placeholder="0 = keep forever" />
          <p className="text-[10px] text-muted-foreground">Admin audit events older than N days</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ret-sessions">Sessions (days)</Label>
          <Input id="ret-sessions" type="number" min={0} max={365} value={sessionDays} onChange={(e) => setSessionDays(e.target.value)} placeholder="0 = keep forever" />
          <p className="text-[10px] text-muted-foreground">Expired user sessions older than N days</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending} size="sm">
          {mutation.isPending ? "Saving…" : "Save retention policy"}
        </Button>
      </div>
    </>
  );
}

// ── BannerForm ────────────────────────────────────────────────────────────
interface BannerData {
  enabled: boolean;
  text: string;
  link: string;
  linkText: string;
  color: string;
}

function BannerForm({ initial }: { initial: BannerData }) {
  const utils = trpc.useUtils();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [text, setText] = useState(initial.text);
  const [link, setLink] = useState(initial.link);
  const [linkText, setLinkText] = useState(initial.linkText);
  const [color, setColor] = useState<BannerColorKey>((initial.color as BannerColorKey) ?? "indigo");
  const [dirty, setDirty] = useState(false);

  const mark = () => setDirty(true);

  const mutation = trpc.admin.updateBannerSettings.useMutation({
    onSuccess: () => {
      toast.success("Banner settings saved");
      setDirty(false);
      utils.admin.getBannerSettings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const theme = BANNER_COLORS.find((c) => c.key === color) ?? BANNER_COLORS[0];

  return (
    <>
      {/* ── Enable toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
        <div className="space-y-0.5">
          <Label className="text-base">Enable Banner</Label>
          <p className="text-sm text-muted-foreground">Show the announcement bar to all visitors.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); mark(); }} />
      </div>

      <Separator />

      {/* ── Message ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="banner-text">Message</Label>
          <span className={cn("text-[11px] tabular-nums", text.length > MAX_CHARS * 0.9 ? "text-rose-500" : text.length > MAX_CHARS * 0.7 ? "text-amber-500" : "text-muted-foreground")}>
            {text.length} / {MAX_CHARS}
          </span>
        </div>
        <Textarea id="banner-text" rows={2} maxLength={MAX_CHARS} value={text} onChange={(e) => { setText(e.target.value); mark(); }} placeholder="🎉 We just launched v2.0 — check out what's new!" className="resize-none" />
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => { setText((t) => t + emoji); mark(); }} className="rounded border bg-muted/40 px-1.5 py-0.5 text-sm hover:bg-muted transition-colors" title={`Insert ${emoji}`}>
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ── CTA link ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="banner-link">CTA Link <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="banner-link" type="url" value={link} onChange={(e) => { setLink(e.target.value); mark(); }} placeholder="https://example.com/blog/v2" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="banner-link-text">CTA Label <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="banner-link-text" value={linkText} onChange={(e) => { setLinkText(e.target.value); mark(); }} placeholder="Learn more →" />
        </div>
      </div>

      {/* ── Color picker ── */}
      <div className="space-y-2">
        <Label>Accent Color</Label>
        <div className="flex flex-wrap gap-2">
          {BANNER_COLORS.map((c) => (
            <button key={c.key} type="button" title={c.label} onClick={() => { setColor(c.key); mark(); }}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all", c.swatch, color === c.key ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105")}
            >
              {color === c.key && <CheckCircle2 className="h-4 w-4 text-white drop-shadow" />}
            </button>
          ))}
          <span className="self-center text-sm text-muted-foreground ml-1">{theme.label}</span>
        </div>
      </div>

      <Separator />

      {/* ── Live preview ── */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          Live Preview
        </Label>
        <div className="overflow-hidden rounded-lg border">
          {text ? (
            <div className={cn("flex items-center justify-between gap-3 px-4 py-2.5 text-sm", theme.bar, theme.text)}>
              <span className="flex-1 text-center leading-snug">
                {text}
                {link && linkText && (
                  <span className={cn("ml-2 font-semibold underline", theme.link)}>{linkText}</span>
                )}
              </span>
              <span className="shrink-0 rounded p-1 opacity-70 cursor-default">✕</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-muted/30 py-4 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Enter a message above to see the preview
            </div>
          )}
        </div>
      </div>

      {/* ── Save ── */}
      <div className="flex items-center justify-between pt-1">
        {dirty ? (
          <p className="text-xs text-amber-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            You have unsaved changes
          </p>
        ) : <span />}
        <Button onClick={() => mutation.mutate({ enabled, text, link, linkText, color })} disabled={mutation.isPending || !dirty} size="sm">
          {mutation.isPending ? "Saving…" : "Save banner"}
        </Button>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.admin.getSystemSettings.useQuery();
  const { data: retention, isLoading: retentionLoading } = trpc.admin.getRetentionSettings.useQuery();
  const { data: banner, isLoading: bannerLoading } = trpc.admin.getBannerSettings.useQuery();

  const updateMutation = trpc.admin.updateSystemSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      utils.admin.getSystemSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure global application behavior and integrations.
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* ── General ─── */}
        <Card>
          <CardHeader>
            <CardTitle>General Configuration</CardTitle>
            <CardDescription>Basic settings for your deployment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-4">
            <div className="space-y-2 opacity-50">
              <Label htmlFor="siteName">Platform Name</Label>
              <Input id="siteName" defaultValue="Code Catch" disabled />
              <p className="text-[10px] text-muted-foreground italic">
                Name configuration is currently locked to project defaults.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground italic">
                  When active, non-admin users will be redirected to the maintenance page.
                </p>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-10 rounded-full" />
              ) : (
                <Switch
                  checked={settings?.maintenanceMode ?? false}
                  onCheckedChange={(checked) => updateMutation.mutate({ maintenanceMode: checked })}
                  disabled={updateMutation.isPending}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Data Retention ── */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention Policies</CardTitle>
            <CardDescription>
              Automatically purge old records to comply with data residency requirements. Set to{" "}
              <span className="font-semibold text-foreground">0</span> to keep data indefinitely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-6">
            {retentionLoading || !retention ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <RetentionForm key={`${retention.reviewRetentionDays}-${retention.auditLogRetentionDays}-${retention.sessionRetentionDays}`} initial={retention} />
            )}
          </CardContent>
        </Card>

        {/* ── Announcement Banner ── */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  Announcement Banner
                </CardTitle>
                <CardDescription>
                  Show a dismissible bar at the top of the landing page for promotions, news, or important notices.
                </CardDescription>
              </div>
              {banner && (
                <Badge
                  variant={banner.enabled ? "default" : "secondary"}
                  className={cn("shrink-0 gap-1.5 text-xs", banner.enabled && "bg-emerald-600 hover:bg-emerald-600/90")}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", banner.enabled ? "bg-white animate-pulse" : "bg-muted-foreground")} />
                  {banner.enabled ? "Live" : "Paused"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-6">
            {bannerLoading || !banner ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <BannerForm key={`${banner.enabled}-${banner.color}`} initial={banner} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

