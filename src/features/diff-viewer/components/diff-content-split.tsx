import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DiffGroup,
  ParsedLine,
  DiffSegment,
  computeWordDiff,
} from "./diff-algorithm";
import { WordDiffSegments } from "./diff-content-unified";
import { HighlightedLine } from "./syntax-highlighter";

interface SplitRow {
  left: { line: ParsedLine | null; segments?: DiffSegment[] };
  right: { line: ParsedLine | null; segments?: DiffSegment[] };
  isHunk?: boolean;
  isInfo?: boolean;
  hunkContent?: string;
}

function buildSplitRows(groups: DiffGroup[], wordDiffEnabled: boolean): SplitRow[] {
  const rows: SplitRow[] = [];
  for (const group of groups) {
    if (group.type === "hunk") {
      rows.push({ left: { line: null }, right: { line: null }, isHunk: true, hunkContent: group.lines[0]?.content });
    } else if (group.type === "info") {
      rows.push({ left: { line: null }, right: { line: null }, isInfo: true, hunkContent: group.lines[0]?.content });
    } else if (group.type === "context") {
      for (const line of group.lines) rows.push({ left: { line }, right: { line } });
    } else if (group.type === "change") {
      const { deletions, additions } = group;
      const maxLen = Math.max(deletions.length, additions.length);
      const minLen = Math.min(deletions.length, additions.length);
      const wordDiffs = wordDiffEnabled
        ? Array.from({ length: minLen }, (_, i) => computeWordDiff(deletions[i]!.content, additions[i]!.content))
        : [];
      for (let i = 0; i < maxLen; i++) {
        const del = i < deletions.length ? deletions[i]! : null;
        const add = i < additions.length ? additions[i]! : null;
        const wd = wordDiffEnabled && i < minLen ? wordDiffs[i] : null;
        rows.push({
          left: { line: del, segments: wd?.oldSegments },
          right: { line: add, segments: wd?.newSegments },
        });
      }
    }
  }
  return rows;
}

export function DiffContentSplit({
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
  const rows = useMemo(() => buildSplitRows(groups, wordDiffEnabled), [groups, wordDiffEnabled]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse table-fixed md:table-auto">
        <colgroup>
          <col className="w-12" />
          <col />
          <col className="w-12" />
          <col />
        </colgroup>
        <tbody>
          {rows.map((row, ri) => {
            if (row.isHunk) {
              return (
                <tr key={ri} className="bg-[oklch(0.62_0.16_250/0.06)]">
                  <td colSpan={4} className="px-4 py-1.5 text-xs text-[oklch(0.62_0.16_250)] select-none text-center font-medium">
                    {row.hunkContent}
                  </td>
                </tr>
              );
            }
            if (row.isInfo) {
              return (
                <tr key={ri} className="bg-[oklch(0.20_0.02_250/0.5)]">
                  <td colSpan={4} className="px-4 py-1 text-xs text-[oklch(0.60_0.03_250)] italic select-none text-center">
                    {row.hunkContent}
                  </td>
                </tr>
              );
            }
            const leftLine = row.left.line;
            const rightLine = row.right.line;
            const leftIsChange = leftLine?.type === "deletion";
            const rightIsChange = rightLine?.type === "addition";
            return (
              <tr key={ri} className="group/line">
                <td
                  className={cn(
                    "w-12 px-2 py-0.5 text-right select-none border-r border-[oklch(0.30_0.02_250/0.4)]",
                    leftIsChange ? "text-[oklch(0.55_0.2_25/0.6)]" : "text-[oklch(0.40_0.03_250)]",
                  )}
                >
                  {leftLine?.oldNum || leftLine?.newNum || ""}
                </td>
                <td
                  className={cn(
                    "px-3 py-0.5 border-r border-[oklch(0.30_0.02_250/0.3)]",
                    leftIsChange
                      ? "bg-[oklch(0.55_0.2_25/0.06)] text-[oklch(0.70_0.12_25)]"
                      : leftLine
                        ? "hover:bg-[oklch(0.20_0.02_250/0.5)] transition-colors duration-150"
                        : "bg-[oklch(0.16_0.025_250/0.5)]",
                    wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre",
                  )}
                >
                  {leftLine ? (
                    row.left.segments ? (
                      <WordDiffSegments segments={row.left.segments} side="old" />
                    ) : enableSyntaxHighlighting && !leftIsChange ? (
                      <HighlightedLine content={leftLine.content} language={language} />
                    ) : (
                      leftLine.content || " "
                    )
                  ) : null}
                </td>
                <td
                  className={cn(
                    "w-12 px-2 py-0.5 text-right select-none border-r border-[oklch(0.30_0.02_250/0.4)]",
                    rightIsChange ? "text-[oklch(0.55_0.15_155/0.6)]" : "text-[oklch(0.40_0.03_250)]",
                  )}
                >
                  {rightLine?.newNum || rightLine?.oldNum || ""}
                </td>
                <td
                  className={cn(
                    "px-3 py-0.5",
                    rightIsChange
                      ? "bg-[oklch(0.55_0.15_155/0.06)] text-[oklch(0.70_0.10_155)]"
                      : rightLine
                        ? "hover:bg-[oklch(0.20_0.02_250/0.5)] transition-colors duration-150"
                        : "bg-[oklch(0.16_0.025_250/0.5)]",
                    wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre",
                  )}
                >
                  {rightLine ? (
                    row.right.segments ? (
                      <WordDiffSegments segments={row.right.segments} side="new" />
                    ) : enableSyntaxHighlighting && !rightIsChange ? (
                      <HighlightedLine content={rightLine.content} language={language} />
                    ) : (
                      rightLine.content || " "
                    )
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
