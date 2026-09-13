import { eq, lt, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { managerLoginRateLimits } from "@/db/schema";

import { signHmac } from "./security.server";

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const STALE_ENTRY_AGE_MS = 24 * 60 * 60 * 1000;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;

export type ManagerLoginRateLimit = {
  clientHash: string;
  limited: boolean;
  retryAfterSeconds: number;
};

let nextPruneAt = 0;

function normalizedClientIdentifier(request: Request): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return `cf-ip:${cloudflareIp.slice(0, 128)}`;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return `real-ip:${realIp.slice(0, 128)}`;

  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",", 1)[0]
    ?.trim();
  if (forwardedIp) return `forwarded-ip:${forwardedIp.slice(0, 128)}`;

  // Loopback previews do not always expose a peer address. This fallback keeps
  // the limiter effective there without persisting the user agent itself.
  const userAgent = request.headers.get("user-agent")?.slice(0, 256) ?? "unknown";
  return `no-ip:${userAgent}`;
}

async function clientHash(request: Request): Promise<string> {
  const identifier = normalizedClientIdentifier(request);
  return signHmac(`manager-login-rate-limit:v1\0${identifier}`);
}

function limitState(
  hash: string,
  blockedUntil: Date | null,
  nowMs: number,
): ManagerLoginRateLimit {
  const remainingMs = blockedUntil ? blockedUntil.getTime() - nowMs : 0;
  return {
    clientHash: hash,
    limited: remainingMs > 0,
    retryAfterSeconds: remainingMs > 0 ? Math.max(1, Math.ceil(remainingMs / 1000)) : 0,
  };
}

async function pruneStaleEntries(nowMs: number): Promise<void> {
  if (nowMs < nextPruneAt) return;
  nextPruneAt = nowMs + PRUNE_INTERVAL_MS;

  await getDb()
    .delete(managerLoginRateLimits)
    .where(
      lt(
        managerLoginRateLimits.updatedAt,
        new Date(nowMs - STALE_ENTRY_AGE_MS),
      ),
    );
}

export async function inspectManagerLoginRateLimit(
  request: Request,
): Promise<ManagerLoginRateLimit> {
  const nowMs = Date.now();
  const hash = await clientHash(request);
  await pruneStaleEntries(nowMs);

  const [row] = await getDb()
    .select({ blockedUntil: managerLoginRateLimits.blockedUntil })
    .from(managerLoginRateLimits)
    .where(eq(managerLoginRateLimits.clientHash, hash))
    .limit(1);

  return limitState(hash, row?.blockedUntil ?? null, nowMs);
}

export async function recordManagerLoginFailure(
  hash: string,
): Promise<ManagerLoginRateLimit> {
  const nowMs = Date.now();
  const windowCutoffMs = nowMs - FAILURE_WINDOW_MS;
  const blockUntilMs = nowMs + BLOCK_DURATION_MS;
  const activeBlock = sql`${managerLoginRateLimits.blockedUntil} IS NOT NULL
    AND ${managerLoginRateLimits.blockedUntil} > ${nowMs}`;
  const expiredWindow = sql`${managerLoginRateLimits.windowStartedAt} <= ${windowCutoffMs}`;
  const nextFailureCount = sql<number>`CASE
    WHEN ${activeBlock} THEN ${managerLoginRateLimits.failureCount}
    WHEN ${expiredWindow} THEN 1
    ELSE ${managerLoginRateLimits.failureCount} + 1
  END`;

  const [row] = await getDb()
    .insert(managerLoginRateLimits)
    .values({
      clientHash: hash,
      windowStartedAt: new Date(nowMs),
      failureCount: 1,
      blockedUntil: null,
      updatedAt: new Date(nowMs),
    })
    .onConflictDoUpdate({
      target: managerLoginRateLimits.clientHash,
      set: {
        windowStartedAt: sql`CASE
          WHEN ${activeBlock} THEN ${managerLoginRateLimits.windowStartedAt}
          WHEN ${expiredWindow} THEN ${nowMs}
          ELSE ${managerLoginRateLimits.windowStartedAt}
        END`,
        failureCount: nextFailureCount,
        blockedUntil: sql`CASE
          WHEN ${activeBlock} THEN ${managerLoginRateLimits.blockedUntil}
          WHEN ${nextFailureCount} >= ${MAX_FAILURES} THEN ${blockUntilMs}
          ELSE NULL
        END`,
        updatedAt: sql`${nowMs}`,
      },
    })
    .returning({ blockedUntil: managerLoginRateLimits.blockedUntil });

  if (!row) throw new Error("D1 did not return the manager login rate limit.");
  return limitState(hash, row.blockedUntil, nowMs);
}

export async function clearManagerLoginFailures(hash: string): Promise<void> {
  await getDb()
    .delete(managerLoginRateLimits)
    .where(eq(managerLoginRateLimits.clientHash, hash));
}
