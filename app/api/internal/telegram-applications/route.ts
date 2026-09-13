import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { candidateApplications } from "@/db/schema";

function fail(message: string, status = 400) { return Response.json({ ok: false, error: message }, { status }); }
export async function POST(request: Request) {
  const expected = env.TELEGRAM_CRM_SYNC_SECRET?.trim();
  if (!expected || request.headers.get("x-crm-sync-secret") !== expected) return fail("Unauthorized", 401);
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return fail("Invalid JSON"); }
  const required = ["sourceUpdateId", "chatId", "telegramUserId", "name", "phone", "age", "experience", "citizenshipCity", "equipment", "onlineReady", "employmentStatus", "vacancyId"];
  if (required.some((key) => body[key] === undefined || body[key] === null || body[key] === "")) return fail("Missing application fields");
  const sourceUpdateId = Number(body.sourceUpdateId), age = Number(body.age);
  if (!Number.isSafeInteger(sourceUpdateId) || !Number.isSafeInteger(age) || age < 1 || age > 120) return fail("Invalid application values");
  const db = getDb();
  const values = {
    sourceUpdateId, flowId: typeof body.flowId === "string" ? body.flowId : null,
    chatId: String(body.chatId), telegramUserId: String(body.telegramUserId),
    name: String(body.name).slice(0, 120), phone: String(body.phone).slice(0, 40), age,
    experience: String(body.experience).slice(0, 4000), citizenshipCity: String(body.citizenshipCity).slice(0, 300),
    equipment: String(body.equipment).slice(0, 500), onlineReady: String(body.onlineReady), employmentStatus: String(body.employmentStatus), vacancyId: String(body.vacancyId).slice(0, 80),
    telegramUsername: typeof body.telegramUsername === "string" ? body.telegramUsername.slice(0, 64) : null,
    rawPayload: body.rawPayload ?? body, leadStatus: "filled", statusChangedAt: new Date(), updatedAt: new Date(),
  };
  const existing = await db.select({ id: candidateApplications.id }).from(candidateApplications).where(eq(candidateApplications.sourceUpdateId, sourceUpdateId)).limit(1);
  if (existing[0]) return Response.json({ ok: true, duplicate: true, id: existing[0].id });
  const [row] = await db.insert(candidateApplications).values(values).returning({ id: candidateApplications.id });
  return Response.json({ ok: true, id: row.id }, { status: 201 });
}
