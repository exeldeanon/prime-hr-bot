import { env } from "cloudflare:workers";
import { handleTelegramUpdate } from "@/telegram-bot";

export async function POST(request: Request): Promise<Response> {
  const expectedSecret = env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const receivedSecret = request.headers.get(
    "x-telegram-bot-api-secret-token",
  );

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let update: unknown;

  try {
    update = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  try {
    const result = await handleTelegramUpdate(update, env);
    return Response.json(result);
  } catch {
    return Response.json(
      { ok: false, error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

