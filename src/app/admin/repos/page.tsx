"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Github,
  Lock,
  Globe,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Settings,
  ShieldCheck,
  LayoutTemplate,
  Webhook,
} from "lucide-react";

type SortBy = "createdAt" | "name" | "reviews";
type SortOrder = "asc" | "desc";

function SortButton({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  field: SortBy;
  currentSort: SortBy;
  currentOrder: SortOrder;
  onSort: (field: SortBy) => void;
}) {
  const isActive = currentSort === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {isActive ? (
        currentOrder === "desc" ? (
          <ChevronDown className="h-3 w-3 text-foreground" />
        ) : (
          <ChevronUp className="h-3 w-3 text-foreground" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

function RepositoryExpandedRow({
  repo,
}: {
  repo: {
    webhookConfig?: { enabled: boolean } | null;
    scheduledScanConfig?: { enabled: boolean; cadence: string } | null;
    _count: { reviewRules: number; diagrams: number };
  };
}) {
  return (
    <div className="border-t bg-muted/30 px-6 py-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {/* Webhooks */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Webhook className="h-3.5 w-3.5" />
          Webhooks
        </div>
        <div className="text-sm font-medium">
          {repo.webhookConfig?.enabled ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          ) : (
            <span className="text-muted-foreground">Inactive</span>
          )}
        </div>
      </div>

      {/* Scheduled Scans */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Scheduled Scans
        </div>
        <div className="text-sm font-medium flex items-center gap-2">
          {repo.scheduledScanConfig?.enabled ? (
            <>
              <span className="text-emerald-600 dark:text-emerald-400">
                Active
              </span>
              <Badge variant="outline" className="text-[10px] capitalize">
                {repo.scheduledScanConfig.cadence.toLowerCase()}
              </Badge>
            </>
          ) : (
            <span className="text-muted-foreground">Inactive</span>
          )}
        </div>
      </div>

      {/* Review Rules */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Settings className="h-3.5 w-3.5" />
          Review Rules
        </div>
        <div className="text-sm font-medium">
          {repo._count.reviewRules} configured
        </div>
      </div>

      {/* Diagrams */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <LayoutTemplate className="h-3.5 w-3.5" />
          Diagrams
        </div>
        <div className="text-sm font-medium">
          {repo._count.diagrams} generated
        </div>
      </div>
    </div>
  );
}

export default function AdminRepositoriesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inputVal, setInputVal] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.admin.getRepositories.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const deleteRepository = trpc.admin.deleteRepository.useMutation({
    onSuccess: () => void refetch(),
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(inputVal);
      setPage(1);
      setExpandedId(null);
    }, 400);

    return () => clearTimeout(timer);
  }, [inputVal]);

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
    setExpandedId(null);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">
            Manage all connected GitHub repositories — {data?.total ?? "…"}{" "}
            total
          </p>
        </div>

        {/* Search bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by repository name or user email…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="pl-9"
            />
          </div>
          {inputVal && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setInputVal("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Repository List</CardTitle>
                <CardDescription>
                  {data ? (
                    <>
                      Showing {Math.min((page - 1) * 20 + 1, data.total)}–
                      {Math.min(page * 20, data.total)} of {data.total} repos
                    </>
                  ) : (
                    "Loading…"
                  )}
                </CardDescription>
              </div>
              <div className="hidden items-center gap-4 sm:flex">
                <SortButton
                  label="Date"
                  field="createdAt"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortButton
                  label="Name"
                  field="name"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortButton
                  label="Reviews"
                  field="reviews"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            {isLoading ? (
              <div className="space-y-px">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {data?.repositories.map((repo) => {
                  const isExpanded = expandedId === repo.id;

                  return (
                    <div key={repo.id}>
                      <div
                        className={`flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-6 py-4 transition-colors cursor-pointer hover:bg-muted/30 ${
                          isExpanded ? "bg-muted/20" : ""
                        }`}
                        onClick={() =>
                          setExpandedId(isExpanded ? null : repo.id)
                        }
                      >
                        <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                            <Github className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-medium text-sm">
                                {repo.fullName}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase tracking-wider"
                              >
                                {repo.private ? (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Lock className="h-3 w-3" /> Private
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <Globe className="h-3 w-3" /> Public
                                  </span>
                                )}
                              </Badge>
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-default">
                                    <Avatar className="h-4 w-4">
                                      {repo.user.image && (
                                        <AvatarImage
                                          src={repo.user.image}
                                          alt={repo.user.name ?? ""}
                                        />
                                      )}
                                      <AvatarFallback className="text-[8px]">
                                        {(repo.user.name ?? repo.user.email)
                                          .charAt(0)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate max-w-[120px]">
                                      {repo.user.name ?? repo.user.email}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Connected by {repo.user.email}
                                </TooltipContent>
                              </Tooltip>

                              {repo.team && (
                                <>
                                  <span>·</span>
                                  <span className="truncate max-w-[120px]">
                                    Team: {repo.team.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 mt-2 sm:mt-0 border-t sm:border-t-0">
                          <div className="flex items-center gap-6 text-sm">
                            <div className="hidden sm:block">
                              <p className="font-medium text-center">{repo._count.reviews}</p>
                              <p className="text-xs text-muted-foreground">
                                Reviews
                              </p>
                            </div>
                            <span className="hidden text-xs text-muted-foreground lg:block whitespace-nowrap">
                              {new Date(repo.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            {/* Expand indicator */}
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />

                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={repo.private}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(repo.htmlUrl, "_blank");
                                  }}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View on GitHub
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/repo/${repo.id}`, "_blank");
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Repository
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete repository?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Permanently delete{" "}
                                        <strong>{repo.fullName}</strong>. This will
                                        also remove all associated reviews,
                                        webhooks, scan configurations, and diagrams.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() =>
                                          deleteRepository.mutate({
                                            repositoryId: repo.id,
                                          })
                                        }
                                      >
                                        {deleteRepository.isPending
                                          ? "Deleting…"
                                          : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* Expanded detail panel */}
                      {isExpanded && <RepositoryExpandedRow repo={repo} />}
                    </div>
                  );
                })}

                {data?.repositories.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No repositories found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search
                        ? "Try adjusting your search query"
                        : "No repositories have been connected yet"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {data.pages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
