import {
  apiErrorResponse,
  ApiRequestError,
  assertSameOrigin,
  jsonSuccess,
  requireManager,
} from "@/operator-practice/api.server";
import { disableOperatorAccess } from "@/operator-practice/access.server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    assertSameOrigin(request);
    await requireManager(request);
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) {
      throw new ApiRequestError("not_found", 404, "Access not found.");
    }

    const access = await disableOperatorAccess(Number(id));
    return jsonSuccess({ access });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
