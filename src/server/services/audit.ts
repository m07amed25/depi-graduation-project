import { db } from "../db";

type GeoipLite = {
  lookup(ip: string): { country?: string; city?: string } | null;
};
let _geoip: GeoipLite | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _geoip = require("geoip-lite") as GeoipLite;
} catch {
  // geoip data files unavailable – geo enrichment will be skipped
}

export interface AuditEntry {
  actorId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/** Normalise proxy / forwarded IP headers into a single IPv4/IPv6 string. */
function parseIp(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  // X-Forwarded-For can be a comma-separated list; take the leftmost (client)
  const first = raw.split(",")[0]?.trim();
  // Strip IPv6-mapped IPv4 prefix "::ffff:"
  return first?.replace(/^::ffff:/, "") || undefined;
}

function geoFromIp(ip: string | undefined): {
  country?: string;
  city?: string;
} {
  if (!ip || !_geoip) return {};
  try {
    const geo = _geoip.lookup(ip);
    if (!geo) return {};
    return { country: geo.country || undefined, city: geo.city || undefined };
  } catch {
    return {};
  }
}

/**
 * Write a structured audit event to the `audit_log` table.
 * Fire-and-forget safe – never throws.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const ip = parseIp(entry.ipAddress);
    const { country, city } = geoFromIp(ip);
    await db.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        resource: entry.resource ?? null,
        resourceId: entry.resourceId ?? null,
        ipAddress: ip ?? null,
        userAgent: entry.userAgent ?? null,
        country: country ?? null,
        city: city ?? null,
        metadata: entry.metadata
          ? (entry.metadata as import("../db/client").Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (err) {
    // Never let audit failures crash the main request
    console.error("[audit] failed to write audit log:", err);
  }
}
