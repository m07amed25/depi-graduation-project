export interface DiffFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previousFilename?: string;
}

export type ViewMode = "unified" | "split";
export type FileStatusFilter =
  | "all"
  | "added"
  | "modified"
  | "removed"
  | "renamed";

export interface DiffSegment {
  text: string;
  type: "common" | "added" | "removed";
}

export interface ParsedLine {
  content: string;
  type: "context" | "addition" | "deletion" | "hunk" | "info";
  oldNum?: number;
  newNum?: number;
}

export interface ParsedHunk {
  header: string;
  lines: ParsedLine[];
  oldStart: number;
  newStart: number;
}

export interface DiffGroup {
  type: "hunk" | "info" | "context" | "change";
  lines: ParsedLine[];
  deletions: ParsedLine[];
  additions: ParsedLine[];
}

export function tokenize(str: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < str.length) {
    if (/\w/.test(str[i]!)) {
      let word = "";
      while (i < str.length && /\w/.test(str[i]!)) word += str[i++];
      tokens.push(word);
    } else {
      tokens.push(str[i++]!);
    }
  }
  return tokens;
}

export function computeWordDiff(
  oldStr: string,
  newStr: string,
): { oldSegments: DiffSegment[]; newSegments: DiffSegment[] } {
  const oldTokens = tokenize(oldStr);
  const newTokens = tokenize(newStr);
  const m = oldTokens.length;
  const n = newTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldTokens[i] === newTokens[j]) {
        dp[i]![j]! = (dp[i + 1]![j + 1] ?? 0) + 1;
      } else {
        dp[i]![j]! = Math.max(dp[i + 1]![j] ?? 0, dp[i]![j + 1] ?? 0);
      }
    }
  }
  const oldSegs: DiffSegment[] = [];
  const newSegs: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && oldTokens[i] === newTokens[j]) {
      oldSegs.push({ text: oldTokens[i]!, type: "common" });
      newSegs.push({ text: newTokens[j]!, type: "common" });
      i++;
      j++;
    } else if (
      j < n &&
      (i >= m || (dp[i]![j + 1] ?? 0) >= (dp[i + 1]![j] ?? 0))
    ) {
      newSegs.push({ text: newTokens[j]!, type: "added" });
      j++;
    } else {
      oldSegs.push({ text: oldTokens[i]!, type: "removed" });
      i++;
    }
  }
  return {
    oldSegments: mergeSegments(oldSegs),
    newSegments: mergeSegments(newSegs),
  };
}

export function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  const merged: DiffSegment[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

export function parsePatch(patch: string): ParsedHunk[] {
  const hunks: ParsedHunk[] = [];
  const lines = patch.split("\n");
  let current: ParsedHunk | null = null;
  let oldNum = 0;
  let newNum = 0;
  for (const raw of lines) {
    if (raw.startsWith("@@")) {
      const m = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      oldNum = m ? parseInt(m[1]!, 10) : 0;
      newNum = m ? parseInt(m[2]!, 10) : 0;
      current = {
        header: raw,
        lines: [{ content: raw, type: "hunk" }],
        oldStart: oldNum,
        newStart: newNum,
      };
      hunks.push(current);
    } else if (current) {
      if (raw.startsWith("+")) {
        current.lines.push({
          content: raw.slice(1),
          type: "addition",
          newNum: newNum++,
        });
      } else if (raw.startsWith("-")) {
        current.lines.push({
          content: raw.slice(1),
          type: "deletion",
          oldNum: oldNum++,
        });
      } else if (raw.startsWith("\\")) {
        current.lines.push({ content: raw, type: "info" });
      } else {
        const content = raw.startsWith(" ") ? raw.slice(1) : raw;
        current.lines.push({
          content,
          type: "context",
          oldNum: oldNum++,
          newNum: newNum++,
        });
      }
    }
  }
  return hunks;
}

export function groupLines(hunks: ParsedHunk[]): DiffGroup[] {
  const groups: DiffGroup[] = [];
  for (const hunk of hunks) {
    groups.push({
      type: "hunk",
      lines: [hunk.lines[0]!],
      deletions: [],
      additions: [],
    });
    let i = 1;
    const lines = hunk.lines;
    while (i < lines.length) {
      const line = lines[i]!;
      if (line.type === "info") {
        groups.push({
          type: "info",
          lines: [line],
          deletions: [],
          additions: [],
        });
        i++;
      } else if (line.type === "context") {
        const ctx: ParsedLine[] = [];
        while (i < lines.length && lines[i]!.type === "context")
          ctx.push(lines[i++]!);
        groups.push({
          type: "context",
          lines: ctx,
          deletions: [],
          additions: [],
        });
      } else if (line.type === "deletion" || line.type === "addition") {
        const dels: ParsedLine[] = [];
        const adds: ParsedLine[] = [];
        while (
          i < lines.length &&
          (lines[i]!.type === "deletion" || lines[i]!.type === "addition")
        ) {
          if (lines[i]!.type === "deletion") dels.push(lines[i++]!);
          else adds.push(lines[i++]!);
        }
        groups.push({
          type: "change",
          lines: [],
          deletions: dels,
          additions: adds,
        });
      } else {
        i++;
      }
    }
  }
  return groups;
}
