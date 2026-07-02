import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/server/db";
import { inngest } from "@/server/inngest";
import { checkUserLimit } from "@/lib/limits";
import {
  fetchPullRequestByFullName,
  getGitHubAccessToken,
  postCommitStatus,
} from "@/server/services/github";

const pullRequestPayloadSchema = z.object({
  action: z.string(),
  pull_request: z.object({
    number: z.number().int(),
    title: z.string(),
    html_url: z.string().url(),
    draft: z.boolean().optional().default(false),
    head: z.object({
      sha: z.string().min(1),
    }),
  }),
  repository: z.object({
    id: z.number().int(),
    full_name: z.string().min(1),
  }),
});

function verifySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "GITHUB_WEBHOOK_SECRET is not set — rejecting webhook request.",
    );
    return false;
  }

  if (!signature) {
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event !== "pull_request") {
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  }

  const parsedPayload = pullRequestPayloadSchema.safeParse(JSON.parse(payload));
  if (!parsedPayload.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 200 });
  }

  const data = parsedPayload.data;

  if (!["opened", "synchronize", "reopened"].includes(data.action)) {
    return NextResponse.json(
      { message: `Action '${data.action}' ignored` },
      { status: 200 },
    );
  }

  if (data.pull_request.draft) {
    return NextResponse.json({ message: "Draft PR ignored" }, { status: 200 });
  }

  const repository = await db.repository.findFirst({
    where: { githubId: data.repository.id },
    include: { user: true },
  });

  if (!repository) {
    return NextResponse.json(
      { message: "Repository not connected" },
      { status: 200 },
    );
  }

  const webhookConfig = await db.webhookConfig.findUnique({
    where: { repositoryId: repository.id },
    select: { enabled: true },
  });

  if (!webhookConfig?.enabled) {
    return NextResponse.json(
      { message: "Auto-review disabled" },
      { status: 200 },
    );
  }

  const accessToken = await getGitHubAccessToken(repository.userId);
  if (!accessToken) {
    return NextResponse.json(
      { message: "Repository owner GitHub token not available" },
      { status: 200 },
    );
  }

  let livePr = null as {
    number: number;
    title: string;
    html_url: string;
    head: { sha: string };
  } | null;

  try {
    livePr = await fetchPullRequestByFullName(
      accessToken,
      repository.fullName,
      data.pull_request.number,
    );
  } catch {
    livePr = {
      number: data.pull_request.number,
      title: data.pull_request.title,
      html_url: data.pull_request.html_url,
      head: { sha: data.pull_request.head.sha },
    };
  }

  // Wrap the duplicate-check + create in a serializable transaction so that
  // two simultaneous webhook deliveries (GitHub retry) cannot both pass the
  // check and create duplicate review records.
  let review: { id: string } | null = null;
  try {
    // Enforce plan limits for webhook-triggered reviews
    await checkUserLimit(db, repository.userId, "reviewsLimit");

    review = await db.$transaction(async (tx) => {
      const existing = await tx.review.findFirst({
        where: {
          repositoryId: repository.id,
          prNumber: livePr.number,
          status: { in: ["PENDING", "PROCESSING"] },
        },
        select: { id: true },
      });

      if (existing) return null; // signal duplicate to caller

      return tx.review.create({
        data: {
          repositoryId: repository.id,
          userId: repository.userId,
          prNumber: livePr.number,
          prTitle: livePr.title,
          prUrl: livePr.html_url,
          status: "PENDING",
        },
        select: { id: true },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Limit reached")) {
      return NextResponse.json(
        { message: err.message },
        { status: 200 },
      );
    }
    console.error("Failed to create review record", err);
    return NextResponse.json(
      { message: "Internal error creating review" },
      { status: 500 },
    );
  }

  if (!review) {
    return NextResponse.json(
      { message: "Review already in progress" },
      { status: 200 },
    );
  }

  const ownerPreferences = await db.user.findUnique({
    where: { id: repository.userId },
    select: {
      reviewDepth: true,
      defaultLanguage: true,
      includeSecurityChecks: true,
      includePerfSuggestions: true,
    },
  });

  await inngest.send({
    name: "review/pr.requested",
    data: {
      reviewId: review.id,
      repositoryId: repository.id,
      prNumber: livePr.number,
      userId: repository.userId,
      preferences: ownerPreferences
        ? {
            reviewDepth: ownerPreferences.reviewDepth,
            defaultLanguage: ownerPreferences.defaultLanguage,
            includeSecurityChecks: ownerPreferences.includeSecurityChecks,
            includePerfSuggestions: ownerPreferences.includePerfSuggestions,
          }
        : undefined,
    },
  });

  void (async () => {
    try {
      await postCommitStatus(
        accessToken,
        data.repository.full_name,
        livePr.head.sha,
        "pending",
        repository.id,
        livePr.number,
        "Code Catch — review in progress",
      );

      await db.gitHubStatusCheck.upsert({
        where: { reviewId: review.id },
        create: {
          reviewId: review.id,
          commitSha: livePr.head.sha,
          state: "PENDING",
        },
        update: {
          commitSha: livePr.head.sha,
          state: "PENDING",
        },
      });
    } catch (error) {
      console.error("Failed to post pending status check", error);
    }
  })();

  return NextResponse.json(
    { message: "Review triggered", reviewId: review.id },
    { status: 200 },
  );
}
