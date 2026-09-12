import {
  apiErrorResponse,
  ApiRequestError,
  assertSameOrigin,
  jsonSuccess,
  readJsonObject,
} from "@/operator-practice/api.server";
import {
  constantTimeTextEqual,
  getManagerAdminPassword,
} from "@/operator-practice/security.server";
import { createManagerSessionCookie } from "@/operator-practice/session.server";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body = await readJsonObject(request);
    if (typeof body.password !== "string" || body.password.length > 1024) {
      throw new ApiRequestError(
        "invalid_password",
        401,
        "The manager password is invalid.",
      );
    }

    const matches = await constantTimeTextEqual(
      body.password,
      getManagerAdminPassword(),
    );
    if (!matches) {
      throw new ApiRequestError(
        "invalid_password",
        401,
        "The manager password is invalid.",
      );
    }

    const sessionCookie = await createManagerSessionCookie(request);
    return jsonSuccess({}, { headers: { "Set-Cookie": sessionCookie } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
