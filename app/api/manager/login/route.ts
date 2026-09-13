import {
  apiErrorResponse,
  assertSameOrigin,
  jsonError,
  jsonSuccess,
  readJsonObject,
} from "@/operator-practice/api.server";
import {
  clearManagerLoginFailures,
  inspectManagerLoginRateLimit,
  type ManagerLoginRateLimit,
  recordManagerLoginFailure,
} from "@/operator-practice/manager-rate-limit.server";
import {
  constantTimeTextEqual,
  getManagerAdminPassword,
} from "@/operator-practice/security.server";
import { createManagerSessionCookie } from "@/operator-practice/session.server";

function tooManyAttemptsResponse(rateLimit: ManagerLoginRateLimit): Response {
  return jsonError(
    "too_many_attempts",
    "Too many login attempts. Try again later.",
    429,
    { "Retry-After": String(rateLimit.retryAfterSeconds) },
  );
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const initialRateLimit = await inspectManagerLoginRateLimit(request);
    if (initialRateLimit.limited) {
      return tooManyAttemptsResponse(initialRateLimit);
    }

    const body = await readJsonObject(request);
    const hasValidPasswordShape =
      typeof body.password === "string" && body.password.length <= 1024;
    const candidate = hasValidPasswordShape ? (body.password as string) : "";

    const digestMatches = await constantTimeTextEqual(
      candidate,
      getManagerAdminPassword(),
    );
    const matches = hasValidPasswordShape && digestMatches;
    if (!matches) {
      const failedRateLimit = await recordManagerLoginFailure(
        initialRateLimit.clientHash,
      );
      if (failedRateLimit.limited) {
        return tooManyAttemptsResponse(failedRateLimit);
      }

      return jsonError("invalid_credentials", "Invalid credentials.", 401);
    }

    await clearManagerLoginFailures(initialRateLimit.clientHash);
    const sessionCookie = await createManagerSessionCookie(request);
    return jsonSuccess({}, { headers: { "Set-Cookie": sessionCookie } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
