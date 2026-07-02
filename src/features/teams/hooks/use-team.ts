"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import type {
  TeamRole,
  TeamMember,
  TeamRepository,
  TeamData,
  PendingAction,
  TeamActionType,
  TeamActionStatus,
} from "@/features/teams/types";
import { ACTIONS_REQUIRING_APPROVAL } from "@/features/teams/types";

export type { TeamRole, TeamMember, TeamRepository, TeamData, PendingAction };
export { ACTIONS_REQUIRING_APPROVAL };

export interface UseTeamOptions {
  teamId?: string;
  onError?: (error: Error) => void;
}

export function useTeam({ teamId, onError }: UseTeamOptions = {}) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const teams = trpc.team.list.useQuery(undefined, {
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const team = trpc.team.get.useQuery(
    { teamId: teamId! },
    { enabled: !!teamId },
  );

  const pendingActions = trpc.team.getPendingActions.useQuery(
    { teamId: teamId! },
    { enabled: !!teamId },
  );

  const myRequests = trpc.team.getMyRequestedActions.useQuery(
    { teamId: teamId! },
    { enabled: !!teamId },
  );

  const myRepos = trpc.repository.list.useQuery();

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
    },
    onError: (err) => onError?.(new Error(err.message)),
  });

  const deleteTeam = trpc.team.delete.useMutation({
    onSuccess: () => router.push("/teams"),
    onError: (err) => onError?.(new Error(err.message)),
  });

  const inviteMember = trpc.team.inviteMember.useMutation({
    onSuccess: () => {
      if (teamId) utils.team.get.invalidate({ teamId });
    },
    onError: (err) => onError?.(new Error(err.message)),
  });

  const updateMemberRole = trpc.team.updateMemberRole.useMutation({
    onSuccess: () => {
      if (teamId) utils.team.get.invalidate({ teamId });
    },
    onError: (err) => onError?.(new Error(err.message)),
  });

  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      if (teamId) utils.team.get.invalidate({ teamId });
    },
    onError: (err) => onError?.(new Error(err.message)),
  });

  const shareRepository = trpc.team.shareRepository.useMutation({
    onSuccess: () => {
      if (teamId) utils.team.get.invalidate({ teamId });
      utils.repository.list.invalidate();
    },
    onError: (err) => onError?.(new Error(err.message)),
  });

  const unshareRepository = trpc.team.unshareRepository.useMutation({
    onSuccess: () => {
      if (teamId) utils.team.get.invalidate({ teamId });
      utils.repository.list.invalidate();
    },
    onError: (err) => onError?.(new Error(err.message)),
  });

  const approveAction = trpc.team.approveAction.useMutation({
    onSuccess: () => {
      if (teamId) {
        utils.team.getPendingActions.invalidate({ teamId });
        utils.team.get.invalidate({ teamId });
      }
    },
    onError: (err) => onError?.(new Error(err.message)),
  });

  const rejectAction = trpc.team.rejectAction.useMutation({
    onSuccess: () => {
      if (teamId) {
        utils.team.getPendingActions.invalidate({ teamId });
      }
    },
    onError: (err) => onError?.(new Error(err.message)),
  });

  const requestAction = trpc.team.requestAction.useMutation({
    onSuccess: (data) => {
      if (teamId) {
        utils.team.getPendingActions.invalidate({ teamId });
        utils.team.get.invalidate({ teamId });
      }
    },
    onError: (err) => onError?.(new Error(err.message)),
  });

  const isOwnerOrAdmin =
    team.data?.currentUserRole === "OWNER" ||
    team.data?.currentUserRole === "ADMIN";
  const isOwner = team.data?.currentUserRole === "OWNER";

  const sharableRepos =
    myRepos.data?.filter((r) => !r.team || r.team.id !== teamId) ?? [];

  return {
    teams,
    team,
    pendingActions,
    myRequests,
    myRepos,

    isOwnerOrAdmin,
    isOwner,
    sharableRepos,

    createTeam,
    deleteTeam,
    inviteMember,
    updateMemberRole,
    removeMember,
    shareRepository,
    unshareRepository,
    approveAction,
    rejectAction,
    requestAction,

    utils,
  };
}

export function useTeamList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | TeamRole>("ALL");

  const filterTeams = useCallback(
    <T extends { name: string; role: TeamRole }>(teams: T[] | undefined) => {
      if (!teams) return [];

      return teams.filter((team) => {
        const matchesSearch = team.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "ALL" || team.role === roleFilter;
        return matchesSearch && matchesRole;
      });
    },
    [searchQuery, roleFilter],
  );

  return {
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    filterTeams,
  };
}
