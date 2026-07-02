import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sso } from "@better-auth/sso";
import { db } from "../db";
import {
  sendGithubConnectionWarningEmail,
  sendPasswordResetEmail,
} from "../email";

const getTrustedOrigins = () => {
  const origins = ["http://localhost:3000"];

  if (process.env.BETTER_AUTH_URL) {
    origins.push(process.env.BETTER_AUTH_URL);
  }

  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  return origins;
};

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 300, // 5 minutes
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name || "User",
        resetUrl: url,
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scope: [
        "read:user",
        "user:email",
        "repo",
        "read:org",
        // write:repo_hook is sufficient — admin:repo_hook grants management of
        // ALL repos the user admins and is broader than needed.
        "write:repo_hook",
        "repo:status",
      ],
    },
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? {
          discord: {
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? {
          linkedin: {
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET
      ? {
          twitch: {
            clientId: process.env.TWITCH_CLIENT_ID,
            clientSecret: process.env.TWITCH_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? {
          apple: {
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  user: {
    // Expose the `role` and `banned` columns in every session response so the
    // middleware and client can gate on them without a DB round-trip.
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false, // never let the client set this during sign-up
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      bannedReason: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false,
      },
      planId: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // Disallow linking accounts with different emails to prevent account
      // takeover: an attacker with a GitHub account cannot silently link it
      // to a victim's email/password account without email verification.
      allowDifferentEmails: false,
      trustedProviders: [
        "credential",
        "github",
        "discord",
        "linkedin",
        "twitch",
        "apple",
      ],
      requireEmailVerification: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { banned: true, bannedReason: true },
          });
          if (user?.banned) {
            const reason = user.bannedReason ? `: ${user.bannedReason}` : ".";
            throw new APIError("FORBIDDEN", {
              message: `Your account has been banned${reason} Please contact support.`,
            });
          }
          return { data: session };
        },
        after: async (session) => {
          // Asynchronously check if user needs to connect GitHub
          // We don't await this so we don't slow down the login flow
          void (async () => {
            try {
              const user = await db.user.findUnique({
                where: { id: session.userId },
                select: {
                  name: true,
                  email: true,
                  accounts: {
                    where: { providerId: "github" },
                    select: { id: true },
                  },
                  _count: {
                    select: { teamMembers: true },
                  },
                },
              });

              if (user && user.accounts.length === 0) {
                // User hasn't connected GitHub
                await sendGithubConnectionWarningEmail({
                  to: user.email,
                  userName: user.name || "User",
                });
              }
            } catch (err) {
              console.error(
                "Error checking github connection requirement after login:",
                err,
              );
            }
          })();
        },
      },
    },
  },
  trustedOrigins: getTrustedOrigins(),
  plugins: [sso()],
});

export type Session = typeof auth.$Infer.Session;
