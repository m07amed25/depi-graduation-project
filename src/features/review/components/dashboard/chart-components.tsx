"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, animate } from "motion/react";
import { getRiskLevel } from "../../utils/dashboard-helpers";
import type { ReviewComment } from "../../types/dashboard";

export function AnimatedCounter({
  value,
  className,
  decimals = 0,
}: {
  value: number;
  className?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  }, [value, decimals]);

  return (
    <span ref={ref} className={className}>
      {decimals > 0 ? value.toFixed(decimals) : value}
    </span>
  );
}

export function MiniRiskGauge({
  score,
  size = 44,
}: {
  score: number;
  size?: number;
}) {
  const risk = getRiskLevel(score);
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 36 36"
        style={{ width: size, height: size }}
        className="-rotate-90"
      >
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-muted/20"
        />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={risk.color}
        />
      </svg>
      <span
        className={cn(
          "absolute text-[10px] font-bold tabular-nums",
          risk.color,
        )}
      >
        {score}
      </span>
    </div>
  );
}

export function ActivitySparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (v / max) * 80 - 10;
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("w-full h-full", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points.join(" ")} 100,100`}
        fill="url(#sparkFill)"
        className="text-primary"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  );
}

export function SeverityDonut({ comments }: { comments: ReviewComment[] }) {
  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0, suggestion: 0 };
    comments.forEach((cm) => {
      if (cm.severity in c) c[cm.severity as keyof typeof c]++;
    });
    return c;
  }, [comments]);

  const total = comments.length;
  if (total === 0) return null;

  const segments = [
    { count: counts.critical, color: "#ef4444", label: "critical" },
    { count: counts.warning, color: "#f59e0b", label: "warning" },
    { count: counts.info, color: "#3b82f6", label: "info" },
    { count: counts.suggestion, color: "#10b981", label: "suggestion" },
  ].filter((s) => s.count > 0);

  const r = 10;
  const circumference = 2 * Math.PI * r;
  let cumulativeOffset = 0;

  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="size-6 -rotate-90">
        {segments.map((seg) => {
          const segLen = (seg.count / total) * circumference;
          const el = (
            <circle
              key={seg.label}
              cx="12"
              cy="12"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={`${segLen} ${circumference - segLen}`}
              strokeDashoffset={-cumulativeOffset}
              strokeLinecap="butt"
            />
          );
          cumulativeOffset += segLen;
          return el;
        })}
      </svg>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tabular-nums">
        {counts.critical > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="size-1.5 rounded-full bg-red-500" />
            {counts.critical}
          </span>
        )}
        {counts.warning > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="size-1.5 rounded-full bg-amber-500" />
            {counts.warning}
          </span>
        )}
        {counts.info > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="size-1.5 rounded-full bg-blue-500" />
            {counts.info}
          </span>
        )}
        {counts.suggestion > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {counts.suggestion}
          </span>
        )}
      </div>
    </div>
  );
}

export function QualityScorePill({ score }: { score: number }) {
  const getConfig = (s: number) => {
    if (s >= 80)
      return {
        color: "text-emerald-500",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        label: "A",
      };
    if (s >= 60)
      return {
        color: "text-blue-500",
        bg: "bg-blue-500/10 border-blue-500/20",
        label: "B",
      };
    if (s >= 40)
      return {
        color: "text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/20",
        label: "C",
      };
    return {
      color: "text-red-500",
      bg: "bg-red-500/10 border-red-500/20",
      label: "D",
    };
  };
  const config = getConfig(score);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums",
        config.bg,
        config.color,
      )}
      title={`Quality Score: ${score}/100`}
    >
      <BarChart3 className="size-2.5" />
      {config.label}
      <span className="opacity-70">{score}</span>
    </div>
  );
}

export function MiniStatSparkline({
  data,
  color,
  className,
}: {
  data: number[];
  color: string;
  className?: string;
}) {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (v / max) * 70 - 15;
    return `${x},${y}`;
  });
  const reactId = React.useId();
  const gradientId = `statFill-${reactId.replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("w-full h-full", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points.join(" ")} 100,100`}
        fill={`url(#${gradientId})`}
        className={cn(color, "opacity-60")}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={color}
      />
    </svg>
  );
}

export function StatProgressRing({
  progress,
  color,
  size = 48,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const offset =
    circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <svg
      viewBox="0 0 36 36"
      style={{ width: size, height: size }}
      className="-rotate-90"
    >
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-muted-foreground/10"
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={color}
      />
    </svg>
  );
}

export function RiskDistributionBar({
  reviews,
}: {
  reviews: { riskScore?: number | null }[];
}) {
  const distribution = useMemo(() => {
    const d = { low: 0, medium: 0, high: 0 };
    reviews.forEach((r) => {
      if (r.riskScore == null) return;
      if (r.riskScore <= 30) d.low++;
      else if (r.riskScore <= 60) d.medium++;
      else d.high++;
    });
    return d;
  }, [reviews]);

  const total = distribution.low + distribution.medium + distribution.high;
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-muted-foreground font-medium shrink-0">
        Risk
      </span>
      <div className="flex h-2 flex-1 max-w-40 overflow-hidden rounded-full bg-muted/30">
        {distribution.low > 0 && (
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${(distribution.low / total) * 100}%` }}
          />
        )}
        {distribution.medium > 0 && (
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${(distribution.medium / total) * 100}%` }}
          />
        )}
        {distribution.high > 0 && (
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${(distribution.high / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
        <span className="flex items-center gap-0.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {distribution.low}
        </span>
        <span className="flex items-center gap-0.5">
          <span className="size-1.5 rounded-full bg-amber-500" />
          {distribution.medium}
        </span>
        <span className="flex items-center gap-0.5">
          <span className="size-1.5 rounded-full bg-red-500" />
          {distribution.high}
        </span>
      </div>
    </div>
  );
}
