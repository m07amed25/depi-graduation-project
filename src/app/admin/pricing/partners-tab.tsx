"use client";

import { useState } from "react";
import {
  Crown,
  Plus,
  Trash2,
  X,
  DollarSign,
  CalendarDays,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Building2,
  Globe,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Plan } from "@/lib/plan";
import { fmtDate, StatusBadge } from "./types";

export function PartnersTab() {
  const utils = trpc.useUtils();
  const { data: partners = [], isLoading: partnersLoading } =
    trpc.adminPricing.listPartners.useQuery();

  const createMutation = trpc.adminPricing.createPartner.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listPartners.invalidate();
      toast.success("Partner domain added");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adminPricing.deletePartner.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listPartners.invalidate();
      toast.success("Partner domain removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.adminPricing.togglePartner.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listPartners.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [domain, setDomain] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [planId, setPlanId] = useState<Plan>(Plan.PRO);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (partnersLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const resetForm = () => {
    setDomain("");
    setCompanyName("");
    setPlanId(Plan.PRO);
    setMonthlyPrice("");
    setYearlyPrice("");
    setNote("");
    setExpiresAt("");
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!domain.trim()) return toast.error("Domain is required");
    if (!companyName.trim()) return toast.error("Company name is required");
    if (!monthlyPrice && !yearlyPrice)
      return toast.error("At least one of monthly or yearly price is required");
    createMutation.mutate({
      domain: domain.trim().toLowerCase(),
      companyName: companyName.trim(),
      planId,
      overrideMonthlyPrice: monthlyPrice ? parseInt(monthlyPrice) : null,
      overrideYearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
      note: note || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Partner Domains</h2>
          <p className="text-xs text-muted-foreground">
            All users whose email matches a partner domain automatically receive
            the configured plan at the overridden price — no code needed.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Partner
        </Button>
      </div>

      {showForm && (
        <Card className="border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add Partner Domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  Domain <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="acme.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase())}
                  className="h-8 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Company name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Crown className="h-3.5 w-3.5" />
                  Plan <span className="text-destructive">*</span>
                </Label>
                <select
                  aria-label="Plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value as Plan)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value={Plan.FREE}>Free</option>
                  <option value={Plan.PRO}>Pro</option>
                  <option value={Plan.ENTERPRISE}>Ultra</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Internal note
                </Label>
                <Input
                  placeholder="e.g. 2-year partnership agreement"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
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
                  Override yearly price ($/mo billed annually)
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
                  Partnership expires (blank = never)
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
                Add Partner
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

      {partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No partner domains yet.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add first partner
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {[
                  "Company",
                  "Domain",
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
              {partners.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className="font-medium">{p.companyName}</span>
                    {p.note && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.note}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">@{p.domain}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        p.planId === Plan.FREE &&
                          "border-slate-500/30 text-muted-foreground",
                        p.planId === Plan.PRO &&
                          "border-indigo-500/40 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
                        p.planId === Plan.ENTERPRISE &&
                          "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                      )}
                    >
                      {p.planId}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.overrideMonthlyPrice !== null
                      ? `$${p.overrideMonthlyPrice.toFixed(2)}/mo`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.overrideYearlyPrice !== null
                      ? `$${p.overrideYearlyPrice.toFixed(2)}/mo`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {fmtDate(p.expiresAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={p.active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title={p.active ? "Deactivate" : "Activate"}
                        onClick={() =>
                          toggleMutation.mutate({ id: p.id, active: !p.active })
                        }
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {p.active ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        title="Remove"
                        onClick={() => {
                          if (confirm(`Remove partner domain "${p.domain}"?`))
                            deleteMutation.mutate({ id: p.id });
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
