import { getEmailTransporter, getFromAddress, getAppUrl } from "./transporter";
import { renderTeamMemberAddedEmail } from "./templates/team-member-added";
import { renderReviewCompletedEmail } from "./templates/review-completed";
import { renderGithubConnectionWarningEmail } from "./templates/github-connection-warning";
import { renderSupportReplyEmail } from "./templates/support-reply";
import { renderAdminPromotedEmail } from "./templates/admin-promoted";
import { renderAdminDemotedEmail } from "./templates/admin-demoted";
import { renderSecurityAlertEmail } from "./templates/security-alert";
import { renderPasswordResetEmail } from "@/features/auth";
import { renderPlanChangedEmail } from "./templates/plan-changed";
import { renderRefundEmail } from "./templates/refund";
import type { RefundEmailParams } from "./templates/refund";
import { renderBroadcastEmail } from "./templates/broadcast";
import type {
  TeamMemberAddedEmailParams,
  ReviewCompletionEmailParams,
  GithubConnectionWarningEmailParams,
  SupportReplyEmailParams,
  AdminPromotedEmailParams,
  AdminDemotedEmailParams,
  SecurityAlertEmailParams,
  PlanChangedEmailParams,
  EmailSendResult,
} from "@/types/email";

export interface PasswordResetEmailParams {
  to: string;
  userName: string;
  resetUrl: string;
}

/**
 * Send an email using nodemailer
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<EmailSendResult> {
  const transporter = getEmailTransporter();
  const fromAddress = getFromAddress();

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to ${to}:`, info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      console.warn("⚠️  SMTP not configured. Email logged but not sent.", {
        to,
        subject,
      });
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send team member added notification email
 */
export async function sendTeamMemberAddedEmail(
  params: TeamMemberAddedEmailParams,
): Promise<EmailSendResult> {
  const { to, teamName } = params;
  const appUrl = getAppUrl();

  try {
    // Generate HTML content using react-email
    const html = await renderTeamMemberAddedEmail(params);

    const subject = `You've been added to the "${teamName}" team`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating team member added email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send review completed notification email
 */
export async function sendReviewCompletedEmail(
  params: ReviewCompletionEmailParams,
): Promise<EmailSendResult> {
  const { to, prNumber, reviewStatus } = params;

  try {
    // Generate HTML content using react-email
    const html = await renderReviewCompletedEmail(params);

    const subject = `Review completed for PR #${prNumber} - ${reviewStatus.label}`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating review completed email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send GitHub connection warning email
 */
export async function sendGithubConnectionWarningEmail(
  params: GithubConnectionWarningEmailParams,
): Promise<EmailSendResult> {
  const { to } = params;

  try {
    const html = await renderGithubConnectionWarningEmail(params);
    const subject = `Action Required: Connect GitHub to Code Catch`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error(
      "❌ Error generating GitHub connection warning email:",
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send support reply email
 */
export async function sendSupportReplyEmail(
  params: SupportReplyEmailParams,
): Promise<EmailSendResult> {
  const { to } = params;

  try {
    const html = await renderSupportReplyEmail(params);
    const subject = `Re: Support Inquiry Response - Code Catch`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating support reply email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

export async function sendAdminPromotedEmail(
  params: AdminPromotedEmailParams,
): Promise<EmailSendResult> {
  const { to } = params;

  try {
    const html = await renderAdminPromotedEmail(params);
    const subject = `Congratulations! You've been promoted to Admin - Code Catch`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating admin promoted email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

export async function sendAdminDemotedEmail(
  params: AdminDemotedEmailParams,
): Promise<EmailSendResult> {
  const { to } = params;

  try {
    const html = await renderAdminDemotedEmail(params);
    const subject = `Administrator privileges revoked - Code Catch`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating admin demoted email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

export async function sendTestEmail(to: string): Promise<EmailSendResult> {
  const appUrl = getAppUrl();

  const testHtml = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111;">Test Email from Code Catch</h2>
      <p style="color: #333; line-height: 1.6;">
        This is a test email to verify your SMTP configuration is working correctly.
      </p>
      <p style="color: #333; line-height: 1.6;">
        If you're receiving this email, your email notifications are set up properly!
      </p>
      <a
        href="${appUrl}"
        style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; border-radius: 6px; text-decoration: none; margin-top: 8px;"
      >
        Go to App
      </a>
    </div>
  `;

  return sendEmail(to, "Test Email - Code Catch", testHtml);
}

/**
 * Send security alert email when critical/high severity issues are found
 */
export async function sendSecurityAlertEmail(
  params: SecurityAlertEmailParams,
): Promise<EmailSendResult> {
  const { to, repositoryName, prNumber, criticalCount, highCount } = params;

  try {
    const html = await renderSecurityAlertEmail(params);

    const severityLabel =
      criticalCount > 0
        ? `${criticalCount} critical${highCount > 0 ? ` & ${highCount} high` : ""}`
        : `${highCount} high`;

    const subject = `⚠️ Security Alert: ${severityLabel} issue${criticalCount + highCount !== 1 ? "s" : ""} in ${repositoryName} PR #${prNumber}`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating security alert email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  params: PasswordResetEmailParams,
): Promise<EmailSendResult> {
  const { to, userName, resetUrl } = params;

  try {
    const html = await renderPasswordResetEmail(userName, resetUrl);
    return await sendEmail(to, "Reset your CodeCatch password", html);
  } catch (error) {
    console.error("❌ Error generating password reset email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send plan changed notification email
 */
export async function sendPlanChangedEmail(
  params: PlanChangedEmailParams,
): Promise<EmailSendResult> {
  const { to, newPlan } = params;

  try {
    const html = await renderPlanChangedEmail(params);
    const subject = `Your subscription has been updated to ${newPlan.toUpperCase()}`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating plan changed email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send a broadcast email to a user
 */
export async function sendBroadcastEmail(params: {
  to: string;
  subject: string;
  body: string;
  userName?: string;
  userId?: string;
  design?: {
    bgColor: string;
    containerBg: string;
    textColor: string;
    headingColor: string;
    linkColor: string;
    buttonBg: string;
    buttonTextColor: string;
    fontFamily: string;
    fontSize: string;
    headingSize: string;
    containerWidth: string;
    padding: string;
    borderRadius: string;
    logoPosition: "hidden" | "top" | "before-greeting" | "after-greeting";
    logoUrl: string;
    logoWidth: string;
    greetingText: string;
    showFooter: boolean;
    footerText: string;
    showUnsubscribe: boolean;
    headerImageUrl?: string;
    footerImageUrl?: string;
    bodyImages?: string[];
  };
}): Promise<EmailSendResult> {
  const { to, subject, body, userName, userId, design } = params;
  const appUrl = getAppUrl();

  try {
    let unsubscribeUrl: string | undefined;
    if (userId) {
      const { createUnsubscribeToken } = await import("@/lib/unsubscribe-token");
      const token = createUnsubscribeToken(userId);
      unsubscribeUrl = `${appUrl}/api/unsubscribe?uid=${userId}&token=${token}`;
    }

    const resolvedName = userName || "there";
    const resolvedSubject = subject
      .replace(/\{\{name\}\}/g, resolvedName)
      .replace(/\{\{userName\}\}/g, resolvedName)
      .replace(/\{\{email\}\}/g, to)
      .replace(/\{\{appUrl\}\}/g, appUrl);

    const resolvedBody = body
      .replace(/\{\{name\}\}/g, resolvedName)
      .replace(/\{\{userName\}\}/g, resolvedName)
      .replace(/\{\{email\}\}/g, to)
      .replace(/\{\{appUrl\}\}/g, appUrl);

    const html = await renderBroadcastEmail({
      subject: resolvedSubject,
      body: resolvedBody,
      userName,
      appUrl,
      design,
      unsubscribeUrl,
    });

    return await sendEmail(to, resolvedSubject, html);
  } catch (error) {
    console.error("❌ Error generating broadcast email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send a refund notification email
 */
export async function sendRefundEmail(
  params: RefundEmailParams,
): Promise<EmailSendResult> {
  const { to, planName, amount, currency } = params;

  try {
    const html = await renderRefundEmail(params);
    const subject = `Refund Processed - ${amount} ${currency} credited to your account`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("Error generating refund email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}
