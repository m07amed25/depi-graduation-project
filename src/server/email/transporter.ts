import nodemailer, { type Transporter } from "nodemailer";
import type { EmailServiceConfig } from "@/types/email";

function getEmailConfig(): EmailServiceConfig {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const fromName = process.env.SMTP_FROM_NAME || "Code Catch";

  if (!host || !user || !pass || !from) {
    console.warn(
      "⚠️  SMTP configuration incomplete. Emails will be logged but not sent.",
      {
        hasHost: !!host,
        hasUser: !!user,
        hasPass: !!pass,
        hasFrom: !!from,
      },
    );
  }

  return {
    host: host || "smtp.ethereal.email",
    port,
    secure: port === 465,
    auth: {
      user: user || "test@ethereal.email",
      pass: pass || "testpassword",
    },
    from: from || "Code Catch <noreply@code-catch.app>",
    fromName,
  };
}

export function createEmailTransporter(): Transporter {
  const config = getEmailConfig();

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  console.log("📧 Email transporter configured:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    from: config.from,
  });

  return transporter;
}

export async function verifyEmailConnection(
  transporter: Transporter,
): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("❌ SMTP connection failed:", error);
    return false;
  }
}

export function getFromAddress(): string {
  const config = getEmailConfig();
  return config.from;
}

export function getAppUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

let emailTransporter: Transporter | null = null;

export function getEmailTransporter(): Transporter {
  if (!emailTransporter) {
    emailTransporter = createEmailTransporter();
  }
  return emailTransporter;
}
