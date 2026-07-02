"use client";

import { useState } from "react";
import { FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { MermaidPreview } from "../MermaidPreview";
import { SAMPLE_SEQUENCE_DIAGRAM, SAMPLE_FLOW_DIAGRAM } from "./product-data";

export function DiagramsShowcase() {
  const [active, setActive] = useState<"sequence" | "flow">("sequence");

  const tabs: { id: "sequence" | "flow"; label: string; file: string }[] = [
    { id: "sequence", label: "Sequence", file: "pr-review-flow.mmd" },
    { id: "flow", label: "Flow", file: "code-analysis.mmd" },
  ];

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-4 border-b border-zinc-800/60 pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn("relative pb-3 text-xs font-medium transition-colors", active === t.id ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
          >
            {t.label}
            {active === t.id && <span className="absolute bottom-0 left-0 right-0 h-px bg-emerald-400" />}
          </button>
        ))}
        <span className="ml-auto mb-3 flex items-center gap-1.5 font-mono text-[10px] text-zinc-700">
          <FileCode className="size-3" />
          {tabs.find((t) => t.id === active)?.file}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="overflow-auto rounded-lg bg-zinc-900/70 p-4">
          <pre className="font-mono text-[11px] leading-relaxed text-zinc-500">
            {(active === "sequence" ? SAMPLE_SEQUENCE_DIAGRAM : SAMPLE_FLOW_DIAGRAM).trim()}
          </pre>
        </div>
        <div className="flex min-h-64 items-center justify-center rounded-lg bg-zinc-900/30 p-4">
          <MermaidPreview key={active} definition={active === "sequence" ? SAMPLE_SEQUENCE_DIAGRAM : SAMPLE_FLOW_DIAGRAM} className="w-full" />
        </div>
      </div>
    </div>
  );
}
