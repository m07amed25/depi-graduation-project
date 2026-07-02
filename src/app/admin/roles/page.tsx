"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { ShieldCheck, Plus, Pencil, Trash2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PermissionDef {
  key: keyof RoleFormState["perms"];
  label: string;
  description: string;
}

const PERMISSIONS: PermissionDef[] = [
  {
    key: "canViewReviews",
    label: "View Reviews",
    description: "Read access to all code reviews",
  },
  {
    key: "canTriggerReviews",
    label: "Trigger Reviews",
    description: "Start new AI code review jobs",
  },
  {
    key: "canManageRepositories",
    label: "Manage Repositories",
    description: "Add, configure, or remove repositories",
  },
  {
    key: "canManageTeams",
    label: "Manage Teams",
    description: "Create and administer teams and membership",
  },
  {
    key: "canViewAnalytics",
    label: "View Analytics",
    description: "Access platform-wide analytics dashboards",
  },
  {
    key: "canManageUsers",
    label: "Manage Users",
    description: "Ban, promote, or modify user accounts",
  },
  {
    key: "canAccessAdmin",
    label: "Admin Panel Access",
    description: "Full access to the administration panel",
  },
];

interface RoleFormState {
  id?: string;
  name: string;
  description: string;
  perms: {
    canViewReviews: boolean;
    canTriggerReviews: boolean;
    canManageRepositories: boolean;
    canManageTeams: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
    canAccessAdmin: boolean;
  };
}

const EMPTY_FORM: RoleFormState = {
  name: "",
  description: "",
  perms: {
    canViewReviews: true,
    canTriggerReviews: false,
    canManageRepositories: false,
    canManageTeams: false,
    canViewAnalytics: false,
    canManageUsers: false,
    canAccessAdmin: false,
  },
};

export default function AdminRolesPage() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);

  const { data: roles, isLoading } = trpc.admin.getCustomRoles.useQuery();

  const upsert = trpc.admin.upsertCustomRole.useMutation({
    onSuccess: () => {
      toast.success(form.id ? "Role updated" : "Role created");
      utils.admin.getCustomRoles.invalidate();
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.admin.deleteCustomRole.useMutation({
    onSuccess: () => {
      toast.success("Role deleted");
      utils.admin.getCustomRoles.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (r: NonNullable<typeof roles>[number]) => {
    setForm({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      perms: {
        canViewReviews: r.canViewReviews,
        canTriggerReviews: r.canTriggerReviews,
        canManageRepositories: r.canManageRepositories,
        canManageTeams: r.canManageTeams,
        canViewAnalytics: r.canViewAnalytics,
        canManageUsers: r.canManageUsers,
        canAccessAdmin: r.canAccessAdmin,
      },
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    upsert.mutate({
      id: form.id,
      name: form.name,
      description: form.description || undefined,
      ...form.perms,
    });
  };

  const enabledCount = (perms: RoleFormState["perms"]) =>
    Object.values(perms).filter(Boolean).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Roles</h1>
          <p className="text-muted-foreground">
            Define fine-grained access control roles and assign them to users
            across the platform.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setForm(EMPTY_FORM);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Role
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !roles?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <ShieldCheck className="h-10 w-10" />
            <p className="text-sm">No custom roles defined yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForm(EMPTY_FORM);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create first role
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{r.name}</CardTitle>
                    {r.description && (
                      <CardDescription className="text-xs mt-0.5">
                        {r.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(r)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PERMISSIONS.filter(
                    (p) => r[p.key as keyof typeof r] === true,
                  ).map((p) => (
                    <Badge
                      key={p.key}
                      variant="secondary"
                      className="text-[10px]"
                    >
                      {p.label}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {r._count.userRoles} user
                  {r._count.userRoles !== 1 ? "s" : ""}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Role" : "New Custom Role"}
            </DialogTitle>
            <DialogDescription>
              Configure which platform features this role can access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Role name *</Label>
              <Input
                id="role-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Viewer, Reviewer, Manager…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Optional description…"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Permissions</Label>
                <span className="text-xs text-muted-foreground">
                  {enabledCount(form.perms)} / {PERMISSIONS.length} enabled
                </span>
              </div>
              {PERMISSIONS.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                  <Switch
                    checked={form.perms[p.key]}
                    onCheckedChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        perms: { ...f.perms, [p.key]: v },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={upsert.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={upsert.isPending}>
              {upsert.isPending
                ? "Saving…"
                : form.id
                  ? "Save changes"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              All users assigned this role will lose its permissions. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && remove.mutate({ id: deleteId })}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
