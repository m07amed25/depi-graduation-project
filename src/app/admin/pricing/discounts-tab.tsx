"use client";

import { useState } from "react";
import {
  Crown,
  Plus,
  Trash2,
  X,
  DollarSign,
  Tag,
  CalendarDays,
  Hash,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Percent,
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
import { PLAN_OPTIONS, fmtDate, StatusBadge } from "./types";

export function DiscountsTab() {
  const utils = trpc.useUtils();
  const { data: discounts = [], isLoading: discountsLoading } =
    trpc.adminPricing.listDiscounts.useQuery();

  const createMutation = trpc.adminPricing.createDiscount.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listDiscounts.invalidate();
      toast.success("Discount code created");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adminPricing.deleteDiscount.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listDiscounts.invalidate();
      toast.success("Discount code deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.adminPricing.toggleDiscount.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listDiscounts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [planId, setPlanId] = useState("all");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (discountsLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const resetForm = () => {
    setCode("");
    setDescription("");
    setType("PERCENTAGE");
    setValue("");
    setPlanId("all");
    setMaxUses("");
    setExpiresAt("");
    setShowForm(false);
  };

  const handleCreate = () => {
    const numValue = parseFloat(value);
    if (!code.trim()) return toast.error("Code is required");
    if (isNaN(numValue) || numValue <= 0)
      return toast.error("Value must be > 0");
    if (type === "PERCENTAGE" && numValue > 100)
      return toast.error("Percentage cannot exceed 100");
    createMutation.mutate({
      code: code.toUpperCase(),
      description: description || undefined,
      type,
      value: numValue,
      planId: planId === "all" ? null : (planId as Plan),
      maxUses: maxUses ? parseInt(maxUses, 10) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Discount Codes</h2>
          <p className="text-xs text-muted-foreground">
            Coupon codes that reduce the price at checkout — percentage or fixed
            amount.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Code
        </Button>
      </div>

      {showForm && (
        <Card className="border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Create Discount Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="SUMMER25"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="h-8 font-mono text-sm uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Description
                </Label>
                <Input
                  placeholder="Summer 2025 promo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Percent className="h-3.5 w-3.5" />
                  Discount type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "PERCENTAGE" | "FIXED")
                  }
                  className="h-8 text-sm"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed amount ($)</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Value {type === "PERCENTAGE" ? "(%)" : "($)"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={type === "PERCENTAGE" ? 100 : undefined}
                  step={type === "PERCENTAGE" ? 1 : 0.01}
                  placeholder={type === "PERCENTAGE" ? "25" : "5.00"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Crown className="h-3.5 w-3.5" />
                  Apply to plan
                </Label>
                <Select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="h-8 text-sm"
                >
                  {PLAN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" />
                  Max uses (blank = unlimited)
                </Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="100"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
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

      {discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Tag className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No discount codes yet.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Create your first code
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {[
                  "Code",
                  "Discount",
                  "Plan",
                  "Uses",
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
              {discounts.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold tracking-wide">
                      {d.code}
                    </span>
                    {d.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {d.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        d.type === "PERCENTAGE"
                          ? "border-violet-500/40 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
                          : "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                      )}
                    >
                      {d.type === "PERCENTAGE"
                        ? `${d.value}%`
                        : `$${d.value.toFixed(2)}`}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">
                    {d.planId ?? "All plans"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {d.usedCount}
                    {d.maxUses !== null ? ` / ${d.maxUses}` : " / ∞"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {fmtDate(d.expiresAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={d.active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title={d.active ? "Deactivate" : "Activate"}
                        onClick={() =>
                          toggleMutation.mutate({ id: d.id, active: !d.active })
                        }
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {d.active ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete code "${d.code}"?`))
                            deleteMutation.mutate({ id: d.id });
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
