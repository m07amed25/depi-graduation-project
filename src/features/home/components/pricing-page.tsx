import { redirect } from "next/navigation";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { api, HydrateClient } from "@/lib/trpc/server";
import { db } from "@/server/db";
import { HomeFooter } from "./HomeFooter";
import { PricingContent } from "./PricingContent";

export async function PricingPage() {
  const [settings, plans, capabilities] = await Promise.all([
    db.pricingSettings.upsert({
      where: { id: "global" },
      create: { id: "global" },
      update: {},
    }),
    db.pricingPlan.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.capability.findMany({
      orderBy: { sortOrder: "asc" },
      include: { plans: { select: { planId: true, enabled: true } } },
    }),
  ]);

  if (!settings.pricingEnabled) {
    redirect("/maintenance");
  }

  void api.home.getRecentUsers.prefetch();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background">
        <UnifiedNavbar />
        <PricingContent
          settings={settings}
          plans={plans}
          capabilities={capabilities}
        />
        <HomeFooter />
      </div>
    </HydrateClient>
  );
}
