import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/server/pusher";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

/**
 * Validates that the authenticated user is authorized to subscribe to the
 * requested Pusher channel. Returns true if access is allowed.
 */
async function authorizeChannel(
  userId: string,
  channel: string,
): Promise<boolean> {
  // Public channels (no prefix) are always allowed
  if (!channel.startsWith("private-") && !channel.startsWith("presence-")) {
    return true;
  }

  // User-specific channels: presence-user-{userId} or private-user-{userId}
  const userMatch = channel.match(/^(?:private|presence)-user-(.+)$/);
  if (userMatch) {
    return userMatch[1] === userId;
  }

  // Team channels: presence-team-{teamId} or private-team-{teamId}
  const teamMatch = channel.match(/^(?:private|presence)-team-(.+)$/);
  if (teamMatch) {
    const membership = await db.teamMember.findFirst({
      where: { teamId: teamMatch[1], userId },
      select: { id: true },
    });
    return !!membership;
  }

  // Review channels: presence-review-{reviewId} or private-review-{reviewId}
  const reviewMatch = channel.match(/^(?:private|presence)-review-(.+)$/);
  if (reviewMatch) {
    const review = await db.review.findFirst({
      where: {
        id: reviewMatch[1],
        OR: [
          { userId },
          { repository: { user: { teamMembers: { some: { userId } } } } },
        ],
      },
      select: { id: true },
    });
    return !!review;
  }

  // Repo channels: presence-repo-{repoId}, private-repo-{repoId},
  // presence-repository-{repoId}, or private-repository-{repoId}
  const repoMatch = channel.match(/^(?:private|presence)-repo(?:sitory)?-(.+)$/);
  if (repoMatch) {
    const repo = await db.repository.findFirst({
      where: {
        id: repoMatch[1],
        OR: [
          { userId },
          { team: { members: { some: { userId } } } },
        ],
      },
      select: { id: true },
    });
    return !!repo;
  }

  // Deny access to unrecognized channel patterns
  return false;
}

/**
 * POST /api/pusher/auth
 * Authenticates the current user for Pusher private/presence channels
 * with channel-level authorization checks.
 */
export async function POST(req: NextRequest) {
  const pusher = getPusherServer();
  if (!pusher) {
    return NextResponse.json(
      { error: "Real-time features are not configured" },
      { status: 503 },
    );
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.formData();
  const socketId = body.get("socket_id") as string;
  const channel = body.get("channel_name") as string;

  if (!socketId || !channel) {
    return NextResponse.json(
      { error: "Missing socket_id or channel_name" },
      { status: 400 },
    );
  }

  // Verify the user has access to this specific channel
  const allowed = await authorizeChannel(session.user.id, channel);
  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden: no access to this channel" },
      { status: 403 },
    );
  }

  const presenceData = {
    user_id: session.user.id,
    user_info: {
      name: session.user.name,
      image: session.user.image,
    },
  };

  const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
  return NextResponse.json(authResponse);
}
