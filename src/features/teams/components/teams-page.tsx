"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Search, RefreshCw, AlertTriangle, Lock } from "lucide-react";
import { TeamCard, TeamCardSkeleton } from "./team-card";
import { useTeamList } from "../hooks/use-team";
import type { TeamData } from "../types";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";

export function TeamsPage() {
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");

  const { data: caps } = trpc.profile.getCapabilities.useQuery(undefined, { staleTime: 60_000 });
  const teamsLocked = caps?.some((c) => c.key === "team_collaboration" && !c.enabled) ?? false;

  const {
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    filterTeams,
  } = useTeamList();

  const teams = trpc.team.list.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const utils = trpc.useUtils();

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      setCreating(false);
      setTeamName("");
      toast.success("Team created successfully");
      utils.team.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create team");
    },
  });

  const filteredTeams = filterTeams(teams.data as TeamData[] | undefined);

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="flex-1 space-y-6 pb-12">
        {/* Header */}
        <PageHeader
          icon={<Users className="size-4.5 text-primary" />}
          title="Teams"
          description="Group members, share repositories, collaborate on reviews."
          actions={
            teamsLocked ? (
              <Button size="sm" className="shadow-none" asChild>
                <Link href="/pricing">
                  <Lock className="size-4 mr-2" />
                  Upgrade for Teams
                </Link>
              </Button>
            ) : (
              <Button onClick={() => setCreating(true)} size="sm" className="shadow-none">
                <Plus className="size-4 mr-2" />
                New Team
              </Button>
            )
          }
        />

        {teams.data && teams.data.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background h-9"
              />
            </div>
            <div className="flex gap-1.5">
              {(["ALL", "OWNER", "ADMIN", "MEMBER"] as const).map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                  className="h-9 text-sm font-normal capitalize"
                >
                  {role === "ALL" ? "All" : role.toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        )}



        <AlertDialog open={creating} onOpenChange={setCreating}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>New team</AlertDialogTitle>
              <AlertDialogDescription>
                Pick a name. You can invite members once it&apos;s created.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (teamName.trim().length >= 2) {
                  createTeam.mutate({ name: teamName.trim() });
                }
              }}
            >
              <div className="py-4">
                <Input
                  placeholder="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-background"
                  autoFocus
                  maxLength={40}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogAction
                  type="button"
                  variant="outline"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </AlertDialogAction>
                <Button
                  type="submit"
                  disabled={teamName.trim().length < 2 || createTeam.isPending}
                >
                  {createTeam.isPending ? "Creating..." : "Create Team"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>

        {teams.isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        )}

        {teams.isError && (
          <div className="border border-destructive/30 rounded-lg flex flex-col items-center justify-center py-16 px-4 text-center bg-destructive/5">
            <AlertTriangle className="size-6 text-destructive mb-3" />
            <h3 className="text-base font-semibold mb-1">Could not load teams</h3>
            <p className="text-[13px] text-muted-foreground mb-4 max-w-[300px]">
              {teams.error?.message || "Something went wrong."}
            </p>
            <Button onClick={() => teams.refetch()} size="sm" variant="outline">
              <RefreshCw className="size-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {teams.data && teams.data.length === 0 && (
          <div className="border border-border border-dashed rounded-lg flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">No teams yet</h3>
            <p className="text-[13px] text-muted-foreground mb-4 max-w-[280px]">
              Teams let you share repositories and review code together.
            </p>
            {teamsLocked ? (
              <Button size="sm" asChild>
                <Link href="/pricing">
                  <Lock className="size-4 mr-2" />
                  Upgrade for Teams
                </Link>
              </Button>
            ) : (
              <Button onClick={() => setCreating(true)} size="sm">
                <Plus className="size-4 mr-2" />
                New Team
              </Button>
            )}
          </div>
        )}

        {teams.data && teams.data.length > 0 && filteredTeams.length === 0 && (
          <div className="border border-border border-dashed rounded-lg text-center py-12">
            <p className="text-base font-medium">No matches</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Try a different search or filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
              }}
              className="mt-4"
            >
              Clear filters
            </Button>
          </div>
        )}

        {teams.data && filteredTeams.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team, index) => (
              <TeamCard
                key={team.id}
                id={team.id}
                name={team.name}
                slug={team.slug}
                role={team.role}
                memberCount={team.memberCount}
                repoCount={team.repoCount}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
