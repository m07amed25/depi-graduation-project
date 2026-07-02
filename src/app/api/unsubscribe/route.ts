import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("uid");
  const token = searchParams.get("token");

  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return new NextResponse("Invalid or expired unsubscribe link.", { status: 400 });
  }

  await db.user.update({
    where: { id: userId },
    data: { emailNotifications: false },
  });

  const appUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head><body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fafafa"><div style="text-align:center;max-width:400px;padding:2rem"><h1 style="font-size:1.25rem;margin-bottom:0.5rem">Unsubscribed</h1><p style="color:#a1a1aa;font-size:0.875rem">You will no longer receive newsletter emails from Code Catch.</p><a href="${appUrl}/settings" style="color:#6366f1;font-size:0.875rem">Manage preferences</a></div></body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
