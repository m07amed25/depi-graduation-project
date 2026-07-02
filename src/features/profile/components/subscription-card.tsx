"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Plan } from "@/lib/plan";

interface SubscriptionCardProps {
  plan: { id: string; name: string; tagline: string };
  limits: { reposLimit: number | null; reviewsLimit: number | null; seatsLimit: number | null };
  stats: { repositories: number; reviews: number; teamMembers: number };
  planExpiresAt?: Date | string | null;
  accountCredit?: number;
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        {limit && <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />}
      </div>
      <span className="font-mono text-xs text-foreground shrink-0">{used}<span className="text-muted-foreground">/{limit ?? "∞"}</span></span>
    </div>
  );
}

export function SubscriptionCard({ plan, limits, stats, planExpiresAt, accountCredit }: SubscriptionCardProps) {
  const isFree = plan.id === Plan.FREE;

  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[0.9375rem] font-semibold">{plan.name} Plan</h3>
          <p className="text-xs text-muted-foreground">{plan.tagline}</p>
        </div>
        <Link href="/billing">
          <Button variant="outline" size="sm" className="text-xs gap-1">Billing<ArrowRight className="size-3" /></Button>
        </Link>
      </div>

      <div className="space-y-2.5">
        <UsageRow label="Repos" used={stats.repositories} limit={limits.reposLimit} />
        <UsageRow label="Reviews" used={stats.reviews} limit={limits.reviewsLimit} />
        <UsageRow label="Seats" used={stats.teamMembers} limit={limits.seatsLimit} />
      </div>

      {(planExpiresAt || (accountCredit && accountCredit > 0) || isFree) && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-4">
          {planExpiresAt && (
            <span className="font-mono text-xs text-muted-foreground">
              Expires {new Date(planExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
          {!!accountCredit && accountCredit > 0 && (
            <span className="font-mono text-xs text-emerald-500">${accountCredit} credit</span>
          )}
          {isFree && (
            <Link href="/billing" className="ml-auto">
              <Button size="sm" className="text-xs gap-1">Upgrade<ArrowRight className="size-3" /></Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
