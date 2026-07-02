import React, { useState, useCallback } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DiffGroup,
  ParsedLine,
  DiffSegment,
  computeWordDiff,
} from "./diff-algorithm";
import { HighlightedLine } from "./syntax-highlighter";

const CONTEXT_COLLAPSE_THRESHOLD = 8;

export function WordDiffSegments({
  segments,
  side,
}: {
  segments: DiffSegment[];
  side: "old" | "new";
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "common") return <span key={i}>{seg.text}</span>;
        const cls =
          side === "old"
            ? "bg-[oklch(0.55_0.2_25/0.2)] rounded-sm px-px"
            : "bg-[oklch(0.55_0.15_155/0.2)] rounded-sm px-px";
        return (
          <span key={i} className={cls}>
            {seg.text}
          </span>
        );
      })}
    </>
  );
}

function UnifiedContextRow({
  line,
  wrapLines,
  language,
  enableSyntaxHighlighting = true,
}: {
  line: ParsedLine;
  wrapLines: boolean;
  language?: string;
  enableSyntaxHighlighting?: boolean;
}) {
  return (
    <tr className="group/line hover:bg-[oklch(0.20_0.02_250/0.5)] transition-colors duration-150">
      <td className="w-12 px-2 py-0.5 text-right select-none border-r border-[oklch(0.30_0.02_250/0.4)] text-[oklch(0.40_0.03_250)]">
        {line.oldNum || ""}
      </td>
      <td className="w-12 px-2 py-0.5 text-right select-none border-r border-[oklch(0.30_0.02_250/0.4)] text-[oklch(0.40_0.03_250)]">
        {line.newNum || ""}
      </td>
      <td
        className={cn(
          "px-4 py-0.5 text-[oklch(0.82_0.02_250)]",
          wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre",
        )}
      >
        <span className="select-none text-transparent mr-1"> </span>
        {enableSyntaxHighlighting ? (
          <HighlightedLine content={line.content} language={language} />
        ) : (
          line.content || " "
        )}
      </td>
    </tr>
  );
}

export function DiffContentUnified({
  groups,
  wordDiffEnabled,
  wrapLines,
  enableSyntaxHighlighting = true,
  language,
}: {
  groups: DiffGroup[];
  wordDiffEnabled: boolean;
  wrapLines: boolean;
  enableSyntaxHighlighting?: boolean;
  language?: string;
}) {
  const [expandedContexts, setExpandedContexts] = useState<Set<number>>(new Set());
  const toggleContext = useCallback((index: number) => {
    setExpandedContexts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {groups.map((group, gi) => {
            if (group.type === "hunk") {
              return (
                <tr key={gi} className="bg-[oklch(0.62_0.16_250/0.06)]">
                  <td
                    colSpan={3}
                    className="px-4 py-1.5 text-xs text-[oklch(0.62_0.16_250)] select-none font-medium"
                  >
                    {group.lines[0]?.content}
                  </td>
                </tr>
              );
            }
            if (group.type === "info") {
              return (
                <tr key={gi} className="bg-[oklch(0.20_0.02_250/0.5)]">
                  <td
                    colSpan={3}
                    className="px-4 py-1 text-xs text-[oklch(0.60_0.03_250)] italic select-none"
                  >
                    {group.lines[0]?.content}
                  </td>
                </tr>
              );
            }
            if (group.type === "context") {
              const { lines } = group;
              const shouldCollapse =
                lines.length > CONTEXT_COLLAPSE_THRESHOLD && !expandedContexts.has(gi);
              if (shouldCollapse) {
                const topLines = lines.slice(0, 3);
                const bottomLines = lines.slice(-3);
                const hiddenCount = lines.length - 6;
                return (
                  <React.Fragment key={gi}>
                    {topLines.map((line, li) => (
                      <UnifiedContextRow
                        key={`top-${li}`}
                        line={line}
                        wrapLines={wrapLines}
                        language={language}
                        enableSyntaxHighlighting={enableSyntaxHighlighting}
                      />
                    ))}
                    <tr>
                      <td colSpan={3} className="text-center py-1.5">
                        <button
                          onClick={() => toggleContext(gi)}
                          className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.60_0.03_250)] hover:text-[oklch(0.82_0.02_250)] transition-colors duration-150 bg-[oklch(0.20_0.02_250)] hover:bg-[oklch(0.24_0.02_250)] px-2.5 py-1 rounded-[4px] border border-[oklch(0.30_0.02_250)] cursor-pointer"
                        >
                          <ChevronsUpDown className="size-3" />
                          {hiddenCount} lines
                        </button>
                      </td>
                    </tr>
                    {bottomLines.map((line, li) => (
                      <UnifiedContextRow
                        key={`bot-${li}`}
                        line={line}
                        wrapLines={wrapLines}
                        language={language}
                        enableSyntaxHighlighting={enableSyntaxHighlighting}
                      />
                    ))}
                  </React.Fragment>
                );
              }
              return (
                <React.Fragment key={gi}>
                  {lines.map((line, li) => (
                    <UnifiedContextRow
                      key={li}
                      line={line}
                      wrapLines={wrapLines}
                      language={language}
                      enableSyntaxHighlighting={enableSyntaxHighlighting}
                    />
                  ))}
                </React.Fragment>
              );
            }
            if (group.type === "change") {
              const { deletions, additions } = group;
              const maxPairs = Math.min(deletions.length, additions.length);
              const wordDiffs = wordDiffEnabled
                ? Array.from({ length: maxPairs }, (_, i) =>
                    computeWordDiff(deletions[i]!.content, additions[i]!.content),
                  )
                : [];
              return (
                <React.Fragment key={gi}>
                  {deletions.map((line, li) => {
                    const wd = wordDiffEnabled && li < maxPairs ? wordDiffs[li] : null;
                    return (
                      <tr key={`del-${li}`} className="bg-[oklch(0.55_0.2_25/0.06)]">
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-[oklch(0.30_0.02_250/0.4)] text-[oklch(0.55_0.2_25/0.6)]">
                          {line.oldNum || ""}
                        </td>
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-[oklch(0.30_0.02_250/0.4)] text-[oklch(0.55_0.2_25/0.6)]" />
                        <td
                          className={cn(
                            "px-4 py-0.5 text-[oklch(0.70_0.12_25)]",
                            wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre",
                          )}
                        >
                          <span className="select-none text-[oklch(0.55_0.2_25/0.5)] mr-1">−</span>
                          {wd ? (
                            <WordDiffSegments segments={wd.oldSegments} side="old" />
                          ) : (
                            line.content || " "
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {additions.map((line, li) => {
                    const wd = wordDiffEnabled && li < maxPairs ? wordDiffs[li] : null;
                    return (
                      <tr key={`add-${li}`} className="bg-[oklch(0.55_0.15_155/0.06)]">
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-[oklch(0.30_0.02_250/0.4)] text-[oklch(0.55_0.15_155/0.6)]" />
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-[oklch(0.30_0.02_250/0.4)] text-[oklch(0.55_0.15_155/0.6)]">
                          {line.newNum || ""}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-0.5 text-[oklch(0.70_0.10_155)]",
                            wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre",
                          )}
                        >
                          <span className="select-none text-[oklch(0.55_0.15_155/0.5)] mr-1">+</span>
                          {wd ? (
                            <WordDiffSegments segments={wd.newSegments} side="new" />
                          ) : (
                            line.content || " "
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            }
            return null;
          })}
        </tbody>
      </table>
    </div>
  );
}
