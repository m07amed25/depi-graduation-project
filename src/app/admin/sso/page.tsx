"use client";

import { useState, useCallback } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import { KeyRound, Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type SsoType = "OIDC" | "SAML";

interface ProviderFormState {
  id?: string;
  name: string;
  type: SsoType;
  enabled: boolean;
  issuer: string;
  clientId: string;
  clientSecret: string;
  entryPoint: string;
  certificate: string;
  domain: string;
}

interface FormErrors {
  name?: string;
  domain?: string;
  issuer?: string;
  clientId?: string;
  clientSecret?: string;
  entryPoint?: string;
  certificate?: string;
}

const URL_RE = /^https?:\/\/.+\..+/i;
const DOMAIN_RE = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PEM_RE = /-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----/;

const EMPTY_FORM: ProviderFormState = {
  name: "",
  type: "OIDC",
  enabled: false,
  issuer: "",
  clientId: "",
  clientSecret: "",
  entryPoint: "",
  certificate: "",
  domain: "",
};

export default function AdminSsoPage() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProviderFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const clearError = useCallback((field: keyof FormErrors) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!form.name.trim()) {
      errors.name = "Provider name is required.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (form.domain.trim() && !DOMAIN_RE.test(form.domain.trim())) {
      errors.domain = "Enter a valid domain, e.g. company.com";
    }

    if (form.type === "OIDC") {
      if (!form.issuer.trim()) {
        errors.issuer = "Issuer URL is required for OIDC.";
      } else if (!URL_RE.test(form.issuer.trim())) {
        errors.issuer = "Must be a valid URL starting with https://";
      }
      if (!form.clientId.trim()) {
        errors.clientId = "Client ID is required for OIDC.";
      }
      if (!form.clientSecret.trim()) {
        errors.clientSecret = "Client Secret is required for OIDC.";
      }
    }

    if (form.type === "SAML") {
      if (!form.entryPoint.trim()) {
        errors.entryPoint = "Entry Point URL is required for SAML.";
      } else if (!URL_RE.test(form.entryPoint.trim())) {
        errors.entryPoint = "Must be a valid URL starting with https://";
      }
      if (!form.certificate.trim()) {
        errors.certificate = "IdP Certificate is required for SAML.";
      } else if (!PEM_RE.test(form.certificate.trim())) {
        errors.certificate =
          "Must be a valid PEM certificate (BEGIN/END CERTIFICATE markers required).";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const { data: providers, isLoading } = trpc.admin.getSsoProviders.useQuery();

  const upsert = trpc.admin.upsertSsoProvider.useMutation({
    onSuccess: () => {
      toast.success(form.id ? "Provider updated" : "Provider created");
      utils.admin.getSsoProviders.invalidate();
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.admin.deleteSsoProvider.useMutation({
    onSuccess: () => {
      toast.success("Provider deleted");
      utils.admin.getSsoProviders.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (p: NonNullable<typeof providers>[number]) => {
    setFormErrors({});
    setForm({
      id: p.id,
      name: p.name,
      type: p.type,
      enabled: p.enabled,
      issuer: p.issuer ?? "",
      clientId: p.clientId ?? "",
      clientSecret: p.clientSecret ?? "",
      entryPoint: p.entryPoint ?? "",
      certificate: p.certificate ?? "",
      domain: p.domain ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    upsert.mutate({
      id: form.id,
      name: form.name,
      type: form.type,
      enabled: form.enabled,
      issuer: form.issuer || undefined,
      clientId: form.clientId || undefined,
      clientSecret: form.clientSecret || undefined,
      entryPoint: form.entryPoint || undefined,
      certificate: form.certificate || undefined,
      domain: form.domain || undefined,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SSO / SAML</h1>
          <p className="text-muted-foreground">
            Configure enterprise Single Sign-On via SAML 2.0 or OIDC for
            centralised identity management.
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
          Add Provider
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !providers?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <KeyRound className="h-10 w-10" />
            <p className="text-sm">No SSO providers configured yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForm(EMPTY_FORM);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add your first provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {p.domain ? `@${p.domain}` : "All domains"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.type === "SAML" ? "secondary" : "outline"}>
                      {p.type}
                    </Badge>
                    <Badge variant={p.enabled ? "default" : "destructive"}>
                      {p.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {p.issuer && (
                    <span>
                      <span className="font-medium text-foreground">Issuer:</span>{" "}
                      {p.issuer}
                    </span>
                  )}
                  {p.entryPoint && (
                    <span>
                      <span className="font-medium text-foreground">
                        Entry Point:
                      </span>{" "}
                      {p.entryPoint}
                    </span>
                  )}
                  {p.domain && (
                    <span>
                      <span className="font-medium text-foreground">Domain:</span>{" "}
                      {p.domain}
                    </span>
                  )}
                  {p.clientId && (
                    <span>
                      <span className="font-medium text-foreground">
                        Client ID:
                      </span>{" "}
                      {p.clientId.slice(0, 12)}…
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormErrors({});
            setForm(EMPTY_FORM);
          }
          setDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit SSO Provider" : "New SSO Provider"}
            </DialogTitle>
            <DialogDescription>
              Configure an identity provider for enterprise single sign-on.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sso-name">Provider name *</Label>
                <Input
                  id="sso-name"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    clearError("name");
                  }}
                  placeholder="Okta, Azure AD…"
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "err-name" : undefined}
                />
                {formErrors.name && (
                  <p id="err-name" className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sso-type">Type</Label>
                <DropdownSelect
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as SsoType }))
                  }
                  placeholder="Select type"
                >
                  <SelectItem value="OIDC">OIDC</SelectItem>
                  <SelectItem value="SAML">SAML 2.0</SelectItem>
                </DropdownSelect>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sso-domain">Email domain</Label>
              <Input
                id="sso-domain"
                value={form.domain}
                onChange={(e) => {
                  setForm((f) => ({ ...f, domain: e.target.value }));
                  clearError("domain");
                }}
                placeholder="example.com (leave blank for all domains)"
                aria-invalid={!!formErrors.domain}
                aria-describedby={formErrors.domain ? "err-domain" : undefined}
              />
              {formErrors.domain && (
                <p id="err-domain" className="text-xs text-destructive">{formErrors.domain}</p>
              )}
            </div>

            {form.type === "OIDC" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-issuer">Issuer URL *</Label>
                  <Input
                    id="sso-issuer"
                    value={form.issuer}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, issuer: e.target.value }));
                      clearError("issuer");
                    }}
                    placeholder="https://accounts.example.com"
                    aria-invalid={!!formErrors.issuer}
                    aria-describedby={formErrors.issuer ? "err-issuer" : undefined}
                  />
                  {formErrors.issuer && (
                    <p id="err-issuer" className="text-xs text-destructive">{formErrors.issuer}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-client-id">Client ID *</Label>
                  <Input
                    id="sso-client-id"
                    value={form.clientId}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, clientId: e.target.value }));
                      clearError("clientId");
                    }}
                    aria-invalid={!!formErrors.clientId}
                    aria-describedby={formErrors.clientId ? "err-clientid" : undefined}
                  />
                  {formErrors.clientId && (
                    <p id="err-clientid" className="text-xs text-destructive">{formErrors.clientId}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-client-secret">Client Secret *</Label>
                  <Input
                    id="sso-client-secret"
                    type="password"
                    value={form.clientSecret}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, clientSecret: e.target.value }));
                      clearError("clientSecret");
                    }}
                    aria-invalid={!!formErrors.clientSecret}
                    aria-describedby={formErrors.clientSecret ? "err-secret" : undefined}
                  />
                  {formErrors.clientSecret && (
                    <p id="err-secret" className="text-xs text-destructive">{formErrors.clientSecret}</p>
                  )}
                </div>
              </>
            )}

            {form.type === "SAML" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-entry">Entry Point (SSO URL) *</Label>
                  <Input
                    id="sso-entry"
                    value={form.entryPoint}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, entryPoint: e.target.value }));
                      clearError("entryPoint");
                    }}
                    placeholder="https://idp.example.com/saml/sso"
                    aria-invalid={!!formErrors.entryPoint}
                    aria-describedby={formErrors.entryPoint ? "err-entry" : undefined}
                  />
                  {formErrors.entryPoint && (
                    <p id="err-entry" className="text-xs text-destructive">{formErrors.entryPoint}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sso-cert">IdP Certificate (PEM) *</Label>
                  <Textarea
                    id="sso-cert"
                    rows={5}
                    value={form.certificate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, certificate: e.target.value }));
                      clearError("certificate");
                    }}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;…&#10;-----END CERTIFICATE-----"
                    className="font-mono text-xs"
                    aria-invalid={!!formErrors.certificate}
                    aria-describedby={formErrors.certificate ? "err-cert" : undefined}
                  />
                  {formErrors.certificate && (
                    <p id="err-cert" className="text-xs text-destructive">{formErrors.certificate}</p>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="sso-enabled"
                checked={form.enabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
              />
              <Label htmlFor="sso-enabled">Enable this provider</Label>
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
              {upsert.isPending ? "Saving…" : form.id ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SSO provider?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the provider configuration. Users
              currently authenticated via this provider will be unaffected until
              their sessions expire.
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
