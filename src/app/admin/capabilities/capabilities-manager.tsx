"use client";

import { useState } from "react";
import { Plus, Trash2, X, Pencil, Loader2, SlidersHorizontal } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

type Kind = "enforced" | "display";

export function CapabilitiesManager({ embedded = false }: { embedded?: boolean }) {
  const utils = trpc.useUtils();
  const { data: capabilities, isLoading } =
    trpc.adminPricing.listCapabilities.useQuery();
  const { data: plans } = trpc.adminPricing.listPlans.useQuery();
  const isOwner = trpc.profile.get.useQuery().data?.isOwner ?? false;

  const invalidate = () => utils.adminPricing.listCapabilities.invalidate();

  const createMutation = trpc.adminPricing.createCapability.useMutation({
    onSuccess: async () => { await invalidate(); toast.success("Capability created"); closeForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.adminPricing.updateCapability.useMutation({
    onSuccess: async () => { await invalidate(); toast.success("Capability updated"); closeForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.adminPricing.deleteCapability.useMutation({
    onSuccess: async () => { await invalidate(); toast.success("Capability deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const setPlanMutation = trpc.adminPricing.setPlanCapability.useMutation({
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<Kind>("display");
  const [sortOrder, setSortOrder] = useState("0");

  const closeForm = () => {
    setOpen(false);
    setEditId(null);
    setKey("");
    setLabel("");
    setDescription("");
    setKind("display");
    setSortOrder("0");
  };

  const openCreate = () => { closeForm(); setOpen(true); };
  const openEdit = (c: NonNullable<typeof capabilities>[number]) => {
    setEditId(c.id);
    setKey(c.key);
    setLabel(c.label);
    setDescription(c.description ?? "");
    setKind(c.kind === "enforced" ? "enforced" : "display");
    setSortOrder(String(c.sortOrder));
    setOpen(true);
  };

  const submit = () => {
    if (!key.trim() || !label.trim()) return toast.error("Key and label are required");
    const base = {
      key: key.trim(),
      label: label.trim(),
      description: description.trim() || undefined,
      kind,
    };
    if (editId)
      updateMutation.mutate({
        id: editId,
        ...base,
        ...(isOwner ? { sortOrder: parseInt(sortOrder, 10) || 0 } : {}),
      });
    else createMutation.mutate(base);
  };

  const isOn = (
    c: NonNullable<typeof capabilities>[number],
    planId: string,
  ) => c.plans.find((p) => p.planId === planId)?.enabled ?? false;

  if (isLoading || !capabilities || !plans) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {embedded ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            Toggle which plan unlocks each capability. &quot;Enforced&quot; capabilities gate real
            functionality; &quot;display&quot; ones are shown to users as features.
          </p>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plan Capabilities</h1>
            <p className="text-muted-foreground">
              Manage the capability catalog and toggle which plan unlocks each feature.
              &quot;Enforced&quot; capabilities gate real functionality; &quot;display&quot; ones are
              shown to users as features.
            </p>
          </div>
        )}
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Capability
        </Button>
      </div>

      {open && (
        <Card className="border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {editId ? "Edit capability" : "Create capability"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="api_access"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="h-8 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="API access"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Kind</Label>
                <Select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as Kind)}
                  className="h-8 text-sm"
                >
                  <option value="display">Display (marketing only)</option>
                  <option value="enforced">Enforced (gates access)</option>
                </Select>
              </div>
              {editId && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Sort order</Label>
                  <Input
                    type="number"
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    disabled={!isOwner}
                    className="h-8 text-sm"
                  />
                  {!isOwner && (
                    <p className="text-[10px] text-muted-foreground">
                      Auto-managed — only the owner can reorder.
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                <Input
                  placeholder="What this capability unlocks"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="gap-1.5 text-xs" onClick={submit} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {editId ? "Save" : "Create"}
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={closeForm}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {capabilities.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <SlidersHorizontal className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No capabilities yet.</p>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Create your first capability
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  Capability
                </th>
                {plans.map((p) => (
                  <th key={p.id} className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                    {p.name}
                  </th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {capabilities.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.label}</span>
                      <Badge
                        variant="outline"
                        className={
                          c.kind === "enforced"
                            ? "border-emerald-500/40 bg-emerald-50 text-[10px] text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "border-slate-500/30 text-[10px] text-muted-foreground"
                        }
                      >
                        {c.kind}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{c.key}</p>
                  </td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-4 py-3 text-center">
                      <Switch
                        checked={isOn(c, p.id)}
                        onCheckedChange={(v) =>
                          setPlanMutation.mutate({ planId: p.id, capabilityId: c.id, enabled: v })
                        }
                        className="data-[state=checked]:bg-indigo-500"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="Edit"
                        onClick={() => openEdit(c)}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete capability "${c.label}"?`))
                            deleteMutation.mutate({ id: c.id });
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
