import crypto from "crypto";

const TOKEN_PREFIX = "enc:v1:";

function getTokenSecret() {
  const secret =
    process.env.PAYMENT_TOKEN_ENCRYPTION_KEY ??
    process.env.BETTER_AUTH_SECRET ??
    process.env.FAWATERAK_VENDOR_KEY;

  if (!secret) {
    throw new Error("PAYMENT_TOKEN_ENCRYPTION_KEY is not configured");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptPaymentToken(token: string) {
  if (token.startsWith(TOKEN_PREFIX)) return token;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getTokenSecret(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${TOKEN_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptPaymentToken(storedToken: string) {
  if (!storedToken.startsWith(TOKEN_PREFIX)) return storedToken;

  const [, payload] = storedToken.split(TOKEN_PREFIX);
  const [ivHex, authTagHex, encryptedHex] = payload.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted payment token");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getTokenSecret(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export function fingerprintPaymentToken(token: string) {
  return crypto
    .createHmac("sha256", getTokenSecret())
    .update(token)
    .digest("hex");
}
