import { env } from "cloudflare:workers";
import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { operatorAccesses } from "@/db/schema";

import {
  constantTimeTextEqual,
  randomBase64Url,
  sha256Base64Url,
} from "./security.server";

export type OperatorAccessStatus = "active" | "disabled" | "expired";
export type InviteState = OperatorAccessStatus | "invalid";

export type PublicOperatorAccess = {
  id: number;
  login: string;
  status: OperatorAccessStatus;
  effectiveStatus: OperatorAccessStatus;
  createdAt: string;
  usedAt: string | null;
  lastSeenAt: string | null;
  expiresAt: string | null;
};

export type IssuedOperatorAccess = {
  access: PublicOperatorAccess;
  login: string;
  token: string;
};

export type ActiveOperatorAccess = {
  id: number;
  login: string;
  expiresAt: Date | null;
  publicAccess: PublicOperatorAccess;
};

type OperatorAccessRow = typeof operatorAccesses.$inferSelect;

export class OperatorAccessError extends Error {
  constructor(
    readonly code:
      | "access_disabled"
      | "access_expired"
      | "invalid_invite"
      | "invalid_login"
      | "invalid_session"
      | "login_mismatch"
      | "not_found",
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "OperatorAccessError";
  }
}

export class OperatorAccessConfigurationError extends Error {
  readonly code = "configuration_error";

  constructor(message: string) {
    super(message);
    this.name = "OperatorAccessConfigurationError";
  }
}

const LOGIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LOGIN_PATTERN = /^HRP-[A-Z2-9]{5}-[A-Z2-9]{5}-[A-Z2-9]{5}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const MAX_CREATE_ATTEMPTS = 6;
const LAST_SEEN_WRITE_INTERVAL_MS = 5 * 60 * 1000;

function normalizeLogin(value: string): string {
  return value.trim().toUpperCase();
}

function randomAlphabetCharacters(length: number): string {
  let result = "";
  const upperBound = 256 - (256 % LOGIN_ALPHABET.length);

  while (result.length < length) {
    const bytes = new Uint8Array(Math.max(16, length - result.length));
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= upperBound) continue;
      result += LOGIN_ALPHABET[byte % LOGIN_ALPHABET.length];
      if (result.length === length) break;
    }
  }

  return result;
}

function generateLogin(): string {
  const characters = randomAlphabetCharacters(15);
  return `HRP-${characters.slice(0, 5)}-${characters.slice(5, 10)}-${characters.slice(10)}`;
}

function configuredExpiry(now: Date): Date | null {
  const rawTtl = env.OPERATOR_ACCESS_TTL_DAYS?.trim();
  if (!rawTtl) return null;

  const days = Number(rawTtl);
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650) {
    throw new OperatorAccessConfigurationError(
      "OPERATOR_ACCESS_TTL_DAYS must be a whole number from 1 to 3650.",
    );
  }

  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

function effectiveStatus(
  row: Pick<OperatorAccessRow, "status" | "expiresAt">,
  now = new Date(),
): OperatorAccessStatus {
  if (row.status === "disabled") return "disabled";
  if (
    row.status === "expired" ||
    (row.expiresAt !== null && row.expiresAt.getTime() <= now.getTime())
  ) {
    return "expired";
  }
  return "active";
}

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

export function serializeOperatorAccess(
  row: OperatorAccessRow,
  now = new Date(),
): PublicOperatorAccess {
  return {
    id: row.id,
    login: row.login,
    status: row.status,
    effectiveStatus: effectiveStatus(row, now),
    createdAt: row.createdAt.toISOString(),
    usedAt: iso(row.usedAt),
    lastSeenAt: iso(row.lastSeenAt),
    expiresAt: iso(row.expiresAt),
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("unique") || message.includes("constraint");
}

async function persistExpired(row: OperatorAccessRow): Promise<void> {
  if (row.status !== "active") return;
  await getDb()
    .update(operatorAccesses)
    .set({ status: "expired" })
    .where(
      and(
        eq(operatorAccesses.id, row.id),
        eq(operatorAccesses.status, "active"),
      ),
    );
}

function assertActive(row: OperatorAccessRow, now: Date): void {
  const status = effectiveStatus(row, now);
  if (status === "disabled") {
    throw new OperatorAccessError(
      "access_disabled",
      403,
      "Operator access is disabled.",
    );
  }
  if (status === "expired") {
    throw new OperatorAccessError(
      "access_expired",
      410,
      "Operator access has expired.",
    );
  }
}

export async function listOperatorAccesses(): Promise<PublicOperatorAccess[]> {
  const rows = await getDb()
    .select()
    .from(operatorAccesses)
    .orderBy(desc(operatorAccesses.createdAt));
  const now = new Date();
  return rows.map((row) => serializeOperatorAccess(row, now));
}

export async function createOperatorAccess(): Promise<IssuedOperatorAccess> {
  const db = getDb();
  const now = new Date();
  const expiresAt = configuredExpiry(now);

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const login = generateLogin();
    const token = randomBase64Url(32);
    const tokenHash = await sha256Base64Url(token);

    try {
      const [row] = await db
        .insert(operatorAccesses)
        .values({
          login,
          tokenHash,
          status: "active",
          createdAt: now,
          expiresAt,
        })
        .returning();

      if (!row) throw new Error("D1 did not return the created operator access.");
      return { access: serializeOperatorAccess(row, now), login, token };
    } catch (error) {
      if (!isUniqueConstraintError(error) || attempt === MAX_CREATE_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  throw new Error("Unable to create a unique operator access.");
}

export async function inspectInviteToken(token: string): Promise<InviteState> {
  if (!TOKEN_PATTERN.test(token)) return "invalid";
  const tokenHash = await sha256Base64Url(token);
  const [row] = await getDb()
    .select()
    .from(operatorAccesses)
    .where(eq(operatorAccesses.tokenHash, tokenHash))
    .limit(1);

  if (!row) return "invalid";
  const status = effectiveStatus(row);
  if (status === "expired") await persistExpired(row);
  return status;
}

export async function authenticateOperator(
  inputLogin: string,
  inviteToken?: string,
): Promise<ActiveOperatorAccess> {
  const login = normalizeLogin(inputLogin);
  if (!LOGIN_PATTERN.test(login)) {
    throw new OperatorAccessError("invalid_login", 401, "Invalid operator login.");
  }

  const [row] = await getDb()
    .select()
    .from(operatorAccesses)
    .where(eq(operatorAccesses.login, login))
    .limit(1);

  if (!row) {
    throw new OperatorAccessError("invalid_login", 401, "Invalid operator login.");
  }

  if (inviteToken !== undefined) {
    if (!TOKEN_PATTERN.test(inviteToken)) {
      throw new OperatorAccessError(
        "invalid_invite",
        401,
        "Invalid invitation token.",
      );
    }

    const tokenHash = await sha256Base64Url(inviteToken);
    if (!(await constantTimeTextEqual(tokenHash, row.tokenHash))) {
      throw new OperatorAccessError(
        "login_mismatch",
        401,
        "The login does not match this invitation.",
      );
    }
  }

  const now = new Date();
  try {
    assertActive(row, now);
  } catch (error) {
    if (
      error instanceof OperatorAccessError &&
      error.code === "access_expired"
    ) {
      await persistExpired(row);
    }
    throw error;
  }

  const usedAt = row.usedAt ?? now;
  await getDb()
    .update(operatorAccesses)
    .set({ usedAt, lastSeenAt: now })
    .where(eq(operatorAccesses.id, row.id));

  const updatedRow = { ...row, usedAt, lastSeenAt: now };
  return {
    id: row.id,
    login: row.login,
    expiresAt: row.expiresAt,
    publicAccess: serializeOperatorAccess(updatedRow, now),
  };
}

export async function resolveOperatorSession(
  accessId: number,
  options: { touch?: boolean } = {},
): Promise<ActiveOperatorAccess> {
  if (!Number.isSafeInteger(accessId) || accessId < 1) {
    throw new OperatorAccessError("invalid_session", 401, "Invalid session.");
  }

  const [row] = await getDb()
    .select()
    .from(operatorAccesses)
    .where(eq(operatorAccesses.id, accessId))
    .limit(1);

  if (!row) {
    throw new OperatorAccessError("invalid_session", 401, "Invalid session.");
  }

  const now = new Date();
  try {
    assertActive(row, now);
  } catch (error) {
    if (
      error instanceof OperatorAccessError &&
      error.code === "access_expired"
    ) {
      await persistExpired(row);
    }
    throw error;
  }

  const shouldTouch =
    options.touch !== false &&
    (row.lastSeenAt === null ||
      now.getTime() - row.lastSeenAt.getTime() >= LAST_SEEN_WRITE_INTERVAL_MS);
  const lastSeenAt = shouldTouch ? now : row.lastSeenAt;
  if (shouldTouch) {
    await getDb()
      .update(operatorAccesses)
      .set({ lastSeenAt })
      .where(eq(operatorAccesses.id, row.id));
  }

  const updatedRow = { ...row, lastSeenAt };
  return {
    id: row.id,
    login: row.login,
    expiresAt: row.expiresAt,
    publicAccess: serializeOperatorAccess(updatedRow, now),
  };
}

export async function disableOperatorAccess(
  accessId: number,
): Promise<PublicOperatorAccess> {
  if (!Number.isSafeInteger(accessId) || accessId < 1) {
    throw new OperatorAccessError("not_found", 404, "Access not found.");
  }

  const [existing] = await getDb()
    .select()
    .from(operatorAccesses)
    .where(eq(operatorAccesses.id, accessId))
    .limit(1);

  if (!existing) {
    throw new OperatorAccessError("not_found", 404, "Access not found.");
  }

  if (existing.status !== "disabled") {
    await getDb()
      .update(operatorAccesses)
      .set({ status: "disabled" })
      .where(eq(operatorAccesses.id, accessId));
  }

  return serializeOperatorAccess({ ...existing, status: "disabled" });
}
