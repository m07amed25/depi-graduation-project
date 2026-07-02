"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  UserPlus,
  UserCog,
  FileCheck,
  FileX,
  Clock,
  GitPullRequest,
  ThumbsUp,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type FilterType = "all" | "unread" | "read";
export type NotificationType =
  | "all"
  | "TEAM_INVITE"
  | "TEAM_MEMBER_ADDED"
  | "REVIEW_COMPLETED"
  | "REVIEW_FAILED"
  | "SCHEDULED_SCAN_COMPLETED"
  | "REVIEW_ASSIGNED"
  | "REVIEW_APPROVED"
  | "REVIEW_CHANGES_REQUESTED";

export const notificationTypeLabels: Record<string, string> = {
  all: "All Types",
  TEAM_INVITE: "Team Invites",
  TEAM_MEMBER_ADDED: "Team Members",
  REVIEW_COMPLETED: "Reviews Completed",
  REVIEW_FAILED: "Reviews Failed",
  SCHEDULED_SCAN_COMPLETED: "Scheduled Scans",
  REVIEW_ASSIGNED: "Review Assignments",
  REVIEW_APPROVED: "Reviews Approved",
  REVIEW_CHANGES_REQUESTED: "Changes Requested",
};

function extractInviteToken(link: string): string | null {
  try {
    const url = new URL(link, "http://localhost");
    return url.searchParams.get("token");
  } catch {
    return null;
  }
}

export function TeamInviteActions({
  link,
  onDone,
}: {
  link: string;
  onDone: () => void;
}) {
  const token = extractInviteToken(link);
  const utils = trpc.useUtils();
  const router = useRouter();

  const invalidate = () => {
    utils.notification.unreadCount.invalidate();
    utils.notification.list.invalidate();
  };

  const accept = trpc.team.acceptTeamInvite.useMutation({
    onSuccess: () => {
      toast.success("You've joined the team!");
      invalidate();
      onDone();
      router.push("/teams");
    },
    onError: (err) => toast.error(err.message || "Failed to accept invite"),
  });

  const decline = trpc.team.declineTeamInvite.useMutation({
    onSuccess: () => {
      toast.info("Invite declined");
      invalidate();
      onDone();
    },
    onError: (err) => toast.error(err.message || "Failed to decline invite"),
  });

  if (!token) {
    return (
      <Link
        href={link}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        onClick={onDone}
      >
        <span>View invite</span>
        <ExternalLink className="size-3" />
      </Link>
    );
  }

  const isPending = accept.isPending || decline.isPending;

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          accept.mutate({ token });
        }}
        className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {accept.isPending && <Loader2 className="size-3 animate-spin" />}
        <span>Accept</span>
      </button>
      <button
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          decline.mutate({ token });
        }}
        className="flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
      >
        {decline.isPending && <Loader2 className="size-3 animate-spin" />}
        <span>Decline</span>
      </button>
    </div>
  );
}

export function getNotificationIcon(type: string) {
  const iconClass = "size-4";
  switch (type) {
    case "TEAM_INVITE":
      return <UserPlus className={cn(iconClass, "text-blue-500")} />;
    case "TEAM_MEMBER_ADDED":
      return <UserCog className={cn(iconClass, "text-primary")} />;
    case "REVIEW_COMPLETED":
      return <FileCheck className={cn(iconClass, "text-emerald-500")} />;
    case "REVIEW_FAILED":
      return <FileX className={cn(iconClass, "text-red-500")} />;
    case "SCHEDULED_SCAN_COMPLETED":
      return <Clock className={cn(iconClass, "text-purple-500")} />;
    case "REVIEW_ASSIGNED":
      return <GitPullRequest className={cn(iconClass, "text-amber-500")} />;
    case "REVIEW_APPROVED":
      return <ThumbsUp className={cn(iconClass, "text-green-500")} />;
    case "REVIEW_CHANGES_REQUESTED":
      return <AlertTriangle className={cn(iconClass, "text-orange-500")} />;
    default:
      return <Bell className={cn(iconClass, "text-muted-foreground")} />;
  }
}

export function formatTime(date: Date | string) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
