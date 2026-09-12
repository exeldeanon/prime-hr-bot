import {
  apiErrorResponse,
  assertSameOrigin,
  jsonSuccess,
  requireManager,
} from "@/operator-practice/api.server";
import {
  createOperatorAccess,
  listOperatorAccesses,
} from "@/operator-practice/access.server";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireManager(request);
    const accesses = await listOperatorAccesses();
    return jsonSuccess({ accesses });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    await requireManager(request);
    const issued = await createOperatorAccess();
    const inviteUrl = new URL(
      `/operator/invite/${encodeURIComponent(issued.token)}`,
      new URL(request.url).origin,
    ).toString();

    return jsonSuccess(
      {
        access: issued.access,
        credentials: { login: issued.login, inviteUrl },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
