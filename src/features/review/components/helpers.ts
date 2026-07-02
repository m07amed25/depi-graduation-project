import { useEffect, useRef, useState } from "react";
import {
  Bug,
  Shield,
  Zap,
  Paintbrush,
  Lightbulb,
  CircleDot,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  BookMarked,
} from "lucide-react";

export function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(undefined);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

export function getRiskConfig(score: number) {
  if (score < 25) {
    return {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      markerColor: "#10b981",
      glowColor: "#10b981",
      label: "Low Risk",
      description: "Your code looks great. Only minor or no issues detected.",
      icon: ShieldCheck,
    };
  }
  if (score < 50) {
    return {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      markerColor: "#f59e0b",
      glowColor: "#f59e0b",
      label: "Medium Risk",
      description:
        "Some issues were found that should be addressed before merging.",
      icon: CircleDot,
    };
  }
  if (score < 75) {
    return {
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      markerColor: "#f97316",
      glowColor: "#f97316",
      label: "High Risk",
      description:
        "Significant issues detected. Review carefully before merging.",
      icon: ShieldAlert,
    };
  }
  return {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    markerColor: "#ef4444",
    glowColor: "#ef4444",
    label: "Critical Risk",
    description:
      "Critical issues found. This code requires immediate attention.",
    icon: ShieldX,
  };
}

export function getSeverityStyles(severity: string) {
  switch (severity) {
    case "critical":
      return {
        bar: "bg-red-500",
        badge: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
        iconBg: "bg-red-500/10",
        borderHover: "hover:border-red-500/20",
        activeBorder: "border-red-500/15",
      };
    case "high":
      return {
        bar: "bg-orange-500",
        badge:
          "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
        iconBg: "bg-orange-500/10",
        borderHover: "hover:border-orange-500/20",
        activeBorder: "border-orange-500/15",
      };
    case "medium":
      return {
        bar: "bg-amber-500",
        badge:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-500/10",
        borderHover: "hover:border-amber-500/20",
        activeBorder: "border-amber-500/15",
      };
    case "low":
      return {
        bar: "bg-slate-400 dark:bg-slate-500",
        badge:
          "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
        iconBg: "bg-slate-400/10",
        borderHover: "hover:border-slate-400/20",
        activeBorder: "border-slate-400/15",
      };
    case "info":
      return {
        bar: "bg-sky-400 dark:bg-sky-500",
        badge: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
        iconBg: "bg-sky-500/10",
        borderHover: "hover:border-sky-500/20",
        activeBorder: "border-sky-500/15",
      };
    default:
      return {
        bar: "bg-slate-400 dark:bg-slate-500",
        badge: "border-border bg-muted text-muted-foreground",
        iconBg: "bg-muted",
        borderHover: "hover:border-border",
        activeBorder: "",
      };
  }
}

export function getCategoryIcon(category?: string) {
  switch (category) {
    case "bug":
      return Bug;
    case "security":
      return Shield;
    case "performance":
      return Zap;
    case "style":
      return Paintbrush;
    case "suggestion":
      return Lightbulb;
    case "custom-rule":
      return BookMarked;
    default:
      return CircleDot;
  }
}
