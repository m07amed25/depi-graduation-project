"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Save, Loader2, Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

interface NotificationPreferences {
  emailNotifications: boolean;
  teamInvites: boolean;
  teamMemberAdded: boolean;
  reviewCompleted: boolean;
  reviewFailed: boolean;
  scheduledScanCompleted: boolean;
  reviewAssigned: boolean;
  reviewApproved: boolean;
  reviewChangesRequested: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  teamInvites: true,
  teamMemberAdded: true,
  reviewCompleted: true,
  reviewFailed: true,
  scheduledScanCompleted: false,
  reviewAssigned: true,
  reviewApproved: true,
  reviewChangesRequested: true,
  soundEnabled: false,
  desktopNotifications: true,
};

export function NotificationPreferencesCard() {
  return (
    <Card id="notifications">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="size-4" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you want to receive via email and in-app
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <NotificationPreferencesContent />
      </CardContent>
    </Card>
  );
}

export function NotificationPreferencesContent() {
  // Load preferences
  const { data: preferencesData, isLoading } =
    trpc.settings.getNotificationPreferences.useQuery();

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize local state once when data loads
  if (preferencesData && !isInitialized) {
    setPreferences(preferencesData as NotificationPreferences);
    setIsInitialized(true);
  }

  const utils = trpc.useUtils();

  // Save preferences mutation
  const savePreferences = trpc.settings.updateNotificationPreferences.useMutation(
    {
      onSuccess: () => {
        setMessage("Notification preferences saved successfully");
        setHasChanges(false);
        setTimeout(() => setMessage(null), 3000);
        void utils.settings.getNotificationPreferences.invalidate();
        toast.success("Preferences saved");
      },
      onError: (err) => {
        setError(err.message || "Failed to save preferences");
        setTimeout(() => setError(null), 5000);
        toast.error("Failed to save preferences");
      },
    }
  );

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = () => {
    savePreferences.mutate(preferences);
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "granted") {
      toast.info("Desktop notifications are already enabled");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error("Notification permission was denied. Please enable it in your browser settings.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Desktop notifications enabled");
      // Show a test notification
      new Notification("Code Catch", {
        body: "You'll now receive desktop notifications for important events",
        icon: "/favicon.ico",
      });
    } else {
      toast.error("Notification permission was denied");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border p-4">
      <h3 className="text-[0.9375rem] font-semibold mb-1">Notification Preferences</h3>
      <p className="text-sm text-muted-foreground mb-4">Choose which notifications you receive via email and in-app.</p>
        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
            <Check className="size-4 shrink-0" />
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            <X className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* General Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notification emails for important events
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleToggle("emailNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="desktopNotifications" className="text-sm font-medium">
                  Desktop Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show browser notifications when the app is open
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="desktopNotifications"
                  checked={preferences.desktopNotifications}
                  onCheckedChange={() => handleToggle("desktopNotifications")}
                />
                {preferences.desktopNotifications && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestNotificationPermission}
                    className="text-xs"
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="soundEnabled" className="text-sm font-medium">
                  Sound Effects
                </Label>
                <p className="text-xs text-muted-foreground">
                  Play a sound when new notifications arrive
                </p>
              </div>
              <Switch
                id="soundEnabled"
                checked={preferences.soundEnabled}
                onCheckedChange={() => handleToggle("soundEnabled")}
              />
            </div>
          </div>

          <Separator />

          {/* Team Notifications */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Team Activity</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="teamInvites" className="text-sm font-medium">
                  Team Invitations
                </Label>
                <p className="text-xs text-muted-foreground">
                  When you&apos;re invited to join a team
                </p>
              </div>
              <Switch
                id="teamInvites"
                checked={preferences.teamInvites}
                onCheckedChange={() => handleToggle("teamInvites")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="teamMemberAdded" className="text-sm font-medium">
                  Team Member Added
                </Label>
                <p className="text-xs text-muted-foreground">
                  When new members join your team
                </p>
              </div>
              <Switch
                id="teamMemberAdded"
                checked={preferences.teamMemberAdded}
                onCheckedChange={() => handleToggle("teamMemberAdded")}
              />
            </div>
          </div>

          <Separator />

          {/* Review Notifications */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Code Reviews</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reviewAssigned" className="text-sm font-medium">
                  Review Assigned
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a review is assigned to you
                </p>
              </div>
              <Switch
                id="reviewAssigned"
                checked={preferences.reviewAssigned}
                onCheckedChange={() => handleToggle("reviewAssigned")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reviewCompleted" className="text-sm font-medium">
                  Review Completed
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a code review finishes successfully
                </p>
              </div>
              <Switch
                id="reviewCompleted"
                checked={preferences.reviewCompleted}
                onCheckedChange={() => handleToggle("reviewCompleted")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reviewFailed" className="text-sm font-medium">
                  Review Failed
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a review encounters an error
                </p>
              </div>
              <Switch
                id="reviewFailed"
                checked={preferences.reviewFailed}
                onCheckedChange={() => handleToggle("reviewFailed")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reviewApproved" className="text-sm font-medium">
                  Review Approved
                </Label>
                <p className="text-xs text-muted-foreground">
                  When your code is approved
                </p>
              </div>
              <Switch
                id="reviewApproved"
                checked={preferences.reviewApproved}
                onCheckedChange={() => handleToggle("reviewApproved")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reviewChangesRequested" className="text-sm font-medium">
                  Changes Requested
                </Label>
                <p className="text-xs text-muted-foreground">
                  When changes are requested on your review
                </p>
              </div>
              <Switch
                id="reviewChangesRequested"
                checked={preferences.reviewChangesRequested}
                onCheckedChange={() => handleToggle("reviewChangesRequested")}
              />
            </div>
          </div>

          <Separator />

          {/* Automated Notifications */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Automated Scans</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="scheduledScanCompleted" className="text-sm font-medium">
                  Scheduled Scan Completed
                </Label>
                <p className="text-xs text-muted-foreground">
                  When automated repository scans finish
                </p>
              </div>
              <Switch
                id="scheduledScanCompleted"
                checked={preferences.scheduledScanCompleted}
                onCheckedChange={() => handleToggle("scheduledScanCompleted")}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || savePreferences.isPending}
              className="gap-2"
            >
              {savePreferences.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Preferences
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
    </div>
  );
}
