"use client";

import { Plan } from "@/lib/plan";
import { motion, AnimatePresence } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Layers,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { DropdownSelect, SelectItem } from "@/components/ui/select";

interface BanDialogProps {
  banTarget: { id: string; name: string } | null;
  setBanTarget: (v: { id: string; name: string } | null) => void;
  banReason: string;
  setBanReason: (v: string) => void;
  handleBanConfirm: () => void;
  isPending: boolean;
}

export function BanDialog({ banTarget, setBanTarget, banReason, setBanReason, handleBanConfirm, isPending }: BanDialogProps) {
  return (
    <Dialog open={!!banTarget} onOpenChange={(open) => { if (!open) { setBanTarget(null); setBanReason(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban {banTarget?.name}?</DialogTitle>
          <DialogDescription>This will immediately revoke all active sessions and prevent them from signing in. You can optionally provide a reason.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="ban-reason">Reason (optional)</Label>
          <Textarea id="ban-reason" placeholder="e.g. Violated terms of service" value={banReason} onChange={(e) => setBanReason(e.target.value)} rows={3} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setBanTarget(null); setBanReason(""); }}>Cancel</Button>
          <Button variant="destructive" className="bg-amber-600 hover:bg-amber-700" onClick={handleBanConfirm} disabled={isPending}>
            {isPending ? "Banning…" : "Ban User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PlanDialogProps {
  planTarget: { id: string; name: string; planId: string; expiresAt: string | null } | null;
  setPlanTarget: (v: any) => void;
  newPlan: Plan;
  setNewPlan: (v: Plan) => void;
  newExpiresAt: string;
  setNewExpiresAt: (v: string) => void;
  overrideRepos: string;
  setOverrideRepos: (v: string) => void;
  overrideReviews: string;
  setOverrideReviews: (v: string) => void;
  overrideSeats: string;
  setOverrideSeats: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function PlanDialog({ planTarget, setPlanTarget, newPlan, setNewPlan, newExpiresAt, setNewExpiresAt, overrideRepos, setOverrideRepos, overrideReviews, setOverrideReviews, overrideSeats, setOverrideSeats, onSubmit, isPending }: PlanDialogProps) {
  return (
    <Dialog open={!!planTarget} onOpenChange={(open) => { if (!open) setPlanTarget(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Plan for {planTarget?.name}</DialogTitle>
          <DialogDescription>Change the user&apos;s subscription plan and expiration date.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Subscription Plan</Label>
            <DropdownSelect value={newPlan} onValueChange={(val) => setNewPlan(val as Plan)} placeholder="Select a plan">
              <SelectItem value="free">Free Plan</SelectItem>
              <SelectItem value="pro">Pro Plan</SelectItem>
              <SelectItem value="enterprise">Ultra Plan</SelectItem>
            </DropdownSelect>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Repo Limit Override</Label><Input type="number" placeholder="Plan default" value={overrideRepos} onChange={(e) => setOverrideRepos(e.target.value)} /></div>
            <div className="space-y-2"><Label>Review Limit Override</Label><Input type="number" placeholder="Plan default" value={overrideReviews} onChange={(e) => setOverrideReviews(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Seat Limit Override</Label><Input type="number" placeholder="Plan default" value={overrideSeats} onChange={(e) => setOverrideSeats(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><Input type="date" value={newExpiresAt} onChange={(e) => setNewExpiresAt(e.target.value)} /></div>
            <p className="text-[10px] text-muted-foreground">Leave empty for perpetual access.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPlanTarget(null)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">{isPending ? "Updating…" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LimitsDialogProps {
  limitsTarget: { id: string; name: string; overrideReposLimit: number | null; overrideReviewsLimit: number | null; overrideSeatsLimit: number | null } | null;
  setLimitsTarget: (v: any) => void;
  limitsMode: "SET" | "EXTEND";
  setLimitsMode: (v: "SET" | "EXTEND") => void;
  reposVal: string;
  setReposVal: (v: string) => void;
  reviewsVal: string;
  setReviewsVal: (v: string) => void;
  seatsVal: string;
  setSeatsVal: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function LimitsDialog({ limitsTarget, setLimitsTarget, limitsMode, setLimitsMode, reposVal, setReposVal, reviewsVal, setReviewsVal, seatsVal, setSeatsVal, onSubmit, isPending }: LimitsDialogProps) {
  return (
    <Dialog open={!!limitsTarget} onOpenChange={(open) => { if (!open) setLimitsTarget(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Limits for {limitsTarget?.name}</DialogTitle>
          <DialogDescription>Explicitly set limits or extend current limits relative to their plan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Action Mode</Label>
            <DropdownSelect value={limitsMode} onValueChange={(val) => {
              setLimitsMode(val as "SET" | "EXTEND");
              if (val === "SET") { setReposVal(limitsTarget?.overrideReposLimit?.toString() ?? ""); setReviewsVal(limitsTarget?.overrideReviewsLimit?.toString() ?? ""); setSeatsVal(limitsTarget?.overrideSeatsLimit?.toString() ?? ""); }
              else { setReposVal(""); setReviewsVal(""); setSeatsVal(""); }
            }} placeholder="Select mode">
              <SelectItem value="SET">Set Explicit Limit</SelectItem>
              <SelectItem value="EXTEND">Extend (Add limits)</SelectItem>
            </DropdownSelect>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Repos Limit {limitsMode === "EXTEND" ? "(Delta)" : ""}</Label><Input type="number" placeholder={limitsMode === "EXTEND" ? "+0" : "Plan default"} value={reposVal} onChange={(e) => setReposVal(e.target.value)} /></div>
            <div className="space-y-2"><Label>Reviews Limit {limitsMode === "EXTEND" ? "(Delta)" : ""}</Label><Input type="number" placeholder={limitsMode === "EXTEND" ? "+0" : "Plan default"} value={reviewsVal} onChange={(e) => setReviewsVal(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Seats Limit {limitsMode === "EXTEND" ? "(Delta)" : ""}</Label><Input type="number" placeholder={limitsMode === "EXTEND" ? "+0" : "Plan default"} value={seatsVal} onChange={(e) => setSeatsVal(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLimitsTarget(null)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700">{isPending ? "Updating…" : "Save Limits"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BulkPlanDialogProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  selectedCount: number;
  newPlan: Plan;
  setNewPlan: (v: Plan) => void;
  newExpiresAt: string;
  setNewExpiresAt: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function BulkPlanDialog({ isOpen, setIsOpen, selectedCount, newPlan, setNewPlan, newExpiresAt, setNewExpiresAt, onSubmit, isPending }: BulkPlanDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4"><Layers className="h-6 w-6 text-indigo-600" /></div>
          <DialogTitle className="text-xl">Bulk Update Plans</DialogTitle>
          <DialogDescription className="text-base">You are about to update the subscription status for <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedCount}</span> selected users.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">This action will immediately change the service level and trigger automated notification emails to all selected users.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">New Subscription Plan</Label>
              <DropdownSelect value={newPlan} onValueChange={(val) => setNewPlan(val as Plan)}>
                <SelectItem value="free"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neutral-400" /><span>Free Plan</span></div></SelectItem>
                <SelectItem value="pro"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span>Pro Plan</span></div></SelectItem>
                <SelectItem value="enterprise"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span>Ultra Plan</span></div></SelectItem>
              </DropdownSelect>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Expiration Date (Optional)</Label>
              <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="date" className="pl-9" value={newExpiresAt} onChange={(e) => setNewExpiresAt(e.target.value)} /></div>
              <p className="text-[10px] text-muted-foreground italic">Leave blank for lifetime access or plan-default behavior.</p>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl px-6">Cancel</Button>
          <Button onClick={onSubmit} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 shadow-lg shadow-indigo-500/20">
            {isPending ? (<div className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Processing...</span></div>) : "Update All Users"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BulkActionBarProps {
  selectedCount: number;
  onChangePlan: () => void;
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, onChangePlan, onClear }: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow-2xl shadow-indigo-500/10"
        >
          <span className="text-sm font-medium">{selectedCount} users selected</span>
          <Separator orientation="vertical" className="h-4" />
          <Button size="sm" variant="ghost" onClick={onChangePlan} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
            <CreditCard className="mr-2 h-4 w-4" />Change Plan
          </Button>
          <Button size="sm" variant="ghost" onClick={onClear} className="text-neutral-500 hover:text-neutral-700">Clear Selection</Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
