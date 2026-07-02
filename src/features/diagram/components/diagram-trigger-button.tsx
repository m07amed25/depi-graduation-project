"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiagramType } from "@/features/diagram/types";

interface DiagramTriggerButtonProps {
  repositoryId: string;
  type: DiagramType;
  onRequest: () => void;
  isLoading: boolean;
}

const TYPE_LABELS: Record<DiagramType, string> = {
  ERD: "ERD",
};

export function DiagramTriggerButton({
  type,
  onRequest,
  isLoading,
}: DiagramTriggerButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 h-7 text-xs"
      onClick={onRequest}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <RefreshCw className="size-3" />
      )}
      {isLoading ? "Generating…" : `Regenerate ${TYPE_LABELS[type]}`}
    </Button>
  );
}
