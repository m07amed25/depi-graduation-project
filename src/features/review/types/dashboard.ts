import React from "react";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export type ReviewStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type SortKey = "date" | "risk" | "status" | "repo";
export type SortDir = "asc" | "desc";
export type ViewMode = "list" | "grid";

export interface ReviewComment {
  severity: "critical" | "warning" | "info" | "suggestion";
}

export const STATUS_CONFIG: Record<
  ReviewStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    ring: string;
    dot: string;
    gradient: string;
  }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    dot: "bg-amber-500",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  PROCESSING: {
    label: "Processing",
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
    dot: "bg-blue-500",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    dot: "bg-red-500",
    gradient: "from-red-500/20 to-red-600/5",
  },
};
