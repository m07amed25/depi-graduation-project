"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { signOut } from "@/lib/auth-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Sun,
  Code2,
  Bell,
  MonitorSmartphone,
  Trash2,
  Loader2,
  LogOut,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { PreferencesCardContent } from "./preferences-card";
import { SessionsCardContent, SessionsCardHeader } from "./sessions-card";
import { RulesManagerCard } from "./rules-manager-card";
import { NotificationPreferencesContent } from "./notification-preferences-card";
import { PageHeader } from "@/components/page-header";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";

export function SettingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const { data: sessions, isLoading: sessionsLoading } =
    trpc.settings.getSessions.useQuery();
  const { data: prefs, isLoading: prefsLoading } =
    trpc.settings.getPreferences.useQuery();

  const revokeSession = trpc.settings.revokeSession.useMutation({
    onSuccess: () => {
      void utils.settings.getSessions.invalidate();
      setMessage("Session revoked successfully.");
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const revokeAll = trpc.settings.revokeAllOtherSessions.useMutation({
    onSuccess: (data) => {
      void utils.settings.getSessions.invalidate();
      setMessage(
        `Revoked ${data.revoked} session${data.revoked !== 1 ? "s" : ""}.`,
      );
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const deleteAccount = trpc.settings.deleteAccount.useMutation({
    onSuccess: async () => {
      await signOut();
      router.push("/");
    },
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const updatePreferencesMutation = trpc.settings.updatePreferences.useMutation(
    {
      onSuccess: () => {
        void utils.settings.getPreferences.invalidate();
        setMessage("Preferences saved.");
        setTimeout(() => setMessage(null), 3000);
      },
      onError: (err) => {
        setError(err.message);
        setTimeout(() => setError(null), 5000);
      },
    },
  );

  const updatePref = useCallback(
    (key: string, value: string | boolean) => {
      updatePreferencesMutation.mutate({ [key]: value });
    },
    [updatePreferencesMutation],
  );

  const otherSessions = sessions?.filter((s) => !s.isCurrent) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        icon={<Settings className="size-4.5 text-primary" />}
        title="Settings"
        description="Manage your app preferences, sessions, and account."
      />

      {message && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          <X className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-md w-full justify-start">
          <TabsTrigger value="general" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 text-sm">
            <Sun className="size-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="code-review" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 text-sm">
            <Code2 className="size-3.5" />
            Code Review
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 text-sm">
            <Bell className="size-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 text-sm">
            <MonitorSmartphone className="size-3.5" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="danger" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 text-sm text-destructive data-[state=active]:text-destructive">
            <AlertTriangle className="size-3.5" />
            Danger
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="outline-none space-y-4">
          <div className="rounded-md border border-border p-4">
            <h3 className="text-[0.9375rem] font-semibold mb-1">Appearance</h3>
            <p className="text-sm text-muted-foreground mb-4">Choose how the app looks. Syncs across all tabs.</p>
            <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">Cycle through light, dark, and system.</p>
              </div>
              <ThemeTogglerButton variant="outline" size="lg" className="shrink-0" />
            </div>
          </div>
        </TabsContent>

        {/* Code Review Tab */}
        <TabsContent value="code-review" className="outline-none space-y-5">
          <div className="rounded-md border border-border p-4">
            <h3 className="text-[0.9375rem] font-semibold mb-1">Review Preferences</h3>
            <p className="text-sm text-muted-foreground mb-4">Default behavior for AI-powered code reviews.</p>
            <PreferencesCardContent
              prefs={prefs as Parameters<typeof PreferencesCardContent>[0]["prefs"]}
              prefsLoading={prefsLoading}
              updatePref={updatePref}
            />
          </div>
          <RulesManagerCard />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="outline-none">
          <NotificationPreferencesContent />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="outline-none space-y-4">
          <div className="rounded-md border border-border p-4">
            <SessionsCardHeader
              sessions={sessions}
              otherSessions={otherSessions}
              onRevokeAll={() => revokeAll.mutate()}
              revokeAllPending={revokeAll.isPending}
            />
            <div className="mt-4 space-y-3">
              <SessionsCardContent
                sessions={sessions}
                sessionsLoading={sessionsLoading}
                onRevokeTarget={setRevokeTarget}
              />
            </div>
          </div>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="outline-none">
          <div className="rounded-md border border-destructive/30 p-4">
            <h3 className="text-[0.9375rem] font-semibold text-destructive flex items-center gap-2 mb-1">
              <AlertTriangle className="size-4" />
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Irreversible actions. Proceed with caution.</p>
            <div className="flex items-center justify-between p-3 rounded-md border border-destructive/20 bg-destructive/5">
              <div>
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently delete your account, repositories, and all review data.</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Revoke Session Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of that device. You will need to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (revokeTarget) {
                  revokeSession.mutate({ sessionId: revokeTarget });
                  setRevokeTarget(null);
                }
              }}
            >
              {revokeSession.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <LogOut className="size-4 mr-2" />
              )}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setDeleteConfirm("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-muted-foreground text-sm space-y-3">
                <span>This action is permanent and irreversible. All your data will be deleted:</span>
                <ul className="list-disc list-inside space-y-1">
                  <li>Profile and personal information</li>
                  <li>Connected repositories</li>
                  <li>All code review history</li>
                  <li>Connected accounts and sessions</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm" className="text-sm">Type DELETE to confirm</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteAccount.mutate({ confirmation: "DELETE" })}
              disabled={deleteConfirm !== "DELETE" || deleteAccount.isPending}
            >
              {deleteAccount.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="size-4 mr-2" />
              )}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
