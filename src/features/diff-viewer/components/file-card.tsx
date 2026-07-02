"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  FilePlus,
  FileMinus,
  FileEdit,
  FileText,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiffFile, ViewMode, parsePatch, groupLines } from "./diff-algorithm";
import { getLanguageInfo } from "./language-map";
import { DiffContentUnified } from "./diff-content-unified";
import { DiffContentSplit } from "./diff-content-split";

function getStatusIcon(status: string) {
  switch (status) {
    case "added":
      return FilePlus;
    case "removed":
      return FileMinus;
    case "modified":
    case "changed":
    case "renamed":
      return FileEdit;
    default:
      return FileText;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "added":
      return "text-[oklch(0.55_0.15_155)] bg-[oklch(0.55_0.15_155/0.12)]";
    case "removed":
      return "text-[oklch(0.55_0.2_25)] bg-[oklch(0.55_0.2_25/0.12)]";
    case "modified":
    case "changed":
      return "text-[oklch(0.65_0.15_75)] bg-[oklch(0.65_0.15_75/0.12)]";
    case "renamed":
      return "text-[oklch(0.62_0.16_250)] bg-[oklch(0.62_0.16_250/0.12)]";
    default:
      return "text-[oklch(0.60_0.03_250)] bg-[oklch(0.40_0.03_250/0.12)]";
  }
}

function DiffContentRouter({
  patch,
  viewMode,
  wordDiffEnabled,
  wrapLines,
  enableSyntaxHighlighting,
  language,
}: {
  patch: string;
  viewMode: ViewMode;
  wordDiffEnabled: boolean;
  wrapLines: boolean;
  enableSyntaxHighlighting?: boolean;
  language?: string;
}) {
  const hunks = useMemo(() => parsePatch(patch), [patch]);
  const groups = useMemo(() => groupLines(hunks), [hunks]);
  if (viewMode === "split")
    return (
      <DiffContentSplit
        groups={groups}
        wordDiffEnabled={wordDiffEnabled}
        wrapLines={wrapLines}
        enableSyntaxHighlighting={enableSyntaxHighlighting}
        language={language}
      />
    );
  return (
    <DiffContentUnified
      groups={groups}
      wordDiffEnabled={wordDiffEnabled}
      wrapLines={wrapLines}
      enableSyntaxHighlighting={enableSyntaxHighlighting}
      language={language}
    />
  );
}

export function DiffFileCard({
  file,
  expanded,
  onToggle,
  viewMode,
  wordDiffEnabled,
  wrapLines,
  enableSyntaxHighlighting = true,
}: {
  file: DiffFile;
  expanded: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
  wordDiffEnabled: boolean;
  wrapLines: boolean;
  enableSyntaxHighlighting?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const StatusIcon = getStatusIcon(file.status);
  const statusColor = getStatusColor(file.status);
  const langInfo = getLanguageInfo(file.filename);

  const copyFilename = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.filename);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathParts = file.filename.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <div className="border-b border-[oklch(0.30_0.02_250)]">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2.5 w-full px-3 py-2.5 text-left transition-colors duration-150",
          "hover:bg-[oklch(0.20_0.02_250)] group cursor-pointer",
          expanded && "bg-[oklch(0.18_0.025_250)]",
        )}
      >
        <ChevronRight
          className={cn(
            "size-3.5 text-[oklch(0.60_0.03_250)] shrink-0 transition-transform duration-150",
            expanded && "rotate-90",
          )}
        />
        <div className={cn("p-1 rounded-[4px] shrink-0", statusColor)}>
          <StatusIcon className="size-3.5" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          {directory && (
            <span className="text-xs text-[oklch(0.60_0.03_250)] font-mono truncate">
              {directory}/
            </span>
          )}
          <span className="text-[0.8125rem] font-mono font-medium text-[oklch(0.82_0.02_250)] truncate">
            {fileName}
          </span>
          {langInfo && (
            <span className="text-[0.6875rem] px-1.5 py-0.5 rounded-[4px] font-medium shrink-0 bg-[oklch(0.20_0.02_250)] text-[oklch(0.60_0.03_250)]">
              {langInfo.lang}
            </span>
          )}
          {file.previousFilename && (
            <span className="text-[0.6875rem] font-mono text-[oklch(0.60_0.03_250)] shrink-0">
              ← {file.previousFilename.split("/").pop()}
            </span>
          )}
          {file.changes > 300 && (
            <span className="text-[0.6875rem] px-1.5 py-0.5 rounded-[4px] shrink-0 bg-[oklch(0.65_0.15_75/0.12)] text-[oklch(0.65_0.15_75)] flex items-center gap-1">
              <AlertCircle className="size-3" />
              Large
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            role="button"
            tabIndex={-1}
            onClick={copyFilename}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-[4px] hover:bg-[oklch(0.24_0.02_250)]"
          >
            {copied ? (
              <Check className="size-3 text-[oklch(0.55_0.15_155)]" />
            ) : (
              <Copy className="size-3 text-[oklch(0.60_0.03_250)]" />
            )}
          </div>
          <div className="hidden sm:flex items-center gap-px">
            {Array.from({ length: Math.min(5, file.additions) }).map((_, i) => (
              <div
                key={`a-${i}`}
                className="w-[3px] h-2.5 rounded-sm bg-[oklch(0.55_0.15_155)]"
              />
            ))}
            {Array.from({ length: Math.min(5, file.deletions) }).map((_, i) => (
              <div
                key={`d-${i}`}
                className="w-[3px] h-2.5 rounded-sm bg-[oklch(0.55_0.2_25)]"
              />
            ))}
            {file.additions + file.deletions === 0 && (
              <div className="w-[3px] h-2.5 rounded-sm bg-[oklch(0.40_0.03_250)]" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
            <span className="text-[oklch(0.55_0.15_155)]">+{file.additions}</span>
            <span className="text-[oklch(0.55_0.2_25)]">-{file.deletions}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="bg-[oklch(0.14_0.025_250)] border-t border-[oklch(0.30_0.02_250/0.6)]">
          {file.patch ? (
            <DiffContentRouter
              patch={file.patch}
              viewMode={viewMode}
              wordDiffEnabled={wordDiffEnabled}
              wrapLines={wrapLines}
              enableSyntaxHighlighting={enableSyntaxHighlighting}
              language={langInfo?.lang.toLowerCase()}
            />
          ) : (
            <div className="py-8 text-center text-[0.8125rem] text-[oklch(0.60_0.03_250)]">
              <FileText className="size-6 mx-auto mb-2 opacity-40" />
              <p>No diff available for this file.</p>
              <p className="text-xs mt-1 text-[oklch(0.40_0.03_250)]">
                Binary file or too large to display.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
