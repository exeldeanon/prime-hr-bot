import {
  apiErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/operator-practice/api.server";
import {
  OperatorAccessError,
  resolveOperatorSession,
} from "@/operator-practice/access.server";
import {
  clearOperatorSessionCookie,
  getOperatorSessionAccessId,
} from "@/operator-practice/session.server";

export async function GET(request: Request): Promise<Response> {
  try {
    const accessId = await getOperatorSessionAccessId(request);
    if (!accessId) {
      return jsonError(
        "invalid_session",
        "Operator authentication is required.",
        401,
        { "Set-Cookie": clearOperatorSessionCookie(request) },
      );
    }

    const operator = await resolveOperatorSession(accessId);
    return jsonSuccess({
      session: {
        accessId: operator.id,
        login: operator.login,
        expiresAt: operator.publicAccess.expiresAt,
        lastSeenAt: operator.publicAccess.lastSeenAt,
      },
    });
  } catch (error) {
    if (error instanceof OperatorAccessError) {
      return jsonError(error.code, error.message, error.status, {
        "Set-Cookie": clearOperatorSessionCookie(request),
      });
    }
    return apiErrorResponse(error);
  }
}
