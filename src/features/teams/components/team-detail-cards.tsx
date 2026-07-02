"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  ClipboardList,
  Clock,
  Crown,
  FolderGit2,
  MoreVertical,
  Share2,
  Shield,
  Trash2,
  Unlink,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function formatActionType(type: string): string {
  return type
    .replace("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

const roleIcon = { OWNER: Crown, ADMIN: Shield, MEMBER: User } as const;
const roleColor = {
  OWNER: "text-amber-500",
  ADMIN: "text-blue-500",
  MEMBER: "text-muted-foreground",
} as const;

interface PendingAction {
  id: string;
  actionType: string;
  metadata?: unknown;
  createdAt: Date | string;
}

interface PendingApprovalsCardProps {
  teamId: string;
  pendingActions: { data?: PendingAction[]; isLoading: boolean };
  approveAction: {
    mutate: (args: { actionId: string }) => void;
    isPending: boolean;
  };
  rejectAction: {
    mutate: (args: { actionId: string }) => void;
    isPending: boolean;
  };
}

export function PendingApprovalsCard({
  teamId: _teamId, // eslint-disable-line @typescript-eslint/no-unused-vars
  pendingActions,
  approveAction,
  rejectAction,
}: PendingApprovalsCardProps) {
  return (
    <Card className="rounded-lg border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="size-4 text-amber-500" />
            Pending Approvals
          </CardTitle>
          <CardDescription className="mt-1.5 text-sm">
            {pendingActions.data?.length ?? 0} action
            {(pendingActions.data?.length ?? 0) !== 1 ? "s" : ""} awaiting
            approval
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 relative z-10">
        {pendingActions.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : !pendingActions.data?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <ClipboardList className="size-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">
              No pending approvals
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All action requests have been processed.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingActions.data.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatActionType(action.actionType)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requested by user •{" "}
                      {new Date(action.createdAt).toLocaleDateString()}
                    </p>
                    {action.metadata !== undefined &&
                      action.metadata !== null && (
                        <p className="text-[10px] text-muted-foreground mt-1.5 bg-background p-1.5 rounded border border-border/50 font-mono">
                          {JSON.stringify(
                            action.metadata as Record<string, unknown>,
                          )}
                        </p>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-green-600 hover:text-green-700 hover:bg-green-600/10"
                    onClick={() =>
                      approveAction.mutate({ actionId: action.id })
                    }
                    disabled={approveAction.isPending}
                    title="Approve"
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => rejectAction.mutate({ actionId: action.id })}
                    disabled={rejectAction.isPending}
                    title="Reject"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MyRequest {
  id: string;
  actionType: string;
  status: string;
  createdAt: Date | string;
}

interface MyRequestsCardProps {
  myRequests: { data?: MyRequest[]; isLoading: boolean };
  isOwnerOrAdmin: boolean;
  onRequestAction: () => void;
}

export function MyRequestsCard({
  myRequests,
  isOwnerOrAdmin,
  onRequestAction,
}: MyRequestsCardProps) {
  return (
    <Card className="rounded-lg border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="size-4 text-blue-500" />
            My Requests
          </CardTitle>
          <CardDescription className="mt-1.5 text-sm">
            {myRequests.data?.length ?? 0} of your request
            {(myRequests.data?.length ?? 0) !== 1 ? "s" : ""}
          </CardDescription>
        </div>
        {!isOwnerOrAdmin && (
          <Button size="sm" onClick={onRequestAction} variant="secondary">
            <UserPlus className="size-4 mr-2" />
            Request Action
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 relative z-10">
        {myRequests.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : !myRequests.data?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <ClipboardList className="size-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">
              No pending requests
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isOwnerOrAdmin
                ? "You don't have any pending action requests"
                : "Request an action that requires admin approval"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {myRequests.data.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  {request.status === "PENDING" ? (
                    <Clock className="size-4 text-amber-500 shrink-0" />
                  ) : request.status === "APPROVED" ? (
                    <Check className="size-4 text-green-500 shrink-0" />
                  ) : (
                    <X className="size-4 text-red-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {formatActionType(request.actionType)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    request.status === "APPROVED"
                      ? "default"
                      : request.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TeamMember {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; image?: string | null };
}

interface MembersCardProps {
  members: TeamMember[];
  isOwnerOrAdmin: boolean;
  isOwner: boolean;
  onInvite: () => void;
  updateRole: {
    mutate: (args: {
      teamId: string;
      userId: string;
      role: "ADMIN" | "MEMBER";
    }) => void;
    isPending: boolean;
  };
  removeMember: {
    mutate: (args: { teamId: string; userId: string }) => void;
    isPending: boolean;
  };
  teamId: string;
}

export function MembersCard({
  members,
  isOwnerOrAdmin,
  isOwner,
  onInvite,
  updateRole,
  removeMember,
  teamId,
}: MembersCardProps) {
  return (
    <Card className="rounded-lg border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4" />
            Members
          </CardTitle>
          <CardDescription className="mt-1.5 text-sm">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </CardDescription>
        </div>
        {isOwnerOrAdmin && (
          <Button size="sm" onClick={onInvite} className="shadow-none">
            <UserPlus className="size-4 mr-2" />
            Invite
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0 relative z-10">
        <div className="divide-y divide-border/40">
          {members.map((member) => {
            const RoleIcon =
              roleIcon[member.role as keyof typeof roleIcon] ?? User;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={member.user.image ?? undefined}
                      alt={member.user.name}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {member.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-foreground">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      roleColor[member.role as keyof typeof roleColor],
                    )}
                  >
                    <RoleIcon className="size-3 mr-1" />
                    {member.role}
                  </Badge>
                  {isOwner && member.role !== "OWNER" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7" aria-label="Member actions">
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            updateRole.mutate({
                              teamId,
                              userId: member.user.id,
                              role:
                                member.role === "ADMIN" ? "MEMBER" : "ADMIN",
                            })
                          }
                        >
                          <Shield className="size-4 mr-2" />
                          {member.role === "ADMIN"
                            ? "Demote to Member"
                            : "Promote to Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            removeMember.mutate({
                              teamId,
                              userId: member.user.id,
                            })
                          }
                        >
                          <Trash2 className="size-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface SharedRepo {
  id: string;
  fullName: string;
  private: boolean;
}

interface ReposCardProps {
  repos: SharedRepo[];
  isOwnerOrAdmin: boolean;
  onShare: () => void;
  unshareRepo: {
    mutate: (args: { repositoryId: string }) => void;
    isPending: boolean;
  };
}

export function SharedReposCard({
  repos,
  isOwnerOrAdmin,
  onShare,
  unshareRepo,
}: ReposCardProps) {
  return (
    <Card className="rounded-lg border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderGit2 className="size-4 text-emerald-500" />
            Shared Repositories
          </CardTitle>
          <CardDescription className="mt-1.5 text-sm">
            Repositories visible to all team members
          </CardDescription>
        </div>
        {isOwnerOrAdmin && (
          <Button size="sm" onClick={onShare} variant="outline">
            <Share2 className="size-4 mr-2" />
            Share Repo
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0 relative z-10">
        {repos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center h-full">
            <FolderGit2 className="size-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">
              No repositories yet
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-62.5">
              Share a repository to collaborate on code reviews.
            </p>
          </div>
        )}
        <div className="divide-y divide-border/40">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group/repo"
            >
              <Link
                href={`/repo/${repo.id}`}
                className="flex items-center gap-3 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <FolderGit2 className="size-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground group-hover/repo:text-emerald-600 dark:group-hover/repo:text-emerald-400 transition-colors">
                    {repo.fullName}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1.5 text-[10px] px-2 py-0.5 bg-muted-foreground/10 text-muted-foreground font-semibold rounded"
                  >
                    {repo.private ? "Private" : "Public"}
                  </Badge>
                </div>
              </Link>
              {isOwnerOrAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/repo:opacity-100 transition-all focus:opacity-100"
                  onClick={() => unshareRepo.mutate({ repositoryId: repo.id })}
                  title="Unshare repository"
                >
                  <Unlink className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface PendingInvite {
  token: string;
  role: string;
  expiresAt: Date | string;
  invitee: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  inviter: { id: string; name: string | null } | null;
}

interface PendingInvitesCardProps {
  invites: { data?: PendingInvite[]; isLoading: boolean };
  isOwnerOrAdmin: boolean;
  cancelInvite: {
    mutate: (args: { token: string }) => void;
    isPending: boolean;
  };
}

export function PendingInvitesCard({
  invites,
  isOwnerOrAdmin,
  cancelInvite,
}: PendingInvitesCardProps) {
  const count = invites.data?.length ?? 0;

  return (
    <Card className="rounded-lg border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="size-4 text-blue-500" />
            Pending Invites
          </CardTitle>
          <CardDescription className="mt-1.5 text-sm">
            {count} invite{count !== 1 ? "s" : ""} awaiting acceptance
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 relative z-10">
        {invites.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserPlus className="size-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">
              No pending invites
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All invitations have been accepted or have expired.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {invites.data!.map((invite) => {
              const initials =
                invite.invitee?.name?.charAt(0).toUpperCase() ?? "?";
              const expiresMs = new Date(invite.expiresAt).getTime();
              const nowMs = new Date().getTime();
              const daysLeft = Math.ceil((expiresMs - nowMs) / 86_400_000);
              return (
                <div
                  key={invite.token}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      {invite.invitee?.image && (
                        <AvatarImage src={invite.invitee.image} />
                      )}
                      <AvatarFallback className="bg-blue-500/10 text-blue-600 text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {invite.invitee?.name ??
                          invite.invitee?.email ??
                          "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invite.invitee?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            invite.role === "ADMIN"
                              ? "text-blue-500 border-blue-500/30"
                              : "text-muted-foreground",
                          )}
                        >
                          {invite.role}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          by {invite.inviter?.name ?? "admin"} · expires in{" "}
                          {daysLeft}d
                        </span>
                      </div>
                    </div>
                  </div>
                  {isOwnerOrAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      title="Cancel invite"
                      disabled={cancelInvite.isPending}
                      onClick={() =>
                        cancelInvite.mutate({ token: invite.token })
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
