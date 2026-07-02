"use client";

import dynamic from "next/dynamic";
import type { Diagram } from "@/server/db/client";
import { Loader2, AlertTriangle, Network, Info, Database } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiagramNode, DiagramEdge } from "@/features/diagram/types";
import DiagramViewer from "@/features/diagram/components/diagram-viewer";

const DiagramFlow = dynamic(() => import("@/features/diagram/components/erd-flow"), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-md" />,
});

interface DiagramPanelProps {
  diagrams: Diagram[];
  repositoryId: string;
  onRequestDiagram?: (type: "ERD") => void;
}

export function DiagramPanel({ diagrams, repositoryId, onRequestDiagram }: DiagramPanelProps) {
  const diagram = diagrams.find((d) => d.type === "ERD");

  const parsedNodes: DiagramNode[] = (() => {
    if (!diagram?.nodes) return [];
    try {
      return Array.isArray(diagram.nodes)
        ? (diagram.nodes as unknown as DiagramNode[])
        : [];
    } catch { return []; }
  })();

  const parsedEdges: DiagramEdge[] = Array.isArray(diagram?.edges)
    ? (diagram.edges as unknown as DiagramEdge[])
    : [];

  // ── Header bar ────────────────────────────────────────────────────────────
  const headerBar = (
    <div className="flex items-center justify-between border-b border-[oklch(0.30_0.02_250)] pb-2 mb-4">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-[4px] bg-[oklch(0.20_0.02_250)] flex items-center justify-center">
          <Database className="size-3.5 text-[oklch(0.62_0.16_250)]" />
        </div>
        <span className="text-sm font-medium text-[oklch(0.82_0.02_250)]">Entity Relationship Diagram</span>
        {diagram?.status === "PENDING" && <Loader2 className="size-3 animate-spin text-[oklch(0.62_0.16_250)]" />}
        {diagram?.status === "FAILED" && <AlertTriangle className="size-3 text-[oklch(0.55_0.2_25)]" />}
      </div>
      {onRequestDiagram && diagram?.status === "COMPLETED" && (
        <button
          onClick={() => onRequestDiagram("ERD")}
          className="h-7 px-2.5 rounded-[4px] text-[0.6875rem] font-medium text-[oklch(0.60_0.03_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          Regenerate
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-0">
      {headerBar}

      {/* No diagram yet */}
      {!diagram && (
        <div className="py-10 text-center">
          <div className="mx-auto size-8 rounded-[4px] bg-[oklch(0.20_0.02_250)] flex items-center justify-center mb-3">
            <Network className="size-4 text-[oklch(0.60_0.03_250)]" />
          </div>
          <p className="text-[0.8125rem] text-[oklch(0.60_0.03_250)]">
            Entity diagram not generated yet
          </p>
          {onRequestDiagram && (
            <button
              onClick={() => onRequestDiagram("ERD")}
              className="mt-3 h-7 px-3 rounded-[4px] text-xs font-medium bg-[oklch(0.62_0.16_250)] text-[oklch(0.12_0.03_250)] hover:bg-[oklch(0.55_0.14_250)] transition-colors duration-150 cursor-pointer inline-flex items-center gap-1.5"
            >
              Generate
            </button>
          )}
        </div>
      )}

      {/* Pending */}
      {diagram?.status === "PENDING" && (
        <div className="space-y-2 py-4">
          <div className="flex items-center gap-2 text-xs text-[oklch(0.60_0.03_250)]">
            <Loader2 className="size-3.5 animate-spin text-[oklch(0.62_0.16_250)]" />
            <span>Generating…</span>
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {/* Failed */}
      {diagram?.status === "FAILED" && (
        <div className="py-10 text-center">
          <div className="mx-auto size-8 rounded-[4px] bg-[oklch(0.55_0.2_25/0.12)] flex items-center justify-center mb-3">
            <AlertTriangle className="size-4 text-[oklch(0.55_0.2_25)]" />
          </div>
          <p className="text-[0.8125rem] text-[oklch(0.55_0.2_25)]">Generation failed</p>
          {diagram.error && (
            <p className="mt-1 text-xs font-mono text-[oklch(0.40_0.03_250)] max-w-md mx-auto">{diagram.error}</p>
          )}
          {onRequestDiagram && (
            <button
              onClick={() => onRequestDiagram("ERD")}
              className="mt-3 h-7 px-3 rounded-[4px] text-xs font-medium text-[oklch(0.60_0.03_250)] border border-[oklch(0.30_0.02_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors duration-150 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Completed with definition */}
      {diagram?.status === "COMPLETED" && diagram.definition && (
        <div className="space-y-2">
          {diagram.error && (
            <div className="flex items-start gap-2 rounded-[4px] border border-[oklch(0.65_0.15_75/0.3)] bg-[oklch(0.65_0.15_75/0.06)] px-3 py-2 text-xs text-[oklch(0.65_0.15_75)]">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>{diagram.error} Showing previous generation.</span>
            </div>
          )}
          {parsedNodes.length > 0 ? (
            <DiagramFlow nodes={parsedNodes} edges={parsedEdges} />
          ) : (
            <DiagramViewer
              definition={diagram.definition}
              nodes={parsedNodes}
              onRetry={onRequestDiagram ? () => onRequestDiagram("ERD") : undefined}
            />
          )}
        </div>
      )}

      {/* Completed without definition */}
      {diagram?.status === "COMPLETED" && !diagram.definition && (
        <div className="py-10 text-center">
          {diagram.error && (
            <div className="flex items-start gap-2 rounded-[4px] border border-[oklch(0.65_0.15_75/0.3)] bg-[oklch(0.65_0.15_75/0.06)] px-3 py-2 text-xs text-[oklch(0.65_0.15_75)] mb-4 max-w-md mx-auto text-left">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>{diagram.error}</span>
            </div>
          )}
          <div className="mx-auto size-8 rounded-[4px] bg-[oklch(0.20_0.02_250)] flex items-center justify-center mb-3">
            <Network className="size-4 text-[oklch(0.60_0.03_250)]" />
          </div>
          <p className="text-[0.8125rem] text-[oklch(0.60_0.03_250)]">
            No entity diagram could be generated.
          </p>
          {onRequestDiagram && (
            <button
              onClick={() => onRequestDiagram("ERD")}
              className="mt-3 h-7 px-3 rounded-[4px] text-xs font-medium text-[oklch(0.60_0.03_250)] border border-[oklch(0.30_0.02_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors duration-150 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <p className="sr-only">Repository ID: {repositoryId}</p>
    </div>
  );
}
