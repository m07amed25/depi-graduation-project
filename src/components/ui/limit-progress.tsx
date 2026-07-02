"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface LimitProgressProps {
  label: string;
  usage: number;
  limit: number | null;
  color: string;
  icon: React.ReactNode;
  className?: string;
}

export function LimitProgress({
  label,
  usage,
  limit,
  color,
  icon,
  className,
}: LimitProgressProps) {
  const isUnlimited = limit === null || limit === 0;
  const percent = isUnlimited
    ? 0
    : Math.min(100, Math.round((usage / limit) * 100));

  return (
    <div
      className={cn(
        "group space-y-3 p-5 rounded-2xl bg-muted/50 border border-border backdrop-blur-sm transition-all hover:bg-muted hover:border-border hover:shadow-2xl hover:shadow-black/10",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-xl bg-muted shadow-inner transition-all group-hover:scale-110",
              color.replace("bg-", "text-"),
            )}
          >
            {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground group-hover:text-foreground transition-colors">
            {label}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-black tracking-tight">
            {usage}{" "}
            <span className="text-muted-foreground font-medium">
              / {isUnlimited ? "∞" : limit}
            </span>
          </span>
        </div>
      </div>

      {!isUnlimited ? (
        <>
          <div className="relative h-2.5 w-full bg-neutral-200 dark:bg-neutral-800/50 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className={cn("h-full rounded-full relative shadow-lg", color)}
            >
              {/* Shine effect animation */}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 1,
                }}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-full h-full -skew-x-12"
              />
            </motion.div>
          </div>
          <div className="flex justify-between items-center px-0.5">
            <p
              className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                percent > 90
                  ? "text-red-500"
                  : percent > 70
                    ? "text-amber-500"
                    : "text-emerald-500",
              )}
            >
              {percent > 90
                ? "Critical Capacity"
                : percent > 70
                  ? "High Usage"
                  : "Optimal Status"}
            </p>
            <p className="text-[10px] text-muted-foreground font-black italic">
              {percent}% Capacity
            </p>
          </div>
        </>
      ) : (
        <div className="h-2.5 w-full bg-linear-to-r from-indigo-500/10 via-violet-500/20 to-indigo-500/10 rounded-full relative overflow-hidden border border-border">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-linear-to-r from-transparent via-foreground/10 to-transparent w-1/2"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground drop-shadow-sm">
              Unlimited Access
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
