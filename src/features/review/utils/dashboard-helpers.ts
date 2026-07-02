export function getRiskLevel(score: number) {
  // Risk scores are 0-100 scale
  if (score <= 30)
    return { label: "Low", color: "text-emerald-500", bg: "bg-emerald-500", glow: "shadow-emerald-500/20" };
  if (score <= 60)
    return { label: "Medium", color: "text-amber-500", bg: "bg-amber-500", glow: "shadow-amber-500/20" };
  return { label: "High", color: "text-red-500", bg: "bg-red-500", glow: "shadow-red-500/20" };
}

export function relativeTime(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function isRecentlyCompleted(date: string | Date) {
  return Date.now() - new Date(date).getTime() < 3600000;
}
