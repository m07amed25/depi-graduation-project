"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Plan } from "@/lib/plan";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowDown,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserRow } from "./user-row";
import { BanDialog, PlanDialog, LimitsDialog, BulkPlanDialog, BulkActionBar } from "./dialogs";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inputVal, setInputVal] = useState("");

  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState("");

  const [planTarget, setPlanTarget] = useState<{ id: string; name: string; planId: string; expiresAt: string | null } | null>(null);
  const [newPlan, setNewPlan] = useState<Plan>(Plan.FREE);
  const [newExpiresAt, setNewExpiresAt] = useState<string>("");
  const [overrideRepos, setOverrideRepos] = useState<string>("");
  const [overrideReviews, setOverrideReviews] = useState<string>("");
  const [overrideSeats, setOverrideSeats] = useState<string>("");

  const [limitsTarget, setLimitsTarget] = useState<{ id: string; name: string; overrideReposLimit: number | null; overrideReviewsLimit: number | null; overrideSeatsLimit: number | null } | null>(null);
  const [limitsMode, setLimitsMode] = useState<"SET" | "EXTEND">("SET");
  const [reposVal, setReposVal] = useState<string>("");
  const [reviewsVal, setReviewsVal] = useState<string>("");
  const [seatsVal, setSeatsVal] = useState<string>("");

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isBulkPlanDialogOpen, setIsBulkPlanDialogOpen] = useState(false);
  const [isSelectAllMenuOpen, setIsSelectAllMenuOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.admin.getUsers.useQuery({ page, limit: 20, search: search || undefined });
  const { data: profile } = trpc.profile.get.useQuery();
  const currentUserIsOwner = profile?.isOwner;

  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => void refetch() });
  const updateRole = trpc.admin.updateUserRole.useMutation({ onSuccess: () => void refetch() });
  const updatePlan = trpc.admin.updateUserPlan.useMutation({
    onSuccess: () => { setPlanTarget(null); toast.success("User plan updated successfully"); void refetch(); },
    onError: (err) => { toast.error(err.message || "Failed to update plan"); },
  });
  const updateLimits = trpc.admin.updateUserLimits.useMutation({
    onSuccess: () => { setLimitsTarget(null); toast.success("User limits updated successfully"); void refetch(); },
    onError: (err) => { toast.error(err.message || "Failed to update limits"); },
  });
  const bulkUpdatePlan = trpc.admin.bulkUpdateUserPlans.useMutation({
    onSuccess: (data) => { setIsBulkPlanDialogOpen(false); setSelectedUsers([]); toast.success(`Updated plans for ${data.count} users`); void refetch(); },
    onError: (err) => { toast.error(err.message || "Failed to update bulk plans"); },
  });
  const banUser = trpc.admin.banUser.useMutation({ onSuccess: () => { setBanTarget(null); setBanReason(""); void refetch(); } });
  const unbanUser = trpc.admin.unbanUser.useMutation({ onSuccess: () => void refetch() });
  const resetPassword = trpc.admin.adminResetUserPassword.useMutation();

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(inputVal); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [inputVal]);

  const handleBanConfirm = () => {
    if (!banTarget) return;
    banUser.mutate({ userId: banTarget.id, reason: banReason || undefined });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">All registered accounts — {data?.total ?? "…"} total</p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or email…" value={inputVal} onChange={(e) => setInputVal(e.target.value)} className="pl-9" />
          </div>
          {inputVal && <Button type="button" variant="ghost" onClick={() => { setSearch(""); setInputVal(""); setPage(1); }}>Clear</Button>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">User List</CardTitle>
            <CardDescription>Page {page} of {data?.pages ?? 1}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            {isLoading ? (
              <div className="space-y-px">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {/* Header with Select All */}
                <div className="flex items-center gap-4 px-6 py-3 bg-muted/40 border-b">
                  <div className="flex items-center gap-3 relative">
                    <Checkbox
                      checked={selectedUsers.length > 0 && data?.users.every((u) => selectedUsers.includes(u.id))}
                      onCheckedChange={(checked) => {
                        const currentIds = data?.users.map((u) => u.id) ?? [];
                        if (checked) setSelectedUsers((prev) => Array.from(new Set([...prev, ...currentIds])));
                        else setSelectedUsers((prev) => prev.filter((id) => !currentIds.includes(id)));
                      }}
                    />
                    <div className="group relative">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider hover:bg-muted" onClick={() => setIsSelectAllMenuOpen(!isSelectAllMenuOpen)}>
                        Selection Options<ArrowDown className={`ml-1 h-3 w-3 transition-transform ${isSelectAllMenuOpen ? "rotate-180" : ""}`} />
                      </Button>
                      {isSelectAllMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsSelectAllMenuOpen(false)} />
                          <div className="absolute left-0 mt-2 w-56 z-50 bg-white dark:bg-neutral-900 border rounded-lg shadow-xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b mb-1">Bulk Selection</div>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2" onClick={() => { setSelectedUsers(data?.users.map((u) => u.id) ?? []); setIsSelectAllMenuOpen(false); }}>
                              <Users className="h-4 w-4 text-neutral-500" />Select all on this page
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2" onClick={() => { toast.info("Full database selection would happen here. Selecting visible users for now."); setSelectedUsers(data?.users.map((u) => u.id) ?? []); setIsSelectAllMenuOpen(false); }}>
                              <CheckCircle2 className="h-4 w-4 text-indigo-500" />Select all matching filter ({data?.total})
                            </button>
                            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">By Tier</div>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2" onClick={() => { setSelectedUsers(data?.users.filter((u) => u.planId === Plan.FREE).map((u) => u.id) ?? []); setIsSelectAllMenuOpen(false); }}>
                              <div className="w-2 h-2 rounded-full bg-neutral-400" />Select all Free users
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2" onClick={() => { setSelectedUsers(data?.users.filter((u) => u.planId === Plan.PRO).map((u) => u.id) ?? []); setIsSelectAllMenuOpen(false); }}>
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />Select all Pro users
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2" onClick={() => { setSelectedUsers(data?.users.filter((u) => u.planId === Plan.ENTERPRISE).map((u) => u.id) ?? []); setIsSelectAllMenuOpen(false); }}>
                              <div className="w-2 h-2 rounded-full bg-amber-500" />Select all Ultra users
                            </button>
                            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20 flex items-center gap-2" onClick={() => { setSelectedUsers([]); setIsSelectAllMenuOpen(false); }}>
                              <Trash2 className="h-4 w-4" />Clear selection
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {data?.users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserIsOwner={currentUserIsOwner}
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                    updateRole={updateRole}
                    banUser={banUser}
                    unbanUser={unbanUser}
                    updatePlan={updatePlan}
                    updateLimits={updateLimits}
                    resetPassword={resetPassword}
                    deleteUser={deleteUser}
                    setBanTarget={setBanTarget}
                    setPlanTarget={setPlanTarget}
                    setNewPlan={setNewPlan}
                    setNewExpiresAt={setNewExpiresAt}
                    setLimitsTarget={setLimitsTarget}
                    setLimitsMode={setLimitsMode}
                    setReposVal={setReposVal}
                    setReviewsVal={setReviewsVal}
                    setSeatsVal={setSeatsVal}
                  />
                ))}

                {data?.users.length === 0 && (
                  <p className="py-12 text-center text-sm text-muted-foreground">No users found.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm text-muted-foreground">{page} / {data.pages}</span>
            <Button variant="outline" size="sm" disabled={page === data.pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}

        {/* Dialogs */}
        <BanDialog banTarget={banTarget} setBanTarget={setBanTarget} banReason={banReason} setBanReason={setBanReason} handleBanConfirm={handleBanConfirm} isPending={banUser.isPending} />
        <PlanDialog
          planTarget={planTarget} setPlanTarget={setPlanTarget} newPlan={newPlan} setNewPlan={setNewPlan}
          newExpiresAt={newExpiresAt} setNewExpiresAt={setNewExpiresAt}
          overrideRepos={overrideRepos} setOverrideRepos={setOverrideRepos}
          overrideReviews={overrideReviews} setOverrideReviews={setOverrideReviews}
          overrideSeats={overrideSeats} setOverrideSeats={setOverrideSeats}
          onSubmit={() => {
            if (!planTarget) return;
            updatePlan.mutate({ userId: planTarget.id, planId: newPlan as any, expiresAt: newExpiresAt ? new Date(newExpiresAt) : null, overrideReposLimit: overrideRepos ? parseInt(overrideRepos) : null, overrideReviewsLimit: overrideReviews ? parseInt(overrideReviews) : null, overrideSeatsLimit: overrideSeats ? parseInt(overrideSeats) : null });
          }}
          isPending={updatePlan.isPending}
        />
        <LimitsDialog
          limitsTarget={limitsTarget} setLimitsTarget={setLimitsTarget}
          limitsMode={limitsMode} setLimitsMode={setLimitsMode}
          reposVal={reposVal} setReposVal={setReposVal}
          reviewsVal={reviewsVal} setReviewsVal={setReviewsVal}
          seatsVal={seatsVal} setSeatsVal={setSeatsVal}
          onSubmit={() => {
            if (!limitsTarget) return;
            updateLimits.mutate({ userId: limitsTarget.id, reposLimitSet: limitsMode === "SET" && reposVal !== "" ? parseInt(reposVal) : null, reviewsLimitSet: limitsMode === "SET" && reviewsVal !== "" ? parseInt(reviewsVal) : null, seatsLimitSet: limitsMode === "SET" && seatsVal !== "" ? parseInt(seatsVal) : null, reposLimitDelta: limitsMode === "EXTEND" && reposVal !== "" ? parseInt(reposVal) : undefined, reviewsLimitDelta: limitsMode === "EXTEND" && reviewsVal !== "" ? parseInt(reviewsVal) : undefined, seatsLimitDelta: limitsMode === "EXTEND" && seatsVal !== "" ? parseInt(seatsVal) : undefined });
          }}
          isPending={updateLimits.isPending}
        />
        <BulkPlanDialog
          isOpen={isBulkPlanDialogOpen} setIsOpen={setIsBulkPlanDialogOpen}
          selectedCount={selectedUsers.length} newPlan={newPlan} setNewPlan={setNewPlan}
          newExpiresAt={newExpiresAt} setNewExpiresAt={setNewExpiresAt}
          onSubmit={() => { bulkUpdatePlan.mutate({ userIds: selectedUsers, planId: newPlan as any, expiresAt: newExpiresAt ? new Date(newExpiresAt) : null }); }}
          isPending={bulkUpdatePlan.isPending}
        />
        <BulkActionBar selectedCount={selectedUsers.length} onChangePlan={() => setIsBulkPlanDialogOpen(true)} onClear={() => setSelectedUsers([])} />
      </div>
    </TooltipProvider>
  );
}
