import { XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AnomalyAlert({
  severity,
  message,
  onDismiss,
}: {
  severity: "warning" | "critical";
  message: string;
  onDismiss?: () => void;
}) {
  const isCritical = severity === "critical";

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border",
        isCritical
          ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          : "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
      )}
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0",
          isCritical
            ? "border-red-300 dark:border-red-700 text-red-700 dark:text-red-400"
            : "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400",
        )}
      >
        {isCritical ? "Critical" : "Warning"}
      </Badge>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
