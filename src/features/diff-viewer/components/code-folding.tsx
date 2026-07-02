"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ParsedLine } from "./diff-algorithm";

interface FoldableRegion {
  start: number;
  end: number;
  type: "function" | "class" | "block" | "import";
  label: string;
}

function detectFoldableRegions(lines: ParsedLine[]): FoldableRegion[] {
  const regions: FoldableRegion[] = [];
  const stack: { type: string; start: number; label: string }[] = [];

  lines.forEach((line, idx) => {
    const content = line.content.trim();

    // Detect function/class/block starts
    if (content.match(/^(function|class|const\s+\w+\s*=\s*\()/)) {
      const label = content.substring(0, 50);
      stack.push({ type: "function", start: idx, label });
    } else if (content.match(/^(if|for|while|try|catch)\s*\(/)) {
      stack.push({ type: "block", start: idx, label: content.substring(0, 30) });
    } else if (content.match(/^import\s+/)) {
      // Group consecutive imports
      if (
        regions.length === 0 ||
        regions[regions.length - 1].type !== "import" ||
        regions[regions.length - 1].end !== idx - 1
      ) {
        regions.push({ type: "import", start: idx, end: idx, label: "imports" });
      } else {
        regions[regions.length - 1].end = idx;
      }
    }

    // Detect closing braces
    if (content.match(/^\s*\}\s*$/) && stack.length > 0) {
      const item = stack.pop()!;
      if (idx - item.start > 3) {
        // Only fold if more than 3 lines
        regions.push({
          type: item.type as FoldableRegion["type"],
          start: item.start,
          end: idx,
          label: item.label,
        });
      }
    }
  });

  return regions.sort((a, b) => a.start - b.start);
}

interface CodeFoldingProps {
  lines: ParsedLine[];
  renderLine: (line: ParsedLine, index: number) => React.ReactNode;
  className?: string;
}

export function CodeFolding({ lines, renderLine, className }: CodeFoldingProps) {
  const [collapsedRegions, setCollapsedRegions] = useState<Set<number>>(new Set());
  const regions = useMemo(() => detectFoldableRegions(lines), [lines]);

  const toggleRegion = useCallback((regionIndex: number) => {
    setCollapsedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(regionIndex)) {
        next.delete(regionIndex);
      } else {
        next.add(regionIndex);
      }
      return next;
    });
  }, []);

  const visibleLines = useMemo(() => {
    const visible: boolean[] = new Array(lines.length).fill(true);

    collapsedRegions.forEach((regionIdx) => {
      const region = regions[regionIdx];
      if (region) {
        for (let i = region.start + 1; i <= region.end; i++) {
          visible[i] = false;
        }
      }
    });

    return visible;
  }, [lines.length, collapsedRegions, regions]);

  return (
    <div className={className}>
      {lines.map((line, idx) => {
        if (!visibleLines[idx]) return null;

        const region = regions.find((r) => r.start === idx);
        const isCollapsed = region && collapsedRegions.has(regions.indexOf(region));

        return (
          <div key={idx} className="relative group/fold">
            {region && (
              <button
                onClick={() => toggleRegion(regions.indexOf(region))}
                className={cn(
                  "absolute -left-6 top-1/2 -translate-y-1/2 z-10",
                  "opacity-0 group-hover/fold:opacity-100 transition-opacity",
                  "p-0.5 hover:bg-muted rounded",
                )}
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? (
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                )}
              </button>
            )}
            {renderLine(line, idx)}
            {isCollapsed && (
              <div className="text-xs text-muted-foreground italic pl-4 py-0.5 bg-muted/30 border-l-2 border-primary/30">
                ... {region.end - region.start} lines collapsed
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
