"use server";

import { db } from "@/server/db";
import { getEmailTransporter, getFromAddress } from "@/server/email/transporter";
import type { MessageCategory } from "@/server/db/client";

export type ContactState = {
  success?: boolean;
  error?: string;
} | null;

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const subject = formData.get("subject")?.toString().trim();
  const message = formData.get("message")?.toString().trim();
  const category = (formData.get("category")?.toString() || "CONTACT") as MessageCategory;

  if (!name || !email || !subject || !message) {
    return { error: "All fields are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (message.length < 10) {
    return { error: "Message must be at least 10 characters." };
  }

  try {
    await db.contactMessage.create({
      data: { name, email, subject, message, category },
    });

    // Also send email notification
    try {
      const transporter = getEmailTransporter();
      const from = getFromAddress();
      const to = process.env.CONTACT_EMAIL || "codecatch27@gmail.com";

      await transporter.sendMail({
        from,
        to,
        replyTo: email,
        subject: `[${category}] ${subject}`,
        html: `<h2>New ${category} Message</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><hr /><p>${message.replace(/\n/g, "<br />")}</p>`,
      });
    } catch {
      // Email failure is non-critical since message is saved to DB
    }

    return { success: true };
  } catch (e) {
    console.error("Contact form error:", e);
    return { error: "Failed to send message. Please try again." };
  }
}
