"use client";

import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AnimatedCounter,
  MiniStatSparkline,
  StatProgressRing,
} from "./chart-components";

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  decimals = 0,
  trend,
  trendLabel,
  sparklineData,
  progress,
  live,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  delay?: number;
  decimals?: number;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  sparklineData?: number[];
  progress?: number;
  live?: boolean;
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  const textColorMap: Record<string, string> = {
    "bg-primary": "text-primary",
    "bg-emerald-500": "text-emerald-500",
    "bg-blue-500": "text-blue-500",
    "bg-amber-500": "text-amber-500",
    "bg-red-500": "text-red-500",
  };
  const textColor = textColorMap[color] ?? "text-primary";
  const borderColor = color.replace('bg-', 'border-');

  return (
    <div className="group relative bg-card border rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
      {/* Subtle Side Accent */}
      <div className={cn("absolute inset-y-0 left-0 w-1", color, "opacity-70")} />
      
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <AnimatedCounter
                value={value}
                className="text-2xl font-bold tracking-tight text-foreground tabular-nums"
                decimals={decimals}
              />
              {live && (
                <span className="flex size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              )}
            </div>
          </div>
          <div className={cn(
            "flex size-9 items-center justify-center rounded-lg bg-muted/20 border border-border/50",
            "transition-colors duration-200 group-hover:bg-muted/40"
          )}>
            <Icon className={cn("size-4.5", textColor)} />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium">
          <div className="flex items-center gap-2">
            {trend && trendLabel && (
              <span className={cn("flex items-center gap-0.5", trendColor)}>
                <TrendIcon className="size-3" />
                {trendLabel}
              </span>
            )}
            {subtitle && (
              <span className="text-muted-foreground/60">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sparkline integrated at the very bottom */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 h-8 opacity-20 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none">
          <MiniStatSparkline data={sparklineData} color={textColor} />
        </div>
      )}
    </div>
  );
}
