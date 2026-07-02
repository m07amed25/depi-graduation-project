"use client";

import { useState } from "react";
import {
  Crown,
  Check,
  Save,
  Eye,
  DollarSign,
  Users,
  CalendarDays,
  Loader2,
  Globe,
  Lock,
  RotateCcw,
  Receipt,
  SlidersHorizontal,
  CreditCard,
  ShieldAlert,
  ShoppingCart,
  TicketPercent,
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Plan } from "@/lib/plan";

export function GlobalSettingsTab() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading: settingsLoading } =
    trpc.adminPricing.getSettings.useQuery();
  const saveSettingsMutation = trpc.adminPricing.saveSettings.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.getSettings.invalidate();
      setSettingsSaved(true);
      toast.success("Global settings saved");
      setTimeout(() => setSettingsSaved(false), 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  const [annualDiscount, setAnnualDiscount] = useState(0);
  const [trialDays, setTrialDays] = useState(0);
  const [pricingEnabled, setPricingEnabled] = useState(true);
  const [trialPlan, setTrialPlan] = useState<Plan>(Plan.PRO);
  const [gracePeriodDays, setGracePeriodDays] = useState(0);
  const [refundEnabled, setRefundEnabled] = useState(false);
  const [refundWindowDays, setRefundWindowDays] = useState(14);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [promoCodesAtCheckout, setPromoCodesAtCheckout] = useState(false);
  const [freeSignupEnabled, setFreeSignupEnabled] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [prevSettings, setPrevSettings] = useState<typeof settings | null>(null);

  if (settings && settings !== prevSettings) {
    setPrevSettings(settings);
    setAnnualDiscount(settings.annualDiscount);
    setTrialDays(settings.trialDays);
    setPricingEnabled(settings.pricingEnabled);
    setTrialPlan(settings.trialPlan as Plan);
    setGracePeriodDays(settings.gracePeriodDays);
    setRefundEnabled(settings.refundEnabled);
    setRefundWindowDays(settings.refundWindowDays);
    setTaxEnabled(settings.taxEnabled);
    setTaxRate(settings.taxRate);
    setPromoCodesAtCheckout(settings.promoCodesAtCheckout);
    setFreeSignupEnabled(settings.freeSignupEnabled);
  }

  if (settingsLoading || !settings) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const saveAllSettings = () => {
    saveSettingsMutation.mutate({
      pricingEnabled,
      annualDiscount,
      trialDays,
      trialPlan,
      gracePeriodDays,
      refundEnabled,
      refundWindowDays,
      taxEnabled,
      taxRate,
      promoCodesAtCheckout,
      freeSignupEnabled,
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* ── Section: Visibility & Access ── */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        Visibility &amp; Access
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Pricing Page</CardTitle>
            </div>
            <CardDescription className="text-xs">
              When disabled, visitors see a &ldquo;Coming Soon&rdquo; message
              instead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {pricingEnabled ? "Live" : "Hidden"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pricingEnabled
                    ? "Pricing page is publicly visible."
                    : "Pricing page is hidden from visitors."}
                </p>
              </div>
              <Switch
                checked={pricingEnabled}
                onCheckedChange={(v) => {
                  setPricingEnabled(v);
                  toast.success(
                    v ? "Pricing page enabled" : "Pricing page hidden",
                  );
                }}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Free Plan Signup</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Allow new users to sign up directly on the Free plan without
              entering payment details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {freeSignupEnabled ? "Allowed" : "Disabled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {freeSignupEnabled
                    ? "Users can sign up for free."
                    : "Payment required at signup."}
                </p>
              </div>
              <Switch
                checked={freeSignupEnabled}
                onCheckedChange={setFreeSignupEnabled}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section: Billing ── */}
      <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <CreditCard className="h-3.5 w-3.5" />
        Billing
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Billing Currency</CardTitle>
            </div>
            <CardDescription className="text-xs">
              All prices are charged in US Dollars.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-50/50 px-4 py-3 dark:bg-indigo-900/20">
              <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
                $
              </span>
              <div>
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                  USD &mdash; United States Dollar
                </p>
                <p className="text-xs text-muted-foreground">
                  Fixed currency — not configurable
                </p>
              </div>
              <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-currency support is not available at this time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TicketPercent className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Annual Discount</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Percentage savings displayed when users switch to annual billing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={80}
                step={5}
                aria-label="Annual discount percentage"
                value={annualDiscount}
                onChange={(e) =>
                  setAnnualDiscount(parseInt(e.target.value, 10))
                }
                className="h-2 w-full cursor-pointer accent-indigo-500"
              />
              <span className="min-w-14 rounded-md border border-indigo-500/30 bg-indigo-50 px-2 py-1 text-center text-sm font-bold text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                {annualDiscount}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Users save <strong>{annualDiscount}%</strong> when billed
              annually.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Payment Grace Period</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Days after a failed payment before the subscription is downgraded
              to Free.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={14}
                step={1}
                aria-label="Grace period days"
                value={gracePeriodDays}
                onChange={(e) =>
                  setGracePeriodDays(parseInt(e.target.value, 10))
                }
                className="h-2 w-full cursor-pointer accent-amber-500"
              />
              <span className="min-w-14 rounded-md border border-amber-500/30 bg-amber-50 px-2 py-1 text-center text-sm font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {gracePeriodDays}d
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {gracePeriodDays === 0
                ? "Subscription downgraded immediately on payment failure."
                : `${gracePeriodDays}-day window before downgrade.`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Checkout Promo Codes</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Show a promo code field in the checkout flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {promoCodesAtCheckout ? "Visible" : "Hidden"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {promoCodesAtCheckout
                    ? "Customers can enter a code at checkout."
                    : "Promo code field is hidden."}
                </p>
              </div>
              <Switch
                checked={promoCodesAtCheckout}
                onCheckedChange={setPromoCodesAtCheckout}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section: Trial ── */}
      <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Trial Period
      </div>
      <Card>
        <CardContent className="pt-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Trial duration
              </Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={7}
                  aria-label="Trial duration days"
                  value={trialDays}
                  onChange={(e) =>
                    setTrialDays(parseInt(e.target.value, 10))
                  }
                  className="h-2 w-full cursor-pointer accent-violet-500"
                />
                <span className="min-w-14 rounded-md border border-violet-500/30 bg-violet-50 px-2 py-1 text-center text-sm font-bold text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">
                  {trialDays}d
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {trialDays === 0
                  ? "No free trial."
                  : `New subscribers get a ${trialDays}-day free trial.`}
              </p>
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Crown className="h-3.5 w-3.5" />
                Trial applies to plan
              </Label>
              <select
                aria-label="Trial plan"
                value={trialPlan}
                onChange={(e) => setTrialPlan(e.target.value as Plan)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="pro">Pro</option>
                <option value="enterprise">Ultra</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Only <strong className="capitalize">{trialPlan}</strong> plan
                subscribers get the free trial.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section: Refund & Tax ── */}
      <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Receipt className="h-3.5 w-3.5" />
        Refund &amp; Tax
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Refund Policy</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Offer a money-back window for paid subscriptions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Refunds enabled</p>
              <Switch
                checked={refundEnabled}
                onCheckedChange={setRefundEnabled}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
            {refundEnabled && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Refund window (days)
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={60}
                    step={1}
                    aria-label="Refund window days"
                    value={refundWindowDays}
                    onChange={(e) =>
                      setRefundWindowDays(parseInt(e.target.value, 10))
                    }
                    className="h-2 w-full cursor-pointer accent-green-500"
                  />
                  <span className="min-w-14 rounded-md border border-green-500/30 bg-green-50 px-2 py-1 text-center text-sm font-bold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {refundWindowDays}d
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Customers can request a refund within {refundWindowDays} days
                  of purchase.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Tax Settings</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Display tax-inclusive pricing on the pricing page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Show tax in prices</p>
              <Switch
                checked={taxEnabled}
                onCheckedChange={setTaxEnabled}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
            {taxEnabled && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Tax rate (%)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(parseFloat(e.target.value) || 0)
                    }
                    className="h-8 w-24 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">
                    Prices shown +{taxRate}% tax
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Save all ── */}
      <div className="flex items-center justify-end gap-3 rounded-xl border border-dashed px-5 py-4">
        <p className="text-xs text-muted-foreground">
          Changes are applied to the public pricing page immediately after
          saving.
        </p>
        <Button
          size="sm"
          className={cn(
            "gap-1.5 text-xs transition-all",
            settingsSaved && "bg-green-600 hover:bg-green-600",
          )}
          onClick={saveAllSettings}
          disabled={saveSettingsMutation.isPending}
        >
          {saveSettingsMutation.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </>
          ) : settingsSaved ? (
            <>
              <Check className="h-3.5 w-3.5" /> Saved!
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" /> Save all settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
