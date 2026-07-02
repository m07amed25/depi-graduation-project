"use client";

import { useState } from "react";
import {
  Crown,
  Plus,
  Trash2,
  X,
  DollarSign,
  Mail,
  CalendarDays,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Plan } from "@/lib/plan";
import { fmtDate, StatusBadge } from "./types";

export function OverridesTab() {
  const utils = trpc.useUtils();
  const { data: overrides = [], isLoading: overridesLoading } =
    trpc.adminPricing.listOverrides.useQuery();

  const createMutation = trpc.adminPricing.createOverride.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listOverrides.invalidate();
      toast.success("Price override created");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adminPricing.deleteOverride.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listOverrides.invalidate();
      toast.success("Price override deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.adminPricing.toggleOverride.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listOverrides.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState<Plan>(Plan.PRO);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (overridesLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const resetForm = () => {
    setEmail("");
    setPlanId(Plan.PRO);
    setMonthlyPrice("");
    setYearlyPrice("");
    setReason("");
    setExpiresAt("");
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!email.trim()) return toast.error("Email is required");
    if (!monthlyPrice && !yearlyPrice)
      return toast.error("At least one of monthly or yearly price is required");
    createMutation.mutate({
      email: email.trim().toLowerCase(),
      planId,
      overrideMonthlyPrice: monthlyPrice ? parseInt(monthlyPrice) : null,
      overrideYearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
      reason: reason || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">User Price Overrides</h2>
          <p className="text-xs text-muted-foreground">
            Grant specific users a custom monthly or yearly price on any plan.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Override
        </Button>
      </div>

      {showForm && (
        <Card className="border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Create Price Override</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email address <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Crown className="h-3.5 w-3.5" />
                  Plan <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value as Plan)}
                  className="h-8 text-sm"
                >
                  <option value={Plan.FREE}>Free</option>
                  <option value={Plan.PRO}>Pro</option>
                  <option value={Plan.ENTERPRISE}>Ultra</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Reason (internal note)
                </Label>
                <Input
                  placeholder="e.g. Partner discount"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Override monthly price ($)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="12.00"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Override yearly price ($/mo)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="9.00"
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Expires at (blank = never)
                </Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs"
                onClick={resetForm}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {overrides.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Mail className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No user price overrides yet.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add first override
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {[
                  "Email",
                  "Plan",
                  "Monthly",
                  "Yearly",
                  "Expires",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-4 py-2.5 text-xs font-semibold text-muted-foreground",
                      h === "" ? "text-right" : "text-left",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {overrides.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className="font-medium">{o.email}</span>
                    {o.reason && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {o.reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        o.planId === Plan.FREE &&
                          "border-slate-500/30 text-muted-foreground",
                        o.planId === Plan.PRO &&
                          "border-indigo-500/40 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
                        o.planId === Plan.ENTERPRISE &&
                          "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                      )}
                    >
                      {o.planId}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {o.overrideMonthlyPrice !== null
                      ? `$${o.overrideMonthlyPrice.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {o.overrideYearlyPrice !== null
                      ? `$${o.overrideYearlyPrice.toFixed(2)}/mo`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {fmtDate(o.expiresAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={o.active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title={o.active ? "Deactivate" : "Activate"}
                        onClick={() =>
                          toggleMutation.mutate({ id: o.id, active: !o.active })
                        }
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {o.active ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Remove price override for ${o.email}?`))
                            deleteMutation.mutate({ id: o.id });
                        }}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
