"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users2,
  Database,
} from "lucide-react";

export default function AdminTeamsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.admin.getTeams.useQuery({
    page,
    limit: 20,
  });

  const deleteTeam = trpc.admin.deleteTeam.useMutation({
    onSuccess: () => void refetch(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">
          All teams — {data?.total ?? "…"} total
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team List</CardTitle>
          <CardDescription>
            Page {page} of {data?.pages ?? 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {data?.teams.map((team) => (
                <div
                  key={team.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-6 py-4"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Avatar className="h-9 w-9 shrink-0">
                      {team.image && (
                        <AvatarImage src={team.image} alt={team.name} />
                      )}
                      <AvatarFallback>
                        {team.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{team.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        /{team.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 w-full sm:w-auto">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Users2 className="h-4 w-4 text-muted-foreground" />
                        <span>{team._count.members}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span>{team._count.repositories}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="hidden text-xs text-muted-foreground lg:block">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </span>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive hover:bg-destructive/10"
                            disabled={deleteTeam.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete team?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Permanently delete <strong>{team.name}</strong> and
                              remove all its members and repository associations.
                              This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteTeam.mutate({ teamId: team.id })}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}

              {data?.teams.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No teams found.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
