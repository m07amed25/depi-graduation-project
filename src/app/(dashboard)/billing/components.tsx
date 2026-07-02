"use client";

import { useState, useRef, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Zap,
  Shield,
  Loader2,
  Gift,
  Sparkles,
  Trash2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Checkbox } from "@/components/ui/checkbox";
import { COUNTRIES, SUBDIVISIONS, getSubdivisionLabel } from "@/lib/billing-data";

interface UserPlan {
  name: string;
  tagline: string;
  monthlyPrice: number;
  features: string[];
}

interface UserStats {
  reviews: number;
  repositories: number;
  teamMembers: number;
}

interface UserLimits {
  reviewsLimit: number | null;
  reposLimit: number | null;
  seatsLimit: number | null;
}

export const OverviewTab = memo(function OverviewTab({
  plan,
  stats,
  limits,
  isUpgrading,
  handleUpgrade,
  promoCode,
  setPromoCode,
  applyingPromo,
  handleApplyPromo,
  promoMessage,
  discount,
  accountCredit,
}: {
  plan: UserPlan;
  stats: UserStats;
  limits: UserLimits;
  isUpgrading: boolean;
  handleUpgrade: () => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  applyingPromo: boolean;
  handleApplyPromo: () => void;
  promoMessage: { type: "success" | "error"; text: string } | null;
  discount: { type: "PERCENTAGE" | "FIXED"; value: number } | null;
  accountCredit: number;
}) {
  const discountedPrice = discount
    ? discount.type === "PERCENTAGE"
      ? Math.round(plan.monthlyPrice * (1 - discount.value / 100))
      : Math.max(0, plan.monthlyPrice - discount.value)
    : null;
  return (
    <div className="space-y-6">
      {accountCredit > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <Card className="border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Account Credit</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Applied automatically on next payment</p>
              </div>
              <span className="font-mono text-xl font-semibold text-emerald-600 dark:text-emerald-400">${accountCredit}</span>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="lg:col-span-1">
          <Card className="h-full overflow-hidden relative group">
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[0.9375rem] flex items-center gap-2">Current Plan</CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{plan.name}</Badge>
              </div>
              <CardDescription>{plan.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-baseline gap-2">
                {discountedPrice !== null ? (
                  <>
                    <span className="font-mono text-3xl font-semibold tracking-tight text-emerald-500">${discountedPrice}</span>
                    <span className="font-mono text-lg text-muted-foreground line-through">${plan.monthlyPrice}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-3xl font-semibold tracking-tight">${plan.monthlyPrice}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </>
                )}
              </div>
              <div className="space-y-2.5">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-6 border-t border-border/50">
              {plan.monthlyPrice === 0 ? (
                <Button onClick={handleUpgrade} disabled={isUpgrading} className="w-full relative overflow-hidden group/btn bg-foreground text-background hover:bg-foreground/90">
                  <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-linear-to-b from-transparent via-transparent to-black" />
                  {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" /> : <Sparkles className="mr-2 h-4 w-4 relative z-10 group-hover/btn:text-yellow-400 transition-colors" />}
                  <span className="relative z-10">{isUpgrading ? "Connecting..." : "Upgrade Plan"}</span>
                </Button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-2 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">You&apos;re on the {plan.name} plan</span>
                </div>
              )}
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.4 }} className="lg:col-span-2 flex flex-col gap-5">
          <Card className="border-border/50 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-[0.9375rem]">Resource Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <UsageBar icon={<Zap className="h-3.5 w-3.5 text-primary" />} label="AI Code Reviews" used={stats.reviews} limit={limits.reviewsLimit} gradient="from-primary to-primary/70" />
              <UsageBar icon={<Shield className="h-3.5 w-3.5 text-emerald-500" />} label="Repositories" used={stats.repositories} limit={limits.reposLimit} gradient="from-emerald-400 to-emerald-600" />
              <UsageBar icon={<CreditCard className="h-3.5 w-3.5 text-blue-500" />} label="Team Members" used={stats.teamMembers} limit={limits.seatsLimit} gradient="from-blue-400 to-blue-600" />
            </CardContent>
          </Card>

          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-[0.9375rem] flex items-center gap-2"><Gift className="h-4 w-4 text-pink-500" />Promo Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input placeholder="Enter code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="flex-1 h-9 bg-background/50 border-border/60 focus-visible:ring-pink-500/30 text-sm" />
                <Button onClick={handleApplyPromo} disabled={applyingPromo || !promoCode} size="sm" className="h-9 px-5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200">
                  {applyingPromo && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  {applyingPromo ? "Applying..." : "Apply"}
                </Button>
              </div>
              <AnimatePresence>
                {promoMessage && (
                  <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className={`text-xs flex items-center gap-1.5 ${promoMessage.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                    {promoMessage.type === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {promoMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>
              <AppliedPromos />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
});

function UsageBar({ icon, label, used, limit, gradient }: { icon: React.ReactNode; label: string; used: number; limit: number | null; gradient: string }) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium">{icon}{label}</div>
        <span className="font-mono text-xs text-muted-foreground"><span className="text-foreground font-semibold">{used}</span> / {limit ?? "∞"}</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full bg-linear-to-r ${gradient} transition-all duration-1000 ease-in-out`} style={{ width: `${pct}%` }} />
      </div>
      {limit && pct >= 80 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" />Approaching monthly limit.</p>
      )}
    </div>
  );
}

function AppliedPromos() {
  const { data: promos } = trpc.billing.getAppliedPromos.useQuery();
  if (!promos || promos.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="font-mono text-xs font-medium text-muted-foreground tracking-wide">Applied Discounts</p>
      {promos.map((p) => (
        <div key={p.code} className="flex items-center gap-3 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Gift className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{p.code}</p>
              <Badge variant="secondary" className="text-xs h-5 bg-emerald-500/10 text-emerald-500">
                {p.type === "PERCENTAGE" ? `${p.value}% off` : `$${p.value} off`}
              </Badge>
            </div>
            {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
          </div>
          <p className="font-mono text-xs text-muted-foreground shrink-0">
            {new Date(p.appliedAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Payment Tab (real data) ─────────────────────────────────────────────────

export function PaymentTab() {
  const utils = trpc.useUtils();
  const { data: billing, isLoading } = trpc.billing.getInfo.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);

  const setDefault = trpc.billing.setDefaultCard.useMutation({
    onSuccess: () => {
      utils.billing.getInfo.invalidate();
      toast.success("Default card updated");
    },
  });

  const removeCard = trpc.billing.removeCard.useMutation({
    onSuccess: () => {
      utils.billing.getInfo.invalidate();
      toast.success("Card removed");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }} className="space-y-6">
      {/* Billing Info Card */}
      <Card className="border-border/50 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[0.9375rem]">Billing Information</CardTitle>
            <CardDescription>Your billing name and address for invoices.</CardDescription>
          </div>
          <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">{billing ? "Edit" : "Add"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Billing Information</DialogTitle>
                <DialogDescription>This information appears on your invoices.</DialogDescription>
              </DialogHeader>
              <BillingInfoForm
                initial={billing ?? undefined}
                onSuccess={() => setBillingDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        {billing && (
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{billing.fullName}</p>
            <p className="text-muted-foreground">{billing.email}</p>
            {billing.address && <p className="text-muted-foreground">{billing.address}</p>}
            {(billing.city || billing.state || billing.zip) && (
              <p className="text-muted-foreground">
                {[billing.city, billing.state, billing.zip].filter(Boolean).join(", ")}
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Payment Methods Card */}
      <Card className="border-border/50 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[0.9375rem]">Payment Methods</CardTitle>
            <CardDescription>Manage your saved cards.</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!billing}>
                <Plus className="mr-2 h-4 w-4" />Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>Card numbers are never stored. Only the last 4 digits are saved.</DialogDescription>
              </DialogHeader>
              <AddCardForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {!billing && (
            <p className="text-sm text-muted-foreground">Add billing information first to manage cards.</p>
          )}
          {billing?.paymentMethods.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No payment methods</p>
              <p className="text-xs text-muted-foreground mt-1">Add a card to enable automatic billing and upgrades.</p>
            </div>
          )}
          {billing?.paymentMethods.map((card) => (
            <div key={card.id} className="flex items-center justify-between p-4 rounded-md border border-border/50 bg-muted/20 relative overflow-hidden group transition-colors hover:border-primary/30">
              {card.isDefault && <div className="absolute inset-y-0 left-0 w-1 bg-primary/80" />}
              <div className="flex items-center gap-4 pl-2">
                <div className="h-10 w-16 bg-card rounded-md flex items-center justify-center border border-border shadow-xs">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {card.cardBrand} ending in {card.lastFour}
                    {card.isDefault && (
                      <Badge variant="outline" className="text-xs h-5 px-1.5 font-normal border-primary/20 bg-primary/5 text-primary">Default</Badge>
                    )}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">
                    Expires {String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!card.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={setDefault.isPending}
                    onClick={() => setDefault.mutate({ cardId: card.id })}
                    title="Set as default"
                    aria-label="Set as default payment method"
                  >
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive"
                  disabled={removeCard.isPending}
                  onClick={() => removeCard.mutate({ cardId: card.id })}
                  title="Remove card"
                  aria-label="Remove payment card"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function luhnCheck(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  // Amex: 4-6-5, others: 4-4-4-4
  if (/^3[47]/.test(digits)) {
    return digits.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );
  }
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function detectBrand(num: string): "visa" | "mastercard" | "amex" | "discover" | null {
  const d = num.replace(/\s/g, "");
  if (/^4/.test(d)) return "visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^6(?:011|5)/.test(d)) return "discover";
  return null;
}

// ─── Billing Info Form ───────────────────────────────────────────────────────

function BillingInfoForm({
  initial,
  onSuccess,
}: {
  initial?: { fullName: string; email: string; address?: string | null; city?: string | null; state?: string | null; zip?: string | null; country: string };
  onSuccess: () => void;
}) {
  const utils = trpc.useUtils();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [country, setCountry] = useState(initial?.country ?? "US");

  const subdivisions = SUBDIVISIONS[country];
  const subdivisionLabel = getSubdivisionLabel(country);

  const upsert = trpc.billing.upsertInfo.useMutation({
    onSuccess: () => {
      utils.billing.getInfo.invalidate();
      toast.success("Billing information saved");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const validate = (fd: FormData): boolean => {
    const errs: Record<string, string> = {};
    const fullName = (fd.get("fullName") as string).trim();
    const email = (fd.get("email") as string).trim();
    const phone = (fd.get("phone") as string).replace(/\D/g, "");
    const zip = (fd.get("zip") as string).trim();

    if (!fullName || fullName.length < 2) errs.fullName = "Name must be at least 2 characters";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (!/^01[0-9]{9}$/.test(phone)) {
      errs.phone = "Enter a valid Egyptian mobile (01xxxxxxxxx)";
    }
    if (zip && !/^[\w\s-]{2,20}$/.test(zip)) errs.zip = "Enter a valid postal code";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!validate(fd)) return;

    upsert.mutate({
      fullName: (fd.get("fullName") as string).trim(),
      email: (fd.get("email") as string).trim(),
      phone: (fd.get("phone") as string).replace(/\D/g, ""),
      address: (fd.get("address") as string).trim() || undefined,
      city: (fd.get("city") as string).trim() || undefined,
      state: (fd.get("state") as string).trim() || undefined,
      zip: (fd.get("zip") as string).trim() || undefined,
      country: (fd.get("country") as string) || "US",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="fullName"
              name="fullName"
              required
              defaultValue={initial?.fullName}
              placeholder="Mohamed"
              className={errors.fullName ? "border-destructive focus-visible:ring-destructive/30" : ""}
              onChange={() => errors.fullName && setErrors((p) => ({ ...p, fullName: "" }))}
              autoComplete="name"
            />
          </div>
          {errors.fullName && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.fullName}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Billing Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={initial?.email}
            placeholder="billing@company.com"
            className={errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}
            onChange={() => errors.email && setErrors((p) => ({ ...p, email: "" }))}
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">
            Mobile (for card payments) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={initial?.phone ?? ""}
            placeholder="01xxxxxxxxx"
            className={errors.phone ? "border-destructive focus-visible:ring-destructive/30" : ""}
            onChange={() => errors.phone && setErrors((p) => ({ ...p, phone: "" }))}
            autoComplete="tel"
          />
          <p className="text-xs text-muted-foreground">Egyptian mobile format required by Fawaterak (11 digits, starts with 01).</p>
          {errors.phone && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.phone}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="address" className="text-sm font-medium">Street Address</Label>
          <Input id="address" name="address" defaultValue={initial?.address ?? ""} placeholder="123 Main St, Apt 4" autoComplete="street-address" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-sm font-medium">City</Label>
          <Input id="city" name="city" defaultValue={initial?.city ?? ""} placeholder="San Francisco" autoComplete="address-level2" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state" className="text-sm font-medium">{subdivisionLabel}</Label>
          {subdivisions ? (
            <select
              id="state"
              name="state"
              defaultValue={initial?.state ?? ""}
              className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              autoComplete="address-level1"
            >
              <option value="">Select...</option>
              {subdivisions.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          ) : (
            <Input id="state" name="state" defaultValue={initial?.state ?? ""} placeholder="State / Province" autoComplete="address-level1" />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zip" className="text-sm font-medium">ZIP / Postal Code</Label>
          <Input
            id="zip"
            name="zip"
            defaultValue={initial?.zip ?? ""}
            placeholder="94102"
            className={errors.zip ? "border-destructive focus-visible:ring-destructive/30" : ""}
            onChange={() => errors.zip && setErrors((p) => ({ ...p, zip: "" }))}
            autoComplete="postal-code"
          />
          {errors.zip && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.zip}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-sm font-medium">Country</Label>
          <select
            id="country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
            autoComplete="country"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Shield className="h-4 w-4 text-blue-500 shrink-0" />
        <span>This information is used for invoicing and tax purposes only.</span>
      </div>

      <Button type="submit" className="w-full h-10" disabled={upsert.isPending}>
        {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initial ? "Update Billing Info" : "Save Billing Info"}
      </Button>
    </form>
  );
}

// ─── Add Card Form (Fawaterak Hosted) ─────────────────────────────────────────

function AddCardForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils();

  const saveCardScreen = trpc.payment.saveCardScreen.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAddCard = () => {
    saveCardScreen.mutate();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CreditCard className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-[0.9375rem] font-semibold mb-2">Add Payment Method</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Secure card tokenization is handled by our payment provider.
          Your card details are never stored on our servers.
        </p>
        <Button
          onClick={handleAddCard}
          disabled={saveCardScreen.isPending}
          className="h-11 px-8"
        >
          {saveCardScreen.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Add Card"
          )}
        </Button>
      </div>
      <div className="flex items-start gap-3 text-xs text-muted-foreground bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-lg">
        <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-emerald-600 dark:text-emerald-400">PCI DSS Compliant</p>
          <p>Card capture is handled by Fawaterak&apos;s secure hosted form. We never see or store your full card number.</p>
        </div>
      </div>
    </div>
  );
}

// ─── History Tab (static for now) ────────────────────────────────────────────

export function HistoryTab() {
  const { data: invoices, isLoading } = trpc.billing.getInvoices.useQuery();

  const statusStyles: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-500",
    PENDING: "bg-yellow-500/10 text-yellow-500",
    FAILED: "bg-red-500/10 text-red-500",
    REFUNDED: "bg-blue-500/10 text-blue-500",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
      <Card className="border-border/50 shadow-xs">
        <CardHeader>
          <CardTitle className="text-[0.9375rem]">Billing History</CardTitle>
          <CardDescription>Past invoices and receipts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Download className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No billing history</p>
              <p className="text-xs text-muted-foreground mt-1">Invoices and payment receipts will appear here after your first transaction.</p>
            </div>
          ) : (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">Invoice</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs">{inv.id.slice(-8).toUpperCase()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inv.description || inv.planId || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`font-normal ${statusStyles[inv.status] ?? ""}`}>
                          {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="font-mono">{new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </TableCell>
                      <TableCell className="text-sm text-right font-mono font-medium">
                        ${inv.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
