import { inngest } from "../client";
import { db } from "../../db";
import { sendBroadcastEmail } from "../../email/service";

interface EmailDesign {
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
  headerImageUrl: string;
  footerImageUrl: string;
  bodyImages: string[];
}

export const broadcastEmail = inngest.createFunction(
  { 
    id: "broadcast-email", 
    name: "Broadcast Email",
    triggers: [{ event: "app/email.broadcast" }]
  },
  async ({ event, step }) => {
    const { subject, body, target, userIds, design, forceSendAll } = event.data as {
      subject: string;
      body: string;
      target: "ALL" | "FREE" | "PRO" | "CUSTOM";
      userIds?: string[];
      design?: EmailDesign;
      forceSendAll?: boolean;
    };

    // 1. Fetch users based on target
    const users = await step.run("fetch-users", async () => {
      if (target === "CUSTOM" && userIds?.length) {
        return db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        });
      }

      const where: any = {};
      if (target === "FREE") {
        where.planId = "free";
      } else if (target === "PRO") {
        where.planId = { not: "free" };
      }
      if (!forceSendAll) {
        where.emailNotifications = true;
      }

      return db.user.findMany({
        where,
        select: { id: true, email: true, name: true },
      });
    });

    // 2. Send emails in chunks
    const CHUNK_SIZE = 10;
    const results = [];

    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
      const chunk = users.slice(i, i + CHUNK_SIZE);
      
      const chunkResults = await step.run(`send-chunk-${i}`, async () => {
        const sent = [];
        for (const user of chunk) {
          sent.push(
            await sendBroadcastEmail({
              to: user.email,
              subject,
              body,
              userName: user.name || undefined,
              userId: user.id,
              design,
            })
          );
          await new Promise((r) => setTimeout(r, 2000));
        }
        return sent;
      });
      
      results.push(...chunkResults);
      await step.sleep(`pause-after-chunk-${i}`, "5s");
    }

    return {
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      total: users.length,
    };
  }
);
