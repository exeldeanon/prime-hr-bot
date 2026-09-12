import {
  apiErrorResponse,
  ApiRequestError,
  assertSameOrigin,
  jsonSuccess,
  readJsonObject,
} from "@/operator-practice/api.server";
import { authenticateOperator } from "@/operator-practice/access.server";
import { createOperatorSessionCookie } from "@/operator-practice/session.server";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body = await readJsonObject(request);
    if (typeof body.login !== "string" || body.login.length > 64) {
      throw new ApiRequestError("invalid_login", 401, "Invalid operator login.");
    }
    if (body.token !== undefined && typeof body.token !== "string") {
      throw new ApiRequestError("invalid_invite", 401, "Invalid invitation token.");
    }

    const operator = await authenticateOperator(body.login, body.token);
    const sessionCookie = await createOperatorSessionCookie(
      operator.id,
      operator.expiresAt,
      request,
    );
    return jsonSuccess(
      { access: operator.publicAccess },
      { headers: { "Set-Cookie": sessionCookie } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
