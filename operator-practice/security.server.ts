import { env } from "cloudflare:workers";

const encoder = new TextEncoder();
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export class SecurityConfigurationError extends Error {
  readonly code = "configuration_error";

  constructor(message: string) {
    super(message);
    this.name = "SecurityConfigurationError";
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!value || !BASE64URL_PATTERN.test(value)) return null;

  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + padding;

  try {
    const binary = atob(base64);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

export function encodeBase64UrlText(value: string): string {
  return bytesToBase64Url(encoder.encode(value));
}

export function decodeBase64UrlText(value: string): string | null {
  const bytes = base64UrlToBytes(value);
  if (!bytes) return null;

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function randomBase64Url(byteLength = 32): string {
  if (!Number.isSafeInteger(byteLength) || byteLength < 16 || byteLength > 256) {
    throw new RangeError("Random token length must be between 16 and 256 bytes.");
  }

  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function constantTimeTextEqual(
  candidate: string,
  expected: string,
): Promise<boolean> {
  const [candidateDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);

  const candidateBytes = new Uint8Array(candidateDigest);
  const expectedBytes = new Uint8Array(expectedDigest);
  let difference = candidateBytes.length ^ expectedBytes.length;

  for (let index = 0; index < candidateBytes.length; index += 1) {
    difference |= candidateBytes[index] ^ (expectedBytes[index] ?? 0);
  }

  return difference === 0;
}

function requireSecret(name: "AUTH_SESSION_SECRET" | "MANAGER_ADMIN_PASSWORD"): string {
  const value = env[name];
  if (!value?.trim()) {
    throw new SecurityConfigurationError(`${name} is not configured.`);
  }

  return value;
}

export function getAuthSessionSecret(): string {
  const secret = requireSecret("AUTH_SESSION_SECRET");
  if (encoder.encode(secret).byteLength < 32) {
    throw new SecurityConfigurationError(
      "AUTH_SESSION_SECRET must contain at least 32 bytes.",
    );
  }

  return secret;
}

export function getManagerAdminPassword(): string {
  return requireSecret("MANAGER_ADMIN_PASSWORD");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signHmac(value: string): Promise<string> {
  const key = await importHmacKey(getAuthSessionSecret());
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function verifyHmac(
  value: string,
  signature: string,
): Promise<boolean> {
  const signatureBytes = base64UrlToBytes(signature);
  if (!signatureBytes || signatureBytes.byteLength !== 32) return false;

  const key = await importHmacKey(getAuthSessionSecret());
  return crypto.subtle.verify(
    "HMAC",
    key,
    new Uint8Array(signatureBytes).buffer,
    encoder.encode(value),
  );
}

export function isSameOriginMutation(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site" || fetchSite === "same-site") return false;

  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (source) {
    try {
      return new URL(source).origin === new URL(request.url).origin;
    } catch {
      return false;
    }
  }

  return fetchSite === "same-origin";
}
