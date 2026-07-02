import { sendTeamMemberAddedEmail, getAppUrl } from "../index";
import type { PrismaClient } from "@/server/db/client";

const ALLOWED_DOMAINS = [
  "dev-review-ai-silk.vercel.app",
  "localhost",
  "localhost:3000",
];

function buildTeamUrl(appUrl: string, teamSlug: string): string {
  if (!/^[a-zA-Z0-9-_]+$/.test(teamSlug)) {
    throw new Error(`Invalid team slug format: ${teamSlug}`);
  }

  const url = new URL(`${appUrl}/teams/${encodeURIComponent(teamSlug)}`);

  if (
    !ALLOWED_DOMAINS.includes(url.hostname) &&
    !url.hostname.endsWith(".localhost")
  ) {
    throw new Error(`Invalid URL domain: ${url.hostname}`);
  }

  return url.toString();
}

async function sendEmailWithRetry(
  sendEmailFn: () => Promise<{ success: boolean; error?: string }>,
  maxRetries: number = 3,
): Promise<{ success: boolean; error?: string; attempts: number }> {
  let lastError: string = "Unknown error";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendEmailFn();
      if (result.success) {
        return { success: true, attempts: attempt };
      }
      lastError = result.error || "Email send failed";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { success: false, error: lastError, attempts: maxRetries };
}

interface SendTeamInviteEmailParams {
  db: PrismaClient;
  teamId: string;
  invitedUserId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  inviterId: string;
}

export async function sendTeamInviteEmailNotification({
  db,
  teamId,
  invitedUserId,
  role,
  inviterId,
}: SendTeamInviteEmailParams): Promise<void> {
  try {
    const invitedUser = await db.user.findUnique({
      where: { id: invitedUserId },
      select: { 
        name: true, 
        email: true,
        accounts: {
          where: { providerId: "github" },
          select: { id: true }
        }
      },
    });

    if (!invitedUser || !invitedUser.email) {
      console.warn(
        `⚠️  Cannot send team invite email: user ${invitedUserId} not found or has no email`,
      );
      return;
    }

    const inviter = await db.user.findUnique({
      where: { id: inviterId },
      select: { name: true, email: true },
    });

    if (!inviter) {
      console.warn(
        `⚠️  Cannot send team invite email: inviter ${inviterId} not found`,
      );
      return;
    }

    // Get the team
    const team = await db.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, slug: true },
    });

    if (!team) {
      console.warn(
        `⚠️  Cannot send team invite email: team ${teamId} not found`,
      );
      return;
    }

    const appUrl = getAppUrl();

    const teamUrl = buildTeamUrl(appUrl, team.slug);

    const result = await sendEmailWithRetry(async () => {
      return sendTeamMemberAddedEmail({
        to: invitedUser.email,
        inviteeName: invitedUser.name || "Team Member",
        inviteeEmail: invitedUser.email,
        inviterName: inviter.name || "Team Admin",
        inviterEmail: inviter.email || "",
        teamName: team.name,
        teamId: team.id,
        teamSlug: team.slug,
        role: role,
        teamUrl,
        needsGithubConnection: invitedUser.accounts.length === 0,
      });
    });

    if (!result.success) {
      console.error(
        `❌ Failed to send team invite email to ${invitedUser.email} after ${result.attempts} attempts:`,
        result.error,
      );

      await createFallbackNotification({
        db,
        userId: invitedUserId,
        teamId,
        teamName: team.name,
        role,
      });
    } else {
      console.log(
        `✅ Team invite email sent successfully to ${invitedUser.email} (attempt ${result.attempts})`,
      );
    }
  } catch (error) {
    console.error("❌ Error in sendTeamInviteEmailNotification:", error);

    try {
      const team = await db.team.findUnique({
        where: { id: teamId },
        select: { name: true },
      });

      if (team) {
        await createFallbackNotification({
          db,
          userId: invitedUserId,
          teamId,
          teamName: team.name,
          role,
        });
      }
    } catch (fallbackError) {
      console.error(
        "❌ Failed to create fallback notification:",
        fallbackError,
      );
    }
  }
}

async function createFallbackNotification({
  db,
  userId,
  teamId,
  teamName,
  role,
}: {
  db: PrismaClient;
  userId: string;
  teamId: string;
  teamName: string;
  role: string;
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId,
        type: "TEAM_INVITE",
        title: `You've been added to "${teamName}"`,
        message: `You have been added as a ${role.toLowerCase()} to the team. Please check your email for details.`,
        link: `/teams/${teamId}`,
      },
    });
    console.log(`✅ Fallback notification created for user ${userId}`);
  } catch (error) {
    console.error("❌ Failed to create fallback notification:", error);
    throw error; // Re-throw so caller knows fallback failed too
  }
}
