import {
  OperatorAccessConfigurationError,
  OperatorAccessError,
} from "./access.server";
import { isSameOriginMutation, SecurityConfigurationError } from "./security.server";
import { getManagerSession } from "./session.server";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function jsonSuccess(
  value: Record<string, unknown>,
  init: { status?: number; headers?: HeadersInit } = {},
): Response {
  const headers = new Headers(NO_STORE_HEADERS);
  if (init.headers) {
    new Headers(init.headers).forEach((headerValue, key) => {
      headers.set(key, headerValue);
    });
  }

  return Response.json(
    { ok: true, ...value },
    { status: init.status ?? 200, headers },
  );
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  headers?: HeadersInit,
): Response {
  const responseHeaders = new Headers(NO_STORE_HEADERS);
  if (headers) {
    new Headers(headers).forEach((headerValue, key) => {
      responseHeaders.set(key, headerValue);
    });
  }

  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: responseHeaders },
  );
}

export function assertSameOrigin(request: Request): void {
  if (!isSameOriginMutation(request)) {
    throw new ApiRequestError(
      "invalid_origin",
      403,
      "The request must originate from this site.",
    );
  }
}

export async function requireManager(request: Request): Promise<void> {
  const session = await getManagerSession(request);
  if (!session) {
    throw new ApiRequestError(
      "unauthorized",
      401,
      "Manager authentication is required.",
    );
  }
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new ApiRequestError(
      "unsupported_media_type",
      415,
      "Content-Type must be application/json.",
    );
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > 8192) {
    throw new ApiRequestError("payload_too_large", 413, "Request body is too large.");
  }

  const body = await request.text();
  if (!body || body.length > 8192) {
    throw new ApiRequestError(
      body ? "payload_too_large" : "invalid_json",
      body ? 413 : 400,
      body ? "Request body is too large." : "A JSON object is required.",
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    throw new ApiRequestError("invalid_json", 400, "Malformed JSON payload.");
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiRequestError("invalid_json", 400, "A JSON object is required.");
  }

  return value as Record<string, unknown>;
}

export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ApiRequestError || error instanceof OperatorAccessError) {
    return jsonError(error.code, error.message, error.status);
  }

  if (
    error instanceof SecurityConfigurationError ||
    error instanceof OperatorAccessConfigurationError
  ) {
    return jsonError(
      error.code,
      "Server authentication is not configured correctly.",
      503,
    );
  }

  console.error("Operator practice API failure", error);
  return jsonError("internal_error", "The request could not be completed.", 500);
}
