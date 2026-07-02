"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Regex,
  BookMarked,
} from "lucide-react";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface Rule {
  id: string;
  name: string;
  description: string;
  pattern: string | null;
  severity: Severity;
  enabled: boolean;
  repositoryId: string | null;
  teamId: string | null;
  createdAt: Date;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; className: string }> =
  {
    CRITICAL: {
      label: "Critical",
      className: "bg-red-500/15 text-red-500 border-red-500/30",
    },
    HIGH: {
      label: "High",
      className: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    },
    MEDIUM: {
      label: "Medium",
      className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    },
    LOW: {
      label: "Low",
      className: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    },
  };

const EMPTY_FORM = {
  name: "",
  description: "",
  pattern: "",
  severity: "MEDIUM" as Severity,
};

type RuleFormState = typeof EMPTY_FORM;

function RuleFormFields({
  form,
  onChange,
}: {
  form: RuleFormState;
  onChange: (key: keyof RuleFormState, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="rule-name">Rule name</Label>
        <Input
          id="rule-name"
          placeholder="e.g. No hardcoded secrets"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-desc">Description</Label>
        <Textarea
          id="rule-desc"
          placeholder="Describe what the AI should check. Be as specific as possible."
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground">
          The AI uses this as an additional constraint during every review.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-pattern" className="flex items-center gap-1.5">
          <Regex className="size-3.5" />
          Regex pattern{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="rule-pattern"
          placeholder={String.raw`e.g. console\.log\(`}
          value={form.pattern}
          onChange={(e) => onChange("pattern", e.target.value)}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          When set, the pattern is surfaced in the AI prompt as the exact
          trigger condition.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-severity">Severity</Label>
        <DropdownSelect
          id="rule-severity"
          value={form.severity}
          onValueChange={(v) => onChange("severity", v)}
          placeholder="Select severity"
        >
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((s) => (
            <SelectItem key={s} value={s}>
              {SEVERITY_CONFIG[s].label}
            </SelectItem>
          ))}
        </DropdownSelect>
      </div>
    </div>
  );
}

function CreateRuleDialog({
  repositoryId,
  teamId,
  onCreated,
}: {
  repositoryId?: string;
  teamId?: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RuleFormState>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  const create = trpc.rules.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setForm(EMPTY_FORM);
      onCreated();
    },
    onError: (err) => setValidationError(err.message),
  });

  const handleChange = (key: keyof RuleFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setValidationError("Rule name is required.");
      return;
    }
    if (!form.description.trim()) {
      setValidationError("Description is required.");
      return;
    }
    if (form.pattern.trim()) {
      try {
        new RegExp(form.pattern.trim());
      } catch {
        setValidationError("Invalid regex pattern.");
        return;
      }
    }
    create.mutate({
      name: form.name.trim(),
      description: form.description.trim(),
      pattern: form.pattern.trim() || undefined,
      severity: form.severity,
      enabled: true,
      repositoryId,
      teamId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" />
          New Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create custom rule</DialogTitle>
          <DialogDescription>
            Define a coding standard the AI will enforce during every review.
          </DialogDescription>
        </DialogHeader>

        <RuleFormFields form={form} onChange={handleChange} />

        {validationError && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertTriangle className="size-4 shrink-0" />
            {validationError}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending && (
              <Loader2 className="size-4 animate-spin mr-2" />
            )}
            Create Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditRuleDialog({
  rule,
  onUpdated,
}: {
  rule: Rule;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RuleFormState>({
    name: rule.name,
    description: rule.description,
    pattern: rule.pattern ?? "",
    severity: rule.severity,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const update = trpc.rules.update.useMutation({
    onSuccess: () => {
      setOpen(false);
      onUpdated();
    },
    onError: (err) => setValidationError(err.message),
  });

  const handleChange = (key: keyof RuleFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setValidationError("Rule name is required.");
      return;
    }
    if (!form.description.trim()) {
      setValidationError("Description is required.");
      return;
    }
    if (form.pattern.trim()) {
      try {
        new RegExp(form.pattern.trim());
      } catch {
        setValidationError("Invalid regex pattern.");
        return;
      }
    }
    update.mutate({
      id: rule.id,
      name: form.name.trim(),
      description: form.description.trim(),
      pattern: form.pattern.trim() || null,
      severity: form.severity,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-4" />
          <span className="sr-only">Edit rule</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit rule</DialogTitle>
          <DialogDescription>
            Update the name, description, pattern or severity of this rule.
          </DialogDescription>
        </DialogHeader>

        <RuleFormFields form={form} onChange={handleChange} />

        {validationError && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertTriangle className="size-4 shrink-0" />
            {validationError}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={update.isPending}>
            {update.isPending && (
              <Loader2 className="size-4 animate-spin mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleRow({ rule, onMutated }: { rule: Rule; onMutated: () => void }) {
  const toggle = trpc.rules.toggle.useMutation({ onSuccess: onMutated });
  const remove = trpc.rules.delete.useMutation({ onSuccess: onMutated });
  const severity = SEVERITY_CONFIG[rule.severity];

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors group">
      {/* Enable / disable toggle */}
      <Checkbox
        id={`rule-toggle-${rule.id}`}
        checked={rule.enabled}
        disabled={toggle.isPending}
        onCheckedChange={(val) =>
          toggle.mutate({ id: rule.id, enabled: val === true })
        }
        className="mt-0.5 shrink-0"
      />

      {/* Rule info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center flex-wrap gap-2">
          <label
            htmlFor={`rule-toggle-${rule.id}`}
            className="font-medium text-sm truncate cursor-pointer"
          >
            {rule.name}
          </label>
          <Badge
            variant="outline"
            className={`text-xs font-medium ${severity.className}`}
          >
            {severity.label}
          </Badge>
          {rule.pattern && (
            <Badge variant="secondary" className="text-xs gap-1 font-mono">
              <Regex className="size-3" />
              regex
            </Badge>
          )}
          {rule.repositoryId && (
            <Badge variant="secondary" className="text-xs">
              repo
            </Badge>
          )}
          {rule.teamId && (
            <Badge variant="secondary" className="text-xs">
              team
            </Badge>
          )}
          {!rule.enabled && (
            <span className="text-xs text-muted-foreground italic">
              disabled
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {rule.description}
        </p>
        {rule.pattern && (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
            /{rule.pattern}/
          </code>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <EditRuleDialog rule={rule} onUpdated={onMutated} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete rule</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete rule?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>&quot;{rule.name}&quot;</strong> will be permanently
                removed and will no longer be injected into future reviews.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => remove.mutate({ id: rule.id })}
                disabled={remove.isPending}
              >
                {remove.isPending && (
                  <Loader2 className="size-4 animate-spin mr-2" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

interface RulesManagerCardProps {
  /** Scope to a specific repository (optional) */
  repositoryId?: string;
  /** Scope to a specific team (optional) */
  teamId?: string;
}

export function RulesManagerCard({
  repositoryId,
  teamId,
}: RulesManagerCardProps) {
  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.rules.list.useQuery({
    repositoryId,
    teamId,
  });

  const invalidate = () => {
    void utils.rules.list.invalidate({ repositoryId, teamId });
  };

  const enabledCount = rules?.filter((r) => r.enabled).length ?? 0;
  const totalCount = rules?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-violet-500/10 shrink-0">
              <ShieldCheck className="size-4 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-base">Custom Review Rules</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Additional constraints the AI enforces on every code review.
              </CardDescription>
            </div>
          </div>
          <CreateRuleDialog
            repositoryId={repositoryId}
            teamId={teamId}
            onCreated={invalidate}
          />
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 ml-12">
            <BookMarked className="size-3.5" />
            {enabledCount} of {totalCount} rule{totalCount !== 1 ? "s" : ""}{" "}
            active
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-6 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" />
            Loading rules…
          </div>
        ) : !rules || rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 text-muted-foreground">
            <ShieldCheck className="size-10 opacity-20" />
            <p className="text-sm font-medium">No custom rules yet</p>
            <p className="text-xs max-w-xs">
              Rules let you define coding standards the AI will enforce — like
              &quot;No hardcoded API keys&quot; or &quot;Require JSDoc on
              exported functions&quot;.
            </p>
          </div>
        ) : (
          rules.map((rule) => (
            <RuleRow key={rule.id} rule={rule as Rule} onMutated={invalidate} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
