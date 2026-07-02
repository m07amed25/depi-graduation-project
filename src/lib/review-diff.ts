export type Finding = {
  file: string;
  line: number;
  severity: string;
  category?: string;
  message: string;
  suggestion?: string;
  confidence?: number;
};

export function computeReviewDiff(
  previousFindings: Finding[],
  currentFindings: Finding[],
) {
  const matchedCurrent = new Set<Finding>();
  const matchedPrevious = new Set<Finding>();

  const fixed: Finding[] = [];
  const persisted: Finding[] = [];
  const newFindings: Finding[] = [];

  for (const prev of previousFindings) {
    // Find a matching finding in the current review
    // Must be same file, same severity, and line number within 3 lines (to account for minor shifts or AI variance)
    const match = currentFindings.find(
      (curr) =>
        !matchedCurrent.has(curr) &&
        curr.file === prev.file &&
        curr.severity === prev.severity &&
        Math.abs(curr.line - prev.line) <= 3,
    );

    if (match) {
      persisted.push(match); // Show the new wording/line number
      matchedCurrent.add(match);
      matchedPrevious.add(prev);
    } else {
      fixed.push(prev);
    }
  }

  for (const curr of currentFindings) {
    if (!matchedCurrent.has(curr)) {
      newFindings.push(curr);
    }
  }

  return { fixed, persisted, newFindings };
}
