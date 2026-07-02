"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  InviteMemberDialog,
  ShareRepoDialog,
  RequestActionDialog,
} from "./team-detail-dialogs";
import {
  PendingApprovalsCard,
  MyRequestsCard,
  MembersCard,
  SharedReposCard,
  PendingInvitesCard,
} from "./team-detail-cards";
import { toast } from "sonner";

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();

  const [inviting, setInviting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requestActionDialogOpen, setRequestActionDialogOpen] = useState(false);

  const team = trpc.team.get.useQuery({ teamId });
  const pendingActions = trpc.team.getPendingActions.useQuery(
    { teamId },
    { enabled: !!team.data && (team.data.currentUserRole === "OWNER" || team.data.currentUserRole === "ADMIN") }
  );
  const myRequests = trpc.team.getMyRequestedActions.useQuery({ teamId }, { enabled: !!team.data });
  const pendingInvites = trpc.team.getPendingInvites.useQuery(
    { teamId },
    { enabled: !!team.data && (team.data.currentUserRole === "OWNER" || team.data.currentUserRole === "ADMIN") }
  );
  const myRepos = trpc.repository.list.useQuery(undefined, { enabled: !!team.data });
  const utils = trpc.useUtils();

  const inviteMember = trpc.team.inviteMember.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent");
      utils.team.get.invalidate({ teamId });
      utils.team.getPendingInvites.invalidate({ teamId });
    },
    onError: (err) => toast.error(err.message),
  });
  const requestAction = trpc.team.requestAction.useMutation({
    onSuccess: (data) => {
      if (data.requiresApproval) {
        toast.info("Request submitted for approval");
      } else {
        toast.success("Action performed");
      }
      utils.team.getPendingActions.invalidate({ teamId });
      utils.team.get.invalidate({ teamId });
    },
    onError: (err) => toast.error(err.message),
  });
  const approveAction = trpc.team.approveAction.useMutation({
    onSuccess: () => {
      toast.success("Action approved");
      utils.team.getPendingActions.invalidate({ teamId });
      utils.team.get.invalidate({ teamId });
    },
    onError: (err) => toast.error(err.message),
  });
  const rejectAction = trpc.team.rejectAction.useMutation({
    onSuccess: () => {
      toast.success("Action rejected");
      utils.team.getPendingActions.invalidate({ teamId });
    },
    onError: (err) => toast.error(err.message),
  });
  const updateRole = trpc.team.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.team.get.invalidate({ teamId });
    },
    onError: (err) => toast.error(err.message),
  });
  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      utils.team.get.invalidate({ teamId });
    },
    onError: (err) => toast.error(err.message),
  });
  const shareRepo = trpc.team.shareRepository.useMutation({
    onSuccess: () => {
      setShareDialogOpen(false);
      toast.success("Repository shared");
      utils.team.get.invalidate({ teamId });
      utils.repository.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const unshareRepo = trpc.team.unshareRepository.useMutation({
    onSuccess: () => {
      toast.success("Repository unshared");
      utils.team.get.invalidate({ teamId });
      utils.repository.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteTeam = trpc.team.delete.useMutation({
    onSuccess: () => {
      toast.success("Team deleted");
      router.push("/teams");
    },
    onError: (err) => toast.error(err.message),
  });
  const cancelInvite = trpc.team.cancelInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite cancelled");
      utils.team.getPendingInvites.invalidate({ teamId });
    },
    onError: (err) => toast.error(err.message),
  });

  const isOwnerOrAdmin =
    team.data?.currentUserRole === "OWNER" ||
    team.data?.currentUserRole === "ADMIN";
  const isOwner = team.data?.currentUserRole === "OWNER";
  const sharableRepos =
    myRepos.data?.filter((r) => !r.team || r.team.id !== teamId) ?? [];

  if (team.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!team.data) {
    return (
      <div className="text-center py-20">
        {team.isError ? (
          <>
            <AlertTriangle className="size-6 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium">Failed to load team</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              {team.error?.message || "Something went wrong."}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => team.refetch()}>
              <RefreshCw className="size-4 mr-2" />
              Retry
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">Team not found</p>
            <Link href="/teams">
              <Button variant="ghost" className="mt-4">
                <ArrowLeft className="size-4 mr-2" /> Back to teams
              </Button>
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="flex-1 space-y-6 pb-12">


        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/teams">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="size-4 text-muted-foreground" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl shrink-0">
                {team.data.name!.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {team.data.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-normal text-muted-foreground bg-muted"
                  >
                    /{team.data.slug}
                  </Badge>
                  <span className="text-[13px] text-muted-foreground">
                    {team.data.members?.length ?? 0} members
                  </span>
                </div>
              </div>
            </div>
          </div>
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="shrink-0"
            >
              <Trash2 className="size-4 mr-2" />
              Delete Team
            </Button>
          )}
        </div>

        {/* Delete confirm */}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Delete team?
              </AlertDialogTitle>
              <AlertDialogDescription>
                All members will be removed and shared repositories unlinked.
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setConfirmDelete(false)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancel
              </AlertDialogAction>
              <Button
                variant="destructive"
                onClick={() => deleteTeam.mutate({ teamId })}
                disabled={deleteTeam.isPending}
              >
                {deleteTeam.isPending ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isOwnerOrAdmin && (
          <PendingApprovalsCard
            teamId={teamId}
            pendingActions={pendingActions}
            approveAction={approveAction}
            rejectAction={rejectAction}
          />
        )}

        <MyRequestsCard
          myRequests={myRequests}
          isOwnerOrAdmin={!!isOwnerOrAdmin}
          onRequestAction={() => setRequestActionDialogOpen(true)}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <MembersCard
            members={team.data.members ?? []}
            isOwnerOrAdmin={!!isOwnerOrAdmin}
            isOwner={!!isOwner}
            onInvite={() => setInviting(true)}
            updateRole={updateRole}
            removeMember={removeMember}
            teamId={teamId}
          />
          <SharedReposCard
            repos={team.data.repositories ?? []}
            isOwnerOrAdmin={!!isOwnerOrAdmin}
            onShare={() => setShareDialogOpen(true)}
            unshareRepo={unshareRepo}
          />
        </div>

        <PendingInvitesCard
          invites={pendingInvites}
          isOwnerOrAdmin={!!isOwnerOrAdmin}
          cancelInvite={cancelInvite}
        />

        <InviteMemberDialog
          open={inviting}
          onOpenChange={setInviting}
          onSubmit={(email, role) =>
            inviteMember.mutate({ teamId, email, role })
          }
          isPending={inviteMember.isPending}
        />
        <ShareRepoDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          repos={sharableRepos}
          onShare={(repoId) =>
            shareRepo.mutate({ teamId, repositoryId: repoId })
          }
          isPending={shareRepo.isPending}
        />
        <RequestActionDialog
          open={requestActionDialogOpen}
          onOpenChange={setRequestActionDialogOpen}
          onSubmit={(actionType) =>
            requestAction.mutate({ teamId, actionType })
          }
          isPending={requestAction.isPending}
        />
      </div>
    </div>
  );
}
