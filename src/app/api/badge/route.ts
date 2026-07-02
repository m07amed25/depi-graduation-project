import { NextRequest, NextResponse } from "next/server";
import { makeBadge, type Format } from "badge-maker";

const ALLOWED_STYLES = new Set([
  "flat",
  "flat-square",
  "plastic",
  "for-the-badge",
  "social",
]);

const COLOR_ALIASES: Record<string, string> = {
  critical: "#e05d44",
  important: "#fe7d37",
  success: "#4c1",
  informational: "#007ec6",
  inactive: "#9f9f9f",
};

function resolveColor(raw: string): string {
  return COLOR_ALIASES[raw.toLowerCase()] ?? raw;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const label = searchParams.get("label") ?? "";
  const message =
    searchParams.get("message") ?? searchParams.get("value") ?? "";
  const color = resolveColor(searchParams.get("color") ?? "lightgrey");
  const labelColor = resolveColor(searchParams.get("labelColor") ?? "#555");
  const rawStyle = searchParams.get("style") ?? "flat-square";
  const style = ALLOWED_STYLES.has(rawStyle)
    ? (rawStyle as Format["style"])
    : "flat-square";

  let svg: string;
  try {
    svg = makeBadge({ label, message, color, labelColor, style });
  } catch {
    svg = makeBadge({
      label: "badge",
      message: "error",
      color: "#e05d44",
      style: "flat-square",
    });
  }

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
