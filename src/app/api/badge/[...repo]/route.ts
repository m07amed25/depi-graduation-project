/**
 * Dynamic review-status badge endpoint.
 *
 * Pattern:  GET /api/badge/:owner/:repo
 *
 * Returns an SVG badge showing the latest completed review's risk score and
 * pass/fail status for the given GitHub repository, so owners can embed it
 * directly in their README:
 *
 *   [![Code Catch](https://your-app.com/api/badge/owner/repo)](https://your-app.com)
 *
 * Query params (all optional):
 *   style          – badge-maker style (flat-square*, flat, plastic, …)
 *   label          – override the left-hand label (default "Code Catch")
 */

import { NextRequest, NextResponse } from "next/server";
import { makeBadge, type Format } from "badge-maker";
import { db } from "@/server/db";
import { GITHUB_OWNER_RE, GITHUB_REPO_RE } from "@/lib/constants";

/** Permitted badge-maker style values. */
const ALLOWED_STYLES: ReadonlySet<string> = new Set([
  "flat",
  "flat-square",
  "plastic",
  "for-the-badge",
  "social",
]);

function riskColor(score: number): string {
  if (score < 25) return "#2ea44f"; // green
  if (score < 50) return "#dbab09"; // yellow
  if (score < 75) return "#e36209"; // orange
  return "#cb2431"; // red
}

function statusColor(
  state: "pending" | "success" | "failure" | "error",
): string {
  switch (state) {
    case "success":
      return "#2ea44f";
    case "failure":
      return "#cb2431";
    case "error":
      return "#e05d44";
    default:
      return "#9f9f9f";
  }
}

function statusMessage(
  riskScore: number | null,
  checkState: string | null,
): string {
  if (riskScore === null) return "no score";
  if (checkState === "SUCCESS") return `${riskScore}/100 passing`;
  if (checkState === "FAILURE") return `${riskScore}/100 failing`;
  if (checkState === "ERROR") return `${riskScore}/100 error`;
  return `${riskScore}/100`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string[] }> },
): Promise<NextResponse> {
  const { repo: segments } = await params;

  // Expect exactly two path segments: owner + repo name
  if (!segments || segments.length < 2) {
    return svgError("invalid path");
  }

  const owner = segments[0]!;
  const repoName = segments.slice(1).join("/");

  if (!GITHUB_OWNER_RE.test(owner) || !GITHUB_REPO_RE.test(repoName)) {
    return svgError("invalid path");
  }

  const fullName = `${owner}/${repoName}`;

  const { searchParams } = request.nextUrl;
  const rawStyle = searchParams.get("style") ?? "flat-square";
  const style = ALLOWED_STYLES.has(rawStyle)
    ? (rawStyle as Format["style"])
    : "flat-square";
  const customLabel = searchParams.get("label") ?? "Code Catch";

  // ── Fetch latest completed review for this repo ──────────────────────────
  const repository = await db.repository.findFirst({
    where: { fullName },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (!repository) {
    return svgBadge(customLabel, "not connected", "#9f9f9f", style);
  }

  const latestReview = await db.review.findFirst({
    where: {
      repositoryId: repository.id,
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
    select: {
      riskScore: true,
      githubStatusCheck: { select: { state: true } },
    },
  });

  if (!latestReview) {
    // No completed review yet — show a neutral "pending" badge
    return svgBadge(customLabel, "no reviews", "#9f9f9f", style);
  }

  const riskScore = latestReview.riskScore;
  const checkState = latestReview.githubStatusCheck?.state ?? null;
  const message = statusMessage(riskScore, checkState);
  const color =
    riskScore !== null
      ? riskColor(riskScore)
      : statusColor(
          checkState === "SUCCESS"
            ? "success"
            : checkState === "FAILURE"
              ? "failure"
              : checkState === "ERROR"
                ? "error"
                : "pending",
        );

  return svgBadge(customLabel, message, color, style);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function svgBadge(
  label: string,
  message: string,
  color: string,
  style: Format["style"],
): NextResponse {
  const svg = makeBadge({ label, message, color, style });
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      // Short max-age so README embeds refresh reasonably quickly.
      "Cache-Control":
        "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

function svgError(reason: string): NextResponse {
  const svg = makeBadge({
    label: "Code Catch",
    message: reason,
    color: "#e05d44",
    style: "flat-square",
  });
  return new NextResponse(svg, {
    status: 400,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
