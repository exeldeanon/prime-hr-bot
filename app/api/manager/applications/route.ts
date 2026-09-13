import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { candidateApplications } from "@/db/schema";
import { apiErrorResponse, assertSameOrigin, jsonSuccess, readJsonObject, requireManager } from "@/operator-practice/api.server";

const statuses = ["filled", "dropped", "hold", "paid"] as const;
function asStatus(value: unknown): (typeof statuses)[number] {
  if (typeof value !== "string" || !statuses.includes(value as (typeof statuses)[number])) throw new Error("Invalid lead status");
  return value as (typeof statuses)[number];
}
export async function GET(request: Request) {
  try { await requireManager(request); const rows = await getDb().select().from(candidateApplications).orderBy(desc(candidateApplications.createdAt)); return jsonSuccess({ applications: rows, statuses }); }
  catch (error) { return apiErrorResponse(error); }
}
export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request); await requireManager(request); const body = await readJsonObject(request);
    const id = Number(body.id); if (!Number.isSafeInteger(id) || id < 1) throw new Error("Invalid application id");
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status !== undefined) { patch.leadStatus = asStatus(body.status); patch.statusChangedAt = new Date(); }
    if (body.note !== undefined) { if (typeof body.note !== "string" || body.note.length > 4000) throw new Error("Invalid note"); patch.managerNote = body.note; }
    const [row] = await getDb().update(candidateApplications).set(patch).where(eq(candidateApplications.id, id)).returning();
    if (!row) throw new Error("Application not found"); return jsonSuccess({ application: row });
  } catch (error) { return apiErrorResponse(error); }
}
