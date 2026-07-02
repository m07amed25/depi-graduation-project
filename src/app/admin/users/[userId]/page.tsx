"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SelectRoot,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Github,
  Calendar,
  Shield,
  GitBranch,
  FileCode,
  Users,
  Monitor,
  Save,
  Pencil,
  X,
} from "lucide-react";
import Link from "next/link";

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { data: user, isLoading, refetch } = trpc.admin.getUser.useQuery({ userId });
  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => { toast.success("User updated"); setEditing(false); void refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    name: "",
    email: "",
    role: "USER",
    planId: "free",
    planExpiresAt: "",
    banned: false,
    bannedReason: "",
    reviewDepth: "standard",
    defaultLanguage: "auto",
    autoReview: false,
    includeSecurityChecks: true,
    includePerfSuggestions: true,
    overrideReposLimit: "",
    overrideReviewsLimit: "",
    overrideSeatsLimit: "",
    desktopNotifications: true,
    emailNotifications: true,
    notificationSoundEnabled: false,
    pendingPlanId: "none",
    pendingBillingCycle: "monthly",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email,
        role: user.role,
        planId: user.planId,
        planExpiresAt: user.planExpiresAt ? new Date(user.planExpiresAt).toISOString().split("T")[0] : "",
        banned: user.banned,
        bannedReason: user.bannedReason ?? "",
        reviewDepth: user.reviewDepth,
        defaultLanguage: user.defaultLanguage,
        autoReview: user.autoReview,
        includeSecurityChecks: user.includeSecurityChecks,
        includePerfSuggestions: user.includePerfSuggestions,
        overrideReposLimit: user.overrideReposLimit ?? "",
        overrideReviewsLimit: user.overrideReviewsLimit ?? "",
        overrideSeatsLimit: user.overrideSeatsLimit ?? "",
        desktopNotifications: user.desktopNotifications,
        emailNotifications: user.emailNotifications,
        notificationSoundEnabled: user.notificationSoundEnabled,
        pendingPlanId: user.pendingPlanId ?? "none",
        pendingBillingCycle: user.pendingBillingCycle ?? "monthly",
      });
    }
  }, [user]);

  const handleSave = () => {
    updateUser.mutate({
      userId,
      name: form.name || undefined,
      email: form.email || undefined,
      role: form.role,
      planId: form.planId,
      planExpiresAt: form.planExpiresAt ? new Date(form.planExpiresAt) : null,
      banned: form.banned,
      bannedReason: form.bannedReason || null,
      reviewDepth: form.reviewDepth,
      defaultLanguage: form.defaultLanguage,
      autoReview: form.autoReview,
      includeSecurityChecks: form.includeSecurityChecks,
      includePerfSuggestions: form.includePerfSuggestions,
      overrideReposLimit: form.overrideReposLimit !== "" ? Number(form.overrideReposLimit) : null,
      overrideReviewsLimit: form.overrideReviewsLimit !== "" ? Number(form.overrideReviewsLimit) : null,
      overrideSeatsLimit: form.overrideSeatsLimit !== "" ? Number(form.overrideSeatsLimit) : null,
      desktopNotifications: form.desktopNotifications,
      emailNotifications: form.emailNotifications,
      notificationSoundEnabled: form.notificationSoundEnabled,
      pendingPlanId: form.pendingPlanId === "none" ? null : form.pendingPlanId,
      pendingBillingCycle:
        form.pendingPlanId !== "none" && form.pendingPlanId !== "free" ? form.pendingBillingCycle : null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Users
          </Link>
        </Button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="mr-1 h-4 w-4" />Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateUser.isPending}>
                <Save className="mr-1 h-4 w-4" />Save
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-4 w-4" />Edit
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
              <AvatarFallback className="text-lg">
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <CardTitle className="text-xl">{user.name ?? "(no name)"}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
                {user.banned && <Badge variant="destructive">Banned</Badge>}
                {user.emailVerified && <Badge variant="outline">Verified</Badge>}
                <Badge variant="secondary">{user.planId?.toUpperCase()}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-muted-foreground" /><strong>{user._count.repositories}</strong> Repos</div>
            <div className="flex items-center gap-2"><FileCode className="h-4 w-4 text-muted-foreground" /><strong>{user._count.reviews}</strong> Reviews</div>
            <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-muted-foreground" /><strong>{user._count.sessions}</strong> Sessions</div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Fields */}
      <Card>
        <CardHeader><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} disabled={!editing} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email} disabled={!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <SelectRoot value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectRoot>
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <SelectRoot value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectRoot>
          </div>
          <div className="space-y-1.5">
            <Label>Plan Expires At</Label>
            <Input type="date" value={form.planExpiresAt} disabled={!editing} onChange={(e) => setForm({ ...form, planExpiresAt: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Scheduled Change (pending)</Label>
            <SelectRoot value={form.pendingPlanId} onValueChange={(v) => setForm({ ...form, pendingPlanId: v })}>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="free">Cancel → Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectRoot>
          </div>
          {form.pendingPlanId !== "none" && form.pendingPlanId !== "free" && (
            <div className="space-y-1.5">
              <Label>Pending Cycle</Label>
              <SelectRoot value={form.pendingBillingCycle} onValueChange={(v) => setForm({ ...form, pendingBillingCycle: v })}>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectRoot>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Ban Reason</Label>
            <Input value={form.bannedReason} disabled={!editing} onChange={(e) => setForm({ ...form, bannedReason: e.target.value })} placeholder="Optional" />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Banned</Label>
            <Switch checked={form.banned} disabled={!editing} onCheckedChange={(v) => setForm({ ...form, banned: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader><CardTitle className="text-base">Limits Override</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Repos Limit</Label>
            <Input type="number" value={form.overrideReposLimit} disabled={!editing} onChange={(e) => setForm({ ...form, overrideReposLimit: e.target.value })} placeholder="Plan default" />
          </div>
          <div className="space-y-1.5">
            <Label>Reviews Limit</Label>
            <Input type="number" value={form.overrideReviewsLimit} disabled={!editing} onChange={(e) => setForm({ ...form, overrideReviewsLimit: e.target.value })} placeholder="Plan default" />
          </div>
          <div className="space-y-1.5">
            <Label>Seats Limit</Label>
            <Input type="number" value={form.overrideSeatsLimit} disabled={!editing} onChange={(e) => setForm({ ...form, overrideSeatsLimit: e.target.value })} placeholder="Plan default" />
          </div>
        </CardContent>
      </Card>

      {/* Review Settings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Review Settings</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Review Depth</Label>
            <SelectRoot value={form.reviewDepth} onValueChange={(v) => setForm({ ...form, reviewDepth: v })}>
              <SelectItem value="quick">Quick</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="deep">Deep</SelectItem>
            </SelectRoot>
          </div>
          <div className="space-y-1.5">
            <Label>Default Language</Label>
            <Input value={form.defaultLanguage} disabled={!editing} onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Auto Review</Label>
            <Switch checked={form.autoReview} disabled={!editing} onCheckedChange={(v) => setForm({ ...form, autoReview: v })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Security Checks</Label>
            <Switch checked={form.includeSecurityChecks} disabled={!editing} onCheckedChange={(v) => setForm({ ...form, includeSecurityChecks: v })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Performance Suggestions</Label>
            <Switch checked={form.includePerfSuggestions} disabled={!editing} onCheckedChange={(v) => setForm({ ...form, includePerfSuggestions: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Desktop Notifications</Label>
            <Switch checked={form.desktopNotifications} disabled={!editing} onCheckedChange={(v) => setForm({ ...form, desktopNotifications: v })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Email Notifications</Label>
            <Switch checked={form.emailNotifications} disabled={!editing} onCheckedChange={(v) => setForm({ ...form, emailNotifications: v })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Notification Sound</Label>
            <Switch checked={form.notificationSoundEnabled} disabled={!editing} onCheckedChange={(v) => setForm({ ...form, notificationSoundEnabled: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Teams */}
      {user.teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />Teams ({user.teamMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {user.teamMembers.map((tm) => (
                <div key={tm.team.id} className="flex items-center justify-between px-6 py-3">
                  <span className="font-medium">{tm.team.name}</span>
                  <Badge variant="outline">{tm.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repositories */}
      {user.repositories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Github className="h-4 w-4" />Recent Repositories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {user.repositories.map((repo) => (
                <div key={repo.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <span className="font-medium">{repo.fullName}</span>
                    {repo.private && <Badge variant="outline" className="ml-2 text-xs">Private</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">{repo._count.reviews} reviews</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {user.reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {user.reviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <span className="font-medium">{review.prTitle ?? "Untitled"}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{review.status}</Badge>
                      {review.riskScore !== null && (
                        <span className="text-xs text-muted-foreground">Risk: {review.riskScore}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
