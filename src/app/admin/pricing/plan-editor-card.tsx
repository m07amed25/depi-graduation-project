"use client";

import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  Check,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  Users,
  GitBranch,
  Bot,
  BadgeCheck,
  Loader2,
  GripVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PricingPlan, PLAN_DISPLAY, ACCENT_STYLES } from "./types";

function LimitField({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const isUnlimited = value === null;
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={isUnlimited ? "" : (value ?? 0)}
          placeholder={isUnlimited ? "∞ Unlimited" : ""}
          min={0}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && n >= 0) onChange(n);
          }}
          className="h-8 text-sm"
        />
        <button
          onClick={() => onChange(isUnlimited ? 0 : null)}
          className={cn(
            "shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors",
            isUnlimited
              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {isUnlimited ? "Unlimited" : "Set unlimited"}
        </button>
      </div>
    </div>
  );
}

type FeatureItem = { id: string; text: string };

let featureSeq = 0;
const makeFeature = (text: string): FeatureItem => ({
  id: `f${featureSeq++}`,
  text,
});
const toFeatureItems = (features: string[]): FeatureItem[] =>
  features.map((t) => makeFeature(t));

function FeatureRow({
  item,
  accentText,
  onChange,
  onRemove,
}: {
  item: FeatureItem;
  accentText: string;
  onChange: (text: string) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item.id}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
      className="flex items-center gap-2 rounded-md bg-background"
    >
      <span
        onPointerDown={(e) => controls.start(e)}
        title="Drag to reorder"
        className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      <Check className={cn("h-3.5 w-3.5 shrink-0", accentText)} />
      <Input
        value={item.text}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 flex-1 text-sm"
      />
      <button
        title="Remove feature"
        onClick={onRemove}
        className="rounded p-0.5 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </Reorder.Item>
  );
}

export function PlanEditorCard({
  plan,
  onSave,
  isSaving,
}: {
  plan: PricingPlan;
  onSave: (updated: PricingPlan) => void;
  isSaving?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PricingPlan>({
    ...plan,
    accentColor: plan.accentColor || "indigo",
  });
  const [featureItems, setFeatureItems] = useState<FeatureItem[]>(() =>
    toFeatureItems(plan.features),
  );

  const [prevPlan, setPrevPlan] = useState<PricingPlan | null>(null);

  if (plan && plan !== prevPlan) {
    setPrevPlan(plan);
    setDraft({
      ...plan,
      accentColor: plan.accentColor || "indigo",
    });
    setFeatureItems(toFeatureItems(plan.features));
  }
  const [newFeature, setNewFeature] = useState("");

  const { icon: Icon } = PLAN_DISPLAY[plan.id] ?? PLAN_DISPLAY.free;

  const handleSave = () => {
    onSave({
      ...draft,
      features: featureItems.map((f) => f.text).filter((t) => t.trim()),
      cta: draft.cta?.trim() || null,
      badge: draft.badge?.trim() || null,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(plan);
    setFeatureItems(toFeatureItems(plan.features));
    setEditing(false);
  };

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    setFeatureItems((items) => [...items, makeFeature(trimmed)]);
    setNewFeature("");
  };

  const removeFeature = (id: string) => {
    setFeatureItems((items) => items.filter((it) => it.id !== id));
  };

  const editFeature = (id: string, text: string) => {
    setFeatureItems((items) =>
      items.map((it) => (it.id === id ? { ...it, text } : it)),
    );
  };

  const currentAccent = editing ? draft.accentColor : plan.accentColor;
  const accentStyle = ACCENT_STYLES[currentAccent] || ACCENT_STYLES.slate;

  return (
    <Card
      className={cn(
        "transition-all",
        plan.highlight && `ring-2 ${accentStyle.ring}`,
        !plan.visible && "opacity-60",
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                accentStyle.bg,
                accentStyle.ring.split(" ")[1],
              )}
            >
              <Icon className={cn("h-5 w-5", accentStyle.text)} />
            </div>
            <div>
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <CardDescription className="text-xs">
                {plan.tagline}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onSave({
                  ...plan,
                  visible: !plan.visible,
                  accentColor: plan.accentColor || "indigo",
                })
              }
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={plan.visible ? "Hide plan" : "Show plan"}
            >
              {plan.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() =>
                onSave({
                  ...plan,
                  highlight: !plan.highlight,
                  accentColor: plan.accentColor || "indigo",
                })
              }
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                plan.highlight
                  ? `${accentStyle.bg} ${accentStyle.text} font-bold`
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={plan.highlight ? "Remove highlight" : "Set as featured"}
            >
              <BadgeCheck className="h-4 w-4" />
            </button>

            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleCancel}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setDraft(plan);
                  setFeatureItems(toFeatureItems(plan.features));
                  setEditing(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Monthly price ($)
            </Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={editing ? draft.monthlyPrice : plan.monthlyPrice}
              readOnly={!editing}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  monthlyPrice: parseInt(e.target.value) || 0,
                }))
              }
              className={cn("h-8 text-sm", !editing && "bg-muted/50")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Annual price (computed)
            </Label>
            <div
              className={cn(
                "flex h-8 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground",
              )}
            >
              Based on Global Settings discount
            </div>
          </div>
        </div>

        {editing && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Plan name
            </Label>
            <Input
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              className="h-8 text-sm"
              maxLength={50}
            />
          </div>
        )}

        {editing && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Tagline
            </Label>
            <Input
              value={draft.tagline}
              onChange={(e) =>
                setDraft((d) => ({ ...d, tagline: e.target.value }))
              }
              className="h-8 text-sm"
              maxLength={200}
            />
          </div>
        )}

        {editing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                CTA button label
              </Label>
              <Input
                value={draft.cta ?? ""}
                placeholder="e.g. Get Started"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, cta: e.target.value }))
                }
                className="h-8 text-sm"
                maxLength={40}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Badge / ribbon
              </Label>
              <Input
                value={draft.badge ?? ""}
                placeholder="e.g. Most Popular"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, badge: e.target.value }))
                }
                className="h-8 text-sm"
                maxLength={40}
              />
            </div>
          </div>
        )}

        {editing && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Theme Color
            </Label>
            <select
              value={draft.accentColor}
              onChange={(e) =>
                setDraft((d) => ({ ...d, accentColor: e.target.value }))
              }
              className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="slate">Slate</option>
              <option value="indigo">Indigo</option>
              <option value="amber">Amber</option>
              <option value="rose">Rose</option>
              <option value="emerald">Emerald</option>
              <option value="violet">Violet</option>
              <option value="blue">Blue</option>
            </select>
          </div>
        )}

        <Separator />

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Limits
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <LimitField
              label="Repositories"
              icon={GitBranch}
              value={editing ? draft.reposLimit : plan.reposLimit}
              onChange={(v) =>
                editing && setDraft((d) => ({ ...d, reposLimit: v }))
              }
            />
            <LimitField
              label="AI Reviews / month"
              icon={Bot}
              value={editing ? draft.reviewsLimit : plan.reviewsLimit}
              onChange={(v) =>
                editing && setDraft((d) => ({ ...d, reviewsLimit: v }))
              }
            />
            <LimitField
              label="Team seats"
              icon={Users}
              value={editing ? draft.seatsLimit : plan.seatsLimit}
              onChange={(v) =>
                editing && setDraft((d) => ({ ...d, seatsLimit: v }))
              }
            />
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Feature list
          </h4>
          {editing ? (
            <Reorder.Group
              axis="y"
              values={featureItems.map((f) => f.id)}
              onReorder={(ids) =>
                setFeatureItems((items) =>
                  ids.map((id) => items.find((it) => it.id === id)!),
                )
              }
              className="space-y-2"
            >
              {featureItems.map((item) => (
                <FeatureRow
                  key={item.id}
                  item={item}
                  accentText={accentStyle.text}
                  onChange={(text) => editFeature(item.id, text)}
                  onRemove={() => removeFeature(item.id)}
                />
              ))}
            </Reorder.Group>
          ) : (
            <ul className="space-y-2">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check
                    className={cn("h-3.5 w-3.5 shrink-0", accentStyle.text)}
                  />
                  <span className="flex-1 text-sm">{f}</span>
                </li>
              ))}
            </ul>
          )}

          {editing && (
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Add a feature..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFeature()}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={addFeature}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              plan.visible
                ? "border-green-500/40 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "border-muted bg-muted/40 text-muted-foreground",
            )}
          >
            {plan.visible ? "Visible" : "Hidden"}
          </Badge>
          {plan.highlight && (
            <Badge
              variant="outline"
              className="border-indigo-500/40 bg-indigo-50 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
            >
              Featured
            </Badge>
          )}
          {plan.monthlyPrice === 0 && (
            <Badge
              variant="outline"
              className="border-slate-500/30 text-xs text-muted-foreground"
            >
              Free tier
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
