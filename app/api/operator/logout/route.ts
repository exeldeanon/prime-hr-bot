import {
  apiErrorResponse,
  assertSameOrigin,
  jsonSuccess,
} from "@/operator-practice/api.server";
import { clearOperatorSessionCookie } from "@/operator-practice/session.server";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    return jsonSuccess(
      {},
      { headers: { "Set-Cookie": clearOperatorSessionCookie(request) } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
