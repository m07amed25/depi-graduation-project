"use client";

import { Plan } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trash2,
  ShieldBan,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Github,
  KeyRound,
  CreditCard,
  Sliders,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface UserRowProps {
  user: any;
  currentUserIsOwner: boolean | undefined;
  selectedUsers: string[];
  setSelectedUsers: (v: string[]) => void;
  updateRole: any;
  banUser: any;
  unbanUser: any;
  updatePlan: any;
  updateLimits: any;
  resetPassword: any;
  deleteUser: any;
  setBanTarget: (v: { id: string; name: string } | null) => void;
  setPlanTarget: (v: any) => void;
  setNewPlan: (v: Plan) => void;
  setNewExpiresAt: (v: string) => void;
  setLimitsTarget: (v: any) => void;
  setLimitsMode: (v: "SET" | "EXTEND") => void;
  setReposVal: (v: string) => void;
  setReviewsVal: (v: string) => void;
  setSeatsVal: (v: string) => void;
}

export function UserRow({
  user,
  currentUserIsOwner,
  selectedUsers,
  setSelectedUsers,
  updateRole,
  banUser,
  unbanUser,
  updatePlan,
  updateLimits,
  resetPassword,
  deleteUser,
  setBanTarget,
  setPlanTarget,
  setNewPlan,
  setNewExpiresAt,
  setLimitsTarget,
  setLimitsMode,
  setReposVal,
  setReviewsVal,
  setSeatsVal,
}: UserRowProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-6 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40 ${user.banned ? "bg-amber-500/5" : ""}`}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
        <Checkbox
          checked={selectedUsers.includes(user.id)}
          onCheckedChange={(checked) => {
            if (checked) setSelectedUsers([...selectedUsers, user.id]);
            else setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
          }}
        />
        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-9 w-9 shrink-0">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback>{(user.name ?? user.email).charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium hover:underline">{user.name ?? "(no name)"}</span>
            {user.isOwner ? (
              <Badge variant="default" className="border-amber-500 bg-amber-500/15 text-amber-500">Owner</Badge>
            ) : (
              <Badge variant={user.role === "ADMIN" ? "default" : "outline"} className={user.role === "ADMIN" ? "border-violet-500 bg-violet-500/15 text-violet-400" : "text-xs"}>
                {user.role === "ADMIN" ? "Admin" : "User"}
              </Badge>
            )}
            {user.banned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="border-amber-500 bg-amber-500/10 text-amber-500 text-xs cursor-default">Banned</Badge>
                </TooltipTrigger>
                {user.bannedReason && (
                  <TooltipContent side="top"><p className="max-w-xs text-xs">Reason: {user.bannedReason}</p></TooltipContent>
                )}
              </Tooltip>
            )}
            {user.emailVerified && <Badge variant="outline" className="text-xs">Verified</Badge>}
            {user.githubConnected && (
              <Badge variant="outline" className="gap-1 border-neutral-500 bg-neutral-500/10 text-xs text-neutral-400"><Github className="h-3 w-3" />GitHub</Badge>
            )}
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] h-5 px-1.5 font-normal",
                user.planId === Plan.ENTERPRISE ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : user.planId === Plan.PRO ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                  : "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
              )}
            >
              {user.planId === Plan.ENTERPRISE ? "ULTRA" : user.planId.toUpperCase()}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </Link>
      </div>

      <div className="hidden gap-6 text-center text-sm lg:flex">
        <div><p className="font-medium">{user._count.repositories}</p><p className="text-xs text-muted-foreground">Repos</p></div>
        <div><p className="font-medium">{user._count.reviews}</p><p className="text-xs text-muted-foreground">Reviews</p></div>
        <div><p className="font-medium">{user._count.teamMembers}</p><p className="text-xs text-muted-foreground">Teams</p></div>
      </div>

      <span className="hidden text-xs text-muted-foreground xl:block w-24 text-right">
        {new Date(user.createdAt).toLocaleDateString()}
      </span>

      <div className="flex items-center flex-wrap gap-2 sm:gap-1 mt-2 sm:mt-0 sm:shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0">
        {/* Promote / Demote */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant={user.role === "ADMIN" ? "outline" : "default"}
              size="sm"
              className={`h-8 shrink-0 gap-1.5 text-xs ${user.role === "ADMIN" ? "text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-400" : "bg-violet-600 text-white hover:bg-violet-700"}`}
              disabled={updateRole.isPending || (user.isOwner && !currentUserIsOwner)}
            >
              {user.role === "ADMIN" ? (<><ArrowDown className="h-3 w-3" />Demote</>) : (<><ArrowUp className="h-3 w-3" />Promote</>)}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{user.role === "ADMIN" ? "Demote to User?" : "Promote to Admin?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {user.role === "ADMIN"
                  ? `Remove admin privileges from ${user.name ?? user.email}. They will lose access to the admin panel.`
                  : `Grant admin privileges to ${user.name ?? user.email}. They will have full access to the admin panel.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => updateRole.mutate({ userId: user.id, role: user.role === "ADMIN" ? "USER" : "ADMIN" })}>
                {user.role === "ADMIN" ? "Demote" : "Promote"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Ban / Unban */}
        {user.banned ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 text-amber-500 border-amber-500/40 hover:bg-amber-500/10" disabled={unbanUser.isPending || (user.isOwner && !currentUserIsOwner)} title="Unban user">
                <ShieldCheck className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unban user?</AlertDialogTitle>
                <AlertDialogDescription>Restore access for <strong>{user.name ?? user.email}</strong>. They will be able to sign in again.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => unbanUser.mutate({ userId: user.id })}>Unban</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button variant="ghost" size="icon" className="shrink-0 text-amber-500 hover:bg-amber-500/10" disabled={banUser.isPending || (user.isOwner && !currentUserIsOwner)} title="Ban user" onClick={() => setBanTarget({ id: user.id, name: user.name ?? user.email })}>
            <ShieldBan className="h-4 w-4" />
          </Button>
        )}

        {/* Manage Plan */}
        <Button variant="ghost" size="icon" className="shrink-0 text-indigo-500 hover:bg-indigo-500/10" disabled={updatePlan.isPending || (user.isOwner && !currentUserIsOwner)} title="Manage plan" onClick={() => {
          setPlanTarget({ id: user.id, name: user.name ?? user.email, planId: user.planId, expiresAt: user.planExpiresAt ? new Date(user.planExpiresAt).toISOString().split("T")[0] : null });
          setNewPlan(user.planId as Plan);
          setNewExpiresAt(user.planExpiresAt ? new Date(user.planExpiresAt).toISOString().split("T")[0] : "");
        }}>
          <CreditCard className="h-4 w-4" />
        </Button>

        {/* Manage Limits */}
        <Button variant="ghost" size="icon" className="shrink-0 text-cyan-600 hover:bg-cyan-600/10" disabled={updateLimits.isPending || (user.isOwner && !currentUserIsOwner)} title="Manage Limits" onClick={() => {
          setLimitsTarget({ id: user.id, name: user.name ?? user.email, overrideReposLimit: user.overrideReposLimit, overrideReviewsLimit: user.overrideReviewsLimit, overrideSeatsLimit: user.overrideSeatsLimit });
          setLimitsMode("SET");
          setReposVal(user.overrideReposLimit?.toString() ?? "");
          setReviewsVal(user.overrideReviewsLimit?.toString() ?? "");
          setSeatsVal(user.overrideSeatsLimit?.toString() ?? "");
        }}>
          <Sliders className="h-4 w-4" />
        </Button>

        {/* Reset Password */}
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-950/50 dark:hover:text-orange-400" disabled={resetPassword.isPending || (user.isOwner && !currentUserIsOwner)}>
                  <KeyRound className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Send password reset email</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset password?</AlertDialogTitle>
              <AlertDialogDescription>A password reset link will be sent to <strong>{user.email}</strong>. The user will need to follow the link to set a new password.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetPassword.mutate({ userId: user.id })}>Send Reset Link</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:bg-destructive/10" disabled={deleteUser.isPending || (user.isOwner && !currentUserIsOwner)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete user?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete <strong>{user.name ?? user.email}</strong> and all their data (repositories, reviews, team memberships). This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteUser.mutate({ userId: user.id })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
