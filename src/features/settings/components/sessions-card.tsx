"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, LogOut, MonitorSmartphone, X } from "lucide-react";
import { formatRelative, parseUserAgent } from "../lib/helpers";

interface Session {
  id: string;
  isCurrent: boolean;
  userAgent: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
}

interface SessionsCardContentProps {
  sessions: Session[] | undefined;
  sessionsLoading: boolean;
  onRevokeTarget: (id: string) => void;
}

interface SessionsCardHeaderProps {
  sessions: Session[] | undefined;
  otherSessions: Session[];
  onRevokeAll: () => void;
  revokeAllPending: boolean;
}

const SESSION_PREVIEW_COUNT = 3;

export function SessionsCardHeader({
  sessions,
  otherSessions,
  onRevokeAll,
  revokeAllPending,
}: SessionsCardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-base font-semibold flex items-center gap-2">
          <MonitorSmartphone className="size-4" />
          Active Sessions
        </p>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
          Devices where you&apos;re currently signed in.
          {sessions && sessions.length > 0 && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {sessions.length} active
            </Badge>
          )}
        </p>
      </div>
      {otherSessions.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={onRevokeAll}
          disabled={revokeAllPending}
        >
          {revokeAllPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LogOut className="size-3.5" />
          )}
          Sign out all others
        </Button>
      )}
    </div>
  );
}

export function SessionsCardContent({
  sessions,
  sessionsLoading,
  onRevokeTarget,
}: SessionsCardContentProps) {
  const [showAllSessions, setShowAllSessions] = useState(false);
  const visibleSessions = showAllSessions
    ? (sessions ?? [])
    : (sessions ?? []).slice(0, SESSION_PREVIEW_COUNT);
  const hiddenCount = (sessions?.length ?? 0) - SESSION_PREVIEW_COUNT;

  if (sessionsLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No active sessions found.
      </p>
    );
  }

  return (
    <>
      <div
        className={`space-y-3 ${showAllSessions && sessions.length > SESSION_PREVIEW_COUNT ? "max-h-105 overflow-y-auto pr-1 scrollbar-thin" : ""}`}
      >
        {visibleSessions.map((session) => {
          const {
            browser,
            os,
            icon: DeviceIcon,
          } = parseUserAgent(session.userAgent);
          return (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${session.isCurrent ? "bg-primary/5 border-primary/20" : "bg-card"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex items-center justify-center size-10 rounded-lg ${session.isCurrent ? "bg-primary/10" : "bg-muted"}`}
                >
                  <DeviceIcon
                    className={`size-5 ${session.isCurrent ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {browser} on {os}
                    </p>
                    {session.isCurrent && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 text-primary bg-primary/10"
                      >
                        This device
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {session.ipAddress && <span>{session.ipAddress}</span>}
                    <span>·</span>
                    <span>Active {formatRelative(session.createdAt)}</span>
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 shrink-0"
                  onClick={() => onRevokeTarget(session.id)}
                  title="Revoke session"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground gap-2 mt-1"
          onClick={() => setShowAllSessions(!showAllSessions)}
        >
          {showAllSessions
            ? "Show less"
            : `Show ${hiddenCount} more session${hiddenCount !== 1 ? "s" : ""}`}
        </Button>
      )}
    </>
  );
}
