import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderGit2,
  Globe,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  connectedCount: number;
  connectedPrivate: number;
  connectedPublic: number;
  availableCount: number;
  totalGithubCount: number;
  selectedCount: number;
  isLoading: boolean;
}

interface StatCardProps {
  label: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  iconClass: string;
  iconBg: string;
  extra?: React.ReactNode;
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBg,
  extra,
}: StatCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm hover:shadow-md hover:border-border transition-all duration-200">
      <div
        className={cn(
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
          iconBg,
        )}
      >
        <Icon className={cn("size-4.5", iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tight leading-none mb-1">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {extra && <div className="mt-3">{extra}</div>}
      </div>
    </div>
  );
}

export function StatsCards({
  connectedCount,
  connectedPrivate,
  connectedPublic,
  availableCount,
  totalGithubCount,
  selectedCount,
  isLoading,
}: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const connectedPct =
    totalGithubCount > 0
      ? Math.round((connectedCount / totalGithubCount) * 100)
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Connected"
        value={connectedCount}
        description="Repositories linked to your account"
        icon={FolderGit2}
        iconClass="text-violet-500"
        iconBg="bg-violet-500/10 border-violet-500/20"
        extra={
          connectedCount > 0 ? (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3" />
                {connectedPrivate} private
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="size-3 text-emerald-500" />
                {connectedPublic} public
              </span>
            </div>
          ) : null
        }
      />

      <StatCard
        label="Available"
        value={availableCount}
        description="GitHub repos not yet connected"
        icon={Globe}
        iconClass="text-sky-500"
        iconBg="bg-sky-500/10 border-sky-500/20"
        extra={
          totalGithubCount > 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                {/* eslint-disable-next-line react/forbid-component-props */}
                <div
                  className="h-full rounded-full bg-sky-500/60 transition-all duration-500"
                  style={{ width: `${100 - connectedPct}%` } as React.CSSProperties}
                />
              </div>
              <span>{100 - connectedPct}% not linked</span>
            </div>
          ) : null
        }
      />

      <StatCard
        label="Ready to Import"
        value={selectedCount > 0 ? selectedCount : availableCount}
        description={
          selectedCount > 0
            ? `${selectedCount} selected for import`
            : "Repositories ready to connect"
        }
        icon={CheckCircle2}
        iconClass="text-emerald-500"
        iconBg="bg-emerald-500/10 border-emerald-500/20"
        extra={
          totalGithubCount > 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                {/* eslint-disable-next-line react/forbid-component-props */}
                <div
                  className="h-full rounded-full bg-emerald-500/60 transition-all duration-500"
                  style={{ width: `${connectedPct}%` } as React.CSSProperties}
                />
              </div>
              <span>{connectedPct}% connected</span>
            </div>
          ) : null
        }
      />
    </div>
  );
}

