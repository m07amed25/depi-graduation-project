import type { ReviewComment } from "@/server/services/github";

type StoredFinding = {
  filePath?: string;
  filename?: string;
  file?: string;
  path?: string;
  line?: number;
  message?: string;
  text?: string;
  severity?: string;
  severityLevel?: string;
  category?: string;
  suggestion?: string;
  confidence?: number;
};

interface QualityMetricsData {
  complexity: number;
  maintainability: number;
  readability: number;
  testability: number;
}

export function buildProgressBar(
  value: number,
  max = 100,
  length = 20,
): string {
  const filled = Math.round((value / max) * length);
  return "█".repeat(filled) + "░".repeat(length - filled);
}

export function severityEmoji(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    default:
      return "🔵";
  }
}

export function riskEmoji(score: number): string {
  if (score < 25) return "🟢";
  if (score < 50) return "🟡";
  if (score < 75) return "🟠";
  return "🔴";
}

export function riskLabel(score: number): string {
  if (score < 25) return "Low Risk";
  if (score < 50) return "Medium Risk";
  if (score < 75) return "High Risk";
  return "Critical Risk";
}

export function qualityGrade(score: number): string {
  if (score >= 80) return "✅ Excellent";
  if (score >= 60) return "🟢 Good";
  if (score >= 40) return "⚠️ Fair";
  return "❌ Needs Work";
}

export function qualityLetter(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

function badgeUrl(
  label: string,
  message: string,
  color: string,
  opts: { style?: string; labelColor?: string } = {},
): string {
  const base = process.env.APP_BASE_URL ?? process.env.BETTER_AUTH_URL ?? "";
  const style = opts.style ?? "flat-square";
  const params = new URLSearchParams({
    label,
    message,
    color,
    style,
    ...(opts.labelColor ? { labelColor: opts.labelColor } : {}),
  });
  return `${base}/api/badge?${params.toString()}`;
}

export function badge(
  label: string,
  message: string,
  color: string,
  opts: { style?: string; labelColor?: string; link?: string } = {},
): string {
  const url = badgeUrl(label, message, color, opts);
  const alt = [label, message].filter(Boolean).join(": ");
  const img = `![${alt}](${url})`;
  return opts.link ? `[${img}](${opts.link})` : img;
}

export function riskBadgeColor(score: number): string {
  if (score < 25) return "#2ea44f";
  if (score < 50) return "#dbab09";
  if (score < 75) return "#e36209";
  return "#cb2431";
}

export function severityBadgeColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "important";
    case "medium":
      return "#dbab09";
    default:
      return "informational";
  }
}

export function qualityBadgeColor(score: number): string {
  if (score >= 80) return "#2ea44f";
  if (score >= 60) return "#28a745";
  if (score >= 40) return "#dbab09";
  return "#cb2431";
}

export function statusBadgeColor(
  hasCritical: boolean,
  hasFailed: boolean,
): string {
  if (hasFailed) return "critical";
  if (hasCritical) return "important";
  return "#2ea44f";
}

export function statusBadgeLabel(
  hasCritical: boolean,
  hasFailed: boolean,
): string {
  if (hasFailed) return "Error";
  if (hasCritical) return "Failed";
  return "Passed";
}

export type ReviewPayloadOptions = {
  repositoryId: string;
  reviewId: string;
  prTitle?: string;
  commitSha?: string;
  prNumber?: number;
  summary?: string | null;
  riskScore?: number | null;
  qualityMetrics?: unknown;
  overallStatus?: "COMPLETED" | "FAILED";
  hasHighSeverity?: boolean;
  includeInline?: boolean;
};

export function mapFindingsToReviewPayload(
  findings: unknown,
  repositoryId: string,
  reviewId: string,
  options?: Omit<ReviewPayloadOptions, "repositoryId" | "reviewId">,
): { body: string; inlineComments: ReviewComment[] } {
  const values = Array.isArray(findings) ? (findings as StoredFinding[]) : [];

  const appBaseUrl =
    process.env.APP_BASE_URL ?? process.env.BETTER_AUTH_URL ?? "";

  const prTitle = options?.prTitle ?? null;
  const commitSha = options?.commitSha ?? null;
  const prNumber = options?.prNumber ?? null;
  const reviewUrl =
    prNumber !== null
      ? `${appBaseUrl}/repo/${repositoryId}/pr/${prNumber}`
      : `${appBaseUrl}/repo/${repositoryId}`;
  const aiSummary = options?.summary ?? null;
  const riskScore = options?.riskScore ?? null;
  const overallStatus = options?.overallStatus ?? "COMPLETED";
  const qmRaw = options?.qualityMetrics;
  const qualityMetrics: QualityMetricsData | null =
    qmRaw &&
    typeof qmRaw === "object" &&
    !Array.isArray(qmRaw) &&
    "complexity" in (qmRaw as Record<string, unknown>)
      ? (qmRaw as QualityMetricsData)
      : null;

  const includeInline = options?.includeInline ?? true;
  const inlineComments: ReviewComment[] = [];
  const summaryFindings: StoredFinding[] = [];

  for (const finding of values) {
    const path =
      finding.filePath ?? finding.filename ?? finding.file ?? finding.path;
    if (
      includeInline &&
      path &&
      typeof finding.line === "number" &&
      finding.line > 0
    ) {
      const severity = (
        finding.severity ??
        finding.severityLevel ??
        "low"
      ).toUpperCase();
      const text = finding.message ?? finding.text ?? "Issue detected";
      const emoji = severityEmoji(severity);
      const sevBadge = badge(
        severity,
        "Code Catch",
        severityBadgeColor(severity),
        { style: "flat-square" },
      );
      const catBadge = finding.category
        ? ` ${badge("category", finding.category, "blueviolet", { style: "flat-square" })}`
        : "";
      const confBadge =
        typeof finding.confidence === "number"
          ? ` ${badge("confidence", `${finding.confidence}%`, qualityBadgeColor(finding.confidence), { style: "flat-square" })}`
          : "";
      const suggestionLine = finding.suggestion
        ? `\n\n> 💡 **Suggestion**\n> ${finding.suggestion}`
        : "";

      const body = [
        `${emoji} ${sevBadge}${catBadge}${confBadge}`,
        "",
        `**Finding:** ${text}`,
        suggestionLine,
        "",
        "---",
        `🤖 [View full review ↗](${reviewUrl})`,
      ].join("\n");

      inlineComments.push({ path, line: finding.line, body });
    } else {
      summaryFindings.push(finding);
    }
  }

  const counts = {
    critical: values.filter(
      (finding) =>
        (finding.severity ?? finding.severityLevel ?? "").toLowerCase() ===
        "critical",
    ).length,
    high: values.filter(
      (finding) =>
        (finding.severity ?? finding.severityLevel ?? "").toLowerCase() ===
        "high",
    ).length,
    medium: values.filter(
      (finding) =>
        (finding.severity ?? finding.severityLevel ?? "").toLowerCase() ===
        "medium",
    ).length,
    low: values.filter(
      (finding) =>
        (finding.severity ?? finding.severityLevel ?? "").toLowerCase() ===
        "low",
    ).length,
    info: values.filter(
      (finding) =>
        (finding.severity ?? finding.severityLevel ?? "").toLowerCase() ===
        "info",
    ).length,
  };
  const totalIssues = counts.critical + counts.high + counts.medium + counts.low;
  const hasCritical = counts.critical > 0;
  const hasFailed = overallStatus === "FAILED";

  const qualityOverall = qualityMetrics
    ? Math.round(
        (qualityMetrics.complexity +
          qualityMetrics.maintainability +
          qualityMetrics.readability +
          qualityMetrics.testability) /
          4,
      )
    : null;

  const lines: string[] = [];

  lines.push("## 🤖 Code Catch — Automated Code Review");
  lines.push("");

  const metaParts: string[] = [];
  if (prTitle) metaParts.push(`**PR:** ${prTitle}`);
  if (commitSha) metaParts.push(`**Commit:** \`${shortSha(commitSha)}\``);
  if (metaParts.length > 0) {
    lines.push(`> ${metaParts.join(" &nbsp;·&nbsp; ")}`);
    lines.push("");
  }

  const heroBadges: string[] = [];

  heroBadges.push(
    badge(
      "Review",
      statusBadgeLabel(hasCritical, hasFailed),
      statusBadgeColor(hasCritical, hasFailed),
      { style: "for-the-badge", labelColor: "#24292e", link: reviewUrl },
    ),
  );
  if (riskScore !== null) {
    heroBadges.push(
      badge("Risk Score", `${riskScore} of 100`, riskBadgeColor(riskScore), {
        style: "for-the-badge",
        link: reviewUrl,
      }),
    );
  }
  heroBadges.push(
    badge(
      "Issues",
      totalIssues === 0 ? "None" : String(totalIssues),
      totalIssues === 0 ? "brightgreen" : hasCritical ? "critical" : "orange",
      { style: "for-the-badge", link: reviewUrl },
    ),
  );
  if (qualityOverall !== null) {
    heroBadges.push(
      badge(
        "Quality",
        `${qualityLetter(qualityOverall)} (${qualityOverall}/100)`,
        qualityBadgeColor(qualityOverall),
        { style: "for-the-badge", link: reviewUrl },
      ),
    );
  }

  lines.push(heroBadges.join(" "));
  lines.push("");
  lines.push("---");
  lines.push("");

  if (riskScore !== null) {
    lines.push(`### ${riskEmoji(riskScore)} Risk Assessment`);
    lines.push("");
    lines.push("| | |");
    lines.push("|:---|:---|");
    lines.push(
      `| **Risk Score** | ${badge(riskLabel(riskScore), `${riskScore}/100`, riskBadgeColor(riskScore))} |`,
    );
    lines.push(
      `| **Total Issues** | **${totalIssues}**${inlineComments.length > 0 ? ` _(${inlineComments.length} inline comment${inlineComments.length !== 1 ? "s" : ""})_` : ""} |`,
    );
    lines.push("");
    lines.push(`\`Safe ${buildProgressBar(riskScore, 100, 24)} Critical\``);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  if (aiSummary) {
    lines.push("### 📝 AI Summary");
    lines.push("");
    lines.push(`> ${aiSummary.replace(/\n/g, "\n> ")}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  if (totalIssues > 0) {
    lines.push("### 📊 Issue Breakdown");
    lines.push("");

    const sevBadges: string[] = [];
    if (counts.critical > 0)
      sevBadges.push(
        badge("Critical", String(counts.critical), "critical", {
          style: "flat-square",
        }),
      );
    if (counts.high > 0)
      sevBadges.push(
        badge("High", String(counts.high), "important", {
          style: "flat-square",
        }),
      );
    if (counts.medium > 0)
      sevBadges.push(
        badge("Medium", String(counts.medium), "yellow", {
          style: "flat-square",
        }),
      );
    if (counts.low > 0)
      sevBadges.push(
        badge("Low", String(counts.low), "informational", {
          style: "flat-square",
        }),
      );
    if (counts.info > 0)
      sevBadges.push(
        badge("Info", String(counts.info), "lightgrey", {
          style: "flat-square",
        }),
      );
    lines.push(sevBadges.join(" "));
    lines.push("");

    lines.push("| Severity | Count | Distribution | Share |");
    lines.push("|:---------|------:|:-------------|------:|");
    const row = (emoji: string, label: string, count: number) => {
      const percentage = Math.round((count / totalIssues) * 100);
      return `| ${emoji} **${label}** | ${count} | \`${buildProgressBar(count, totalIssues, 14)}\` | ${percentage}% |`;
    };
    if (counts.critical > 0)
      lines.push(row("🔴", "Critical", counts.critical));
    if (counts.high > 0) lines.push(row("🟠", "High", counts.high));
    if (counts.medium > 0) lines.push(row("🟡", "Medium", counts.medium));
    if (counts.low > 0) lines.push(row("🔵", "Low", counts.low));
    lines.push(`| — | **${totalIssues}** | | 100% |`);
    lines.push("");
    if (counts.info > 0) {
      lines.push(
        `> ℹ️ **${counts.info}** informational note${counts.info !== 1 ? "s" : ""} (not counted as issues)`,
      );
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  if (qualityMetrics && qualityOverall !== null) {
    lines.push("### 📐 Quality Metrics");
    lines.push("");

    const qBadges = [
      badge(
        "Complexity",
        qualityLetter(qualityMetrics.complexity),
        qualityBadgeColor(qualityMetrics.complexity),
        { style: "flat-square" },
      ),
      badge(
        "Maintainability",
        qualityLetter(qualityMetrics.maintainability),
        qualityBadgeColor(qualityMetrics.maintainability),
        { style: "flat-square" },
      ),
      badge(
        "Readability",
        qualityLetter(qualityMetrics.readability),
        qualityBadgeColor(qualityMetrics.readability),
        { style: "flat-square" },
      ),
      badge(
        "Testability",
        qualityLetter(qualityMetrics.testability),
        qualityBadgeColor(qualityMetrics.testability),
        { style: "flat-square" },
      ),
      badge(
        "Overall",
        qualityLetter(qualityOverall),
        qualityBadgeColor(qualityOverall),
        { style: "flat-square" },
      ),
    ];
    lines.push(qBadges.join(" "));
    lines.push("");

    lines.push("| Metric | Score | Bar | Grade |");
    lines.push("|:-------|------:|:----|:------|");
    const qualityRow = (label: string, score: number) =>
      `| ${label} | ${score}/100 | \`${buildProgressBar(score, 100, 12)}\` | ${qualityGrade(score)} |`;
    lines.push(qualityRow("Complexity", qualityMetrics.complexity));
    lines.push(qualityRow("Maintainability", qualityMetrics.maintainability));
    lines.push(qualityRow("Readability", qualityMetrics.readability));
    lines.push(qualityRow("Testability", qualityMetrics.testability));
    lines.push(
      `| **Overall** | **${qualityOverall}/100** | \`${buildProgressBar(qualityOverall, 100, 12)}\` | **${qualityGrade(qualityOverall)}** |`,
    );
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  if (summaryFindings.length > 0) {
    lines.push("### ⚠️ General Findings");
    lines.push("");
    lines.push("<details>");
    lines.push(
      `<summary>📋 View ${summaryFindings.length} general finding${summaryFindings.length !== 1 ? "s" : ""}</summary>`,
    );
    lines.push("");
    for (const finding of summaryFindings) {
      const severity = (
        finding.severity ??
        finding.severityLevel ??
        "low"
      ).toUpperCase();
      const text = finding.message ?? finding.text ?? "Issue detected";
      const emoji = severityEmoji(severity);
      const sevBadge = badge(severity, "", severityBadgeColor(severity), {
        style: "flat-square",
      });
      const catBadge = finding.category
        ? ` ${badge("", finding.category, "blueviolet", { style: "flat-square" })}`
        : "";
      lines.push(`- ${emoji} ${sevBadge}${catBadge} ${text}`);
      if (finding.suggestion) {
        lines.push(`  > 💡 **Suggestion:** ${finding.suggestion}`);
      }
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
    lines.push("---");
    lines.push("");
  } else if (totalIssues === 0) {
    lines.push("### ✅ No Issues Found");
    lines.push("");
    lines.push(
      badge("Status", "Clean", "#2ea44f", {
        style: "for-the-badge",
      }),
    );
    lines.push("");
    lines.push(
      "> 🎉 Excellent! No issues were detected. The code appears clean, secure, and well-structured.",
    );
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  const footerBadge = badge("Code Catch", "Automated Review", "#24292e", {
    style: "flat-square",
    labelColor: "#586069",
    link: reviewUrl,
  });
  const footerParts = [footerBadge, `[📋 View Full Report](${reviewUrl})`];
  if (commitSha) footerParts.push(`Commit: \`${shortSha(commitSha)}\``);
  lines.push(`<sub>${footerParts.join(" · ")}</sub>`);

  return { body: lines.join("\n"), inlineComments };
}
