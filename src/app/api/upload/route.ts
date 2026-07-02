import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Simple in-memory rate limiter fallback when Redis is not configured
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();
const UPLOAD_LIMIT = 10; // max uploads per window
const UPLOAD_WINDOW_MS = 60_000; // 1 minute

function checkInMemoryLimit(userId: string): boolean {
  const now = Date.now();
  const entry = inMemoryStore.get(userId);
  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(userId, { count: 1, resetAt: now + UPLOAD_WINDOW_MS });
    return true;
  }
  if (entry.count >= UPLOAD_LIMIT) return false;
  entry.count++;
  return true;
}

// Use Redis-backed rate limiter when available
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(UPLOAD_LIMIT, "1m"),
        prefix: "ratelimit:upload",
      })
    : null;

// SVG is intentionally excluded — SVG files can contain <script> tags and
// inline event handlers that execute in the browser when served as a static
// file, enabling stored-XSS attacks.
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

// Map of MIME types allowed by magic-byte inspection to canonical extensions.
// Only raster image formats that cannot carry executable content are permitted.
const MAGIC_BYTE_ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 uploads per minute per user
  if (ratelimit) {
    const { success } = await ratelimit.limit(session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 },
      );
    }
  } else if (!checkInMemoryLimit(session.user.id)) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Reject based on browser-supplied MIME type first (fast path).
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 },
      );
    }

    // Magic-byte validation: read the actual file headers and confirm the
    // real MIME type matches an allowed type.  This prevents an attacker
    // from renaming a PHP/HTML/SVG file as "image.png" and uploading it.
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || !MAGIC_BYTE_ALLOWED[detected.mime]) {
      return NextResponse.json(
        { error: "File content does not match an allowed image type." },
        { status: 400 },
      );
    }

    const ext = MAGIC_BYTE_ALLOWED[detected.mime]!;
    const hash = crypto.randomBytes(8).toString("hex");
    const filename = `avatars/${session.user.id}-${hash}.${ext}`;

    let url: string;

    if (useBlob) {
      const blob = await put(filename, buffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: detected.mime,
      });
      url = blob.url;
    } else {
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "avatars",
      );
      await mkdir(uploadDir, { recursive: true });

      const localFilename = `${session.user.id}-${hash}.${ext}`;
      await writeFile(path.join(uploadDir, localFilename), buffer);
      url = `/uploads/avatars/${localFilename}`;
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
