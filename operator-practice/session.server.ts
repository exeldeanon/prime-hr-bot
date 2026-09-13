import { cookies } from "next/headers";

import {
  decodeBase64UrlText,
  encodeBase64UrlText,
  getManagerAdminPassword,
  randomBase64Url,
  signHmac,
  verifyHmac,
} from "./security.server";

export const MANAGER_SESSION_COOKIE = "hrp_manager_session";
export const OPERATOR_SESSION_COOKIE = "hrp_operator_session";

const MANAGER_SESSION_SECONDS = 12 * 60 * 60;
const OPERATOR_SESSION_SECONDS = 30 * 24 * 60 * 60;

type SessionRole = "manager" | "operator";

type SessionPayload = {
  role: SessionRole;
  sub: string;
  iat: number;
  exp: number;
  nonce: string;
};

export type VerifiedSession = Readonly<SessionPayload>;

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<SessionPayload>;

  return (
    (candidate.role === "manager" || candidate.role === "operator") &&
    typeof candidate.sub === "string" &&
    candidate.sub.length > 0 &&
    candidate.sub.length <= 64 &&
    typeof candidate.iat === "number" &&
    Number.isSafeInteger(candidate.iat) &&
    typeof candidate.exp === "number" &&
    Number.isSafeInteger(candidate.exp) &&
    typeof candidate.nonce === "string" &&
    candidate.nonce.length >= 16 &&
    candidate.nonce.length <= 128
  );
}

function parseCookieHeader(header: string | null, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;

    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  return null;
}

function sessionSignatureInput(
  encodedPayload: string,
  role: SessionRole,
): string {
  if (role !== "manager") return encodedPayload;

  // Keep the credential server-side while binding manager cookies to its
  // current value. Rotating the password therefore invalidates old cookies.
  return `${encodedPayload}\u0000manager-password\u0000${getManagerAdminPassword()}`;
}

async function createSession(
  role: SessionRole,
  subject: string,
  expiresAtSeconds: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    role,
    sub: subject,
    iat: now,
    exp: expiresAtSeconds,
    nonce: randomBase64Url(18),
  };
  const encodedPayload = encodeBase64UrlText(JSON.stringify(payload));
  const signature = await signHmac(sessionSignatureInput(encodedPayload, role));
  return `${encodedPayload}.${signature}`;
}

async function verifySession(
  value: string | null,
  expectedRole: SessionRole,
): Promise<VerifiedSession | null> {
  if (!value || value.length > 2048) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;

  if (
    !(await verifyHmac(
      sessionSignatureInput(encodedPayload, expectedRole),
      signature,
    ))
  ) {
    return null;
  }
  const json = decodeBase64UrlText(encodedPayload);
  if (!json) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  if (!isSessionPayload(payload) || payload.role !== expectedRole) return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.iat > now + 60 || payload.exp <= now || payload.exp <= payload.iat) {
    return null;
  }

  return payload;
}

async function cookieValue(
  name: string,
  request?: Request,
): Promise<string | null> {
  if (request) return parseCookieHeader(request.headers.get("cookie"), name);

  const store = await cookies();
  return store.get(name)?.value ?? null;
}

function serializeCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
  request: Request,
): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}${secure}`;
}

export async function createManagerSessionCookie(request: Request): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const value = await createSession(
    "manager",
    "manager",
    now + MANAGER_SESSION_SECONDS,
  );
  return serializeCookie(
    MANAGER_SESSION_COOKIE,
    value,
    MANAGER_SESSION_SECONDS,
    request,
  );
}

export async function getManagerSession(
  request?: Request,
): Promise<VerifiedSession | null> {
  const value = await cookieValue(MANAGER_SESSION_COOKIE, request);
  return verifySession(value, "manager");
}

export async function createOperatorSessionCookie(
  accessId: number,
  accessExpiresAt: Date | null,
  request: Request,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const defaultExpiry = now + OPERATOR_SESSION_SECONDS;
  const accessExpiry = accessExpiresAt
    ? Math.floor(accessExpiresAt.getTime() / 1000)
    : defaultExpiry;
  const expiresAt = Math.min(defaultExpiry, accessExpiry);
  const value = await createSession("operator", String(accessId), expiresAt);
  return serializeCookie(
    OPERATOR_SESSION_COOKIE,
    value,
    Math.max(0, expiresAt - now),
    request,
  );
}

export async function getOperatorSessionAccessId(
  request?: Request,
): Promise<number | null> {
  const value = await cookieValue(OPERATOR_SESSION_COOKIE, request);
  const session = await verifySession(value, "operator");
  if (!session || !/^\d+$/.test(session.sub)) return null;

  const accessId = Number(session.sub);
  return Number.isSafeInteger(accessId) && accessId > 0 ? accessId : null;
}

export function clearManagerSessionCookie(request: Request): string {
  return serializeCookie(MANAGER_SESSION_COOKIE, "", 0, request);
}

export function clearOperatorSessionCookie(request: Request): string {
  return serializeCookie(OPERATOR_SESSION_COOKIE, "", 0, request);
}
