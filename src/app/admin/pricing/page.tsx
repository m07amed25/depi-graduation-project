"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  Eye,
  DollarSign,
  Bot,
  BadgeCheck,
  AlertCircle,
  Tag,
  Mail,
  Loader2,
  Building2,
  Crown,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Plan } from "@/lib/plan";
import { PricingPlan } from "./types";
import { PlanEditorCard } from "./plan-editor-card";
import { DiscountsTab } from "./discounts-tab";
import { OverridesTab } from "./overrides-tab";
import { PartnersTab } from "./partners-tab";
import { GlobalSettingsTab } from "./global-settings-tab";
import { CapabilitiesManager } from "../capabilities/capabilities-manager";

export default function AdminPricingPage() {
  const utils = trpc.useUtils();
  const { data: dbPlans, isLoading: plansLoading } =
    trpc.adminPricing.listPlans.useQuery();
  const savePlanMutation = trpc.adminPricing.savePlan.useMutation({
    onSuccess: async (_, vars) => {
      await utils.adminPricing.listPlans.invalidate();
      toast.success(`${vars.name} plan saved`);
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: settings, isLoading: settingsLoading } =
    trpc.adminPricing.getSettings.useQuery();

  if (plansLoading || settingsLoading || !dbPlans || !settings) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading pricing…</p>
        </div>
      </div>
    );
  }

  const plans: PricingPlan[] = dbPlans.map((p) => ({
    id: p.id as Plan,
    name: p.name,
    tagline: p.tagline,
    monthlyPrice: p.monthlyPrice,
    highlight: p.highlight,
    visible: p.visible,
    features: p.features,
    reposLimit: p.reposLimit,
    reviewsLimit: p.reviewsLimit,
    seatsLimit: p.seatsLimit,
    privateRepos: p.privateRepos,
    sortOrder: p.sortOrder,
    accentColor: p.accentColor || "indigo",
    cta: p.cta,
    badge: p.badge,
  }));

  const handleSavePlan = (updated: PricingPlan) => {
    savePlanMutation.mutate({
      id: updated.id as Plan,
      name: updated.name,
      tagline: updated.tagline,
      monthlyPrice: updated.monthlyPrice,
      highlight: updated.highlight,
      visible: updated.visible,
      features: updated.features,
      reposLimit: updated.reposLimit,
      reviewsLimit: updated.reviewsLimit,
      seatsLimit: updated.seatsLimit,
      privateRepos: updated.privateRepos,
      accentColor: updated.accentColor,
      cta: updated.cta,
      badge: updated.badge,
    });
  };

  const visibleCount = plans.filter((p) => p.visible).length;
  const featuredPlan = plans.find((p) => p.highlight);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pricing Management
          </h1>
          <p className="text-muted-foreground">
            Configure plans, discount codes, and per-user price overrides.
          </p>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <Link href="/pricing" target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            View live page
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Visible Plans",
            value: `${visibleCount} / ${plans.length}`,
            icon: Eye,
            color: "text-green-500",
          },
          {
            label: "Featured Plan",
            value: featuredPlan?.name ?? "None",
            icon: BadgeCheck,
            color: "text-indigo-500",
          },
          {
            label: "Annual Discount",
            value: `${settings.annualDiscount}%`,
            icon: DollarSign,
            color: "text-amber-500",
          },
          {
            label: "Trial Days",
            value: `${settings.trialDays} days`,
            icon: Bot,
            color: "text-violet-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={cn("h-4 w-4", color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1 sm:h-10 sm:w-auto sm:flex-nowrap">
          <TabsTrigger value="plans" className="gap-2 text-sm">
            <Crown className="h-3.5 w-3.5" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="gap-2 text-sm">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Capabilities
          </TabsTrigger>
          <TabsTrigger value="discounts" className="gap-2 text-sm">
            <Tag className="h-3.5 w-3.5" />
            Discounts
          </TabsTrigger>
          <TabsTrigger value="overrides" className="gap-2 text-sm">
            <Mail className="h-3.5 w-3.5" />
            User Overrides
          </TabsTrigger>
          <TabsTrigger value="partners" className="gap-2 text-sm">
            <Building2 className="h-3.5 w-3.5" />
            Partners
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 text-sm">
            <DollarSign className="h-3.5 w-3.5" />
            Global Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Plans tab ── */}
        <TabsContent value="plans" className="mt-6">
          {!featuredPlan && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              No plan is currently featured. Click the{" "}
              <BadgeCheck className="inline h-3.5 w-3.5" /> icon on a plan to
              highlight it on the pricing page.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanEditorCard
                key={plan.id}
                plan={plan}
                onSave={handleSavePlan}
                isSaving={savePlanMutation.isPending}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Capabilities tab ── */}
        <TabsContent value="capabilities" className="mt-6">
          <CapabilitiesManager embedded />
        </TabsContent>

        {/* ── Discounts tab ── */}
        <TabsContent value="discounts" className="mt-6">
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <DiscountsTab />
          </Suspense>
        </TabsContent>

        {/* ── User overrides tab ── */}
        <TabsContent value="overrides" className="mt-6">
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <OverridesTab />
          </Suspense>
        </TabsContent>

        {/* ── Partners tab ── */}
        <TabsContent value="partners" className="mt-6">
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <PartnersTab />
          </Suspense>
        </TabsContent>

        {/* ── Global settings tab ── */}
        <TabsContent value="settings" className="mt-6">
          <GlobalSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
