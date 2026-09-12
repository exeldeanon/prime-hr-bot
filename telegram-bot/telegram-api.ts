import type { InlineKeyboardMarkup } from "./types";

interface TelegramApiResponse {
  ok: boolean;
}

export class TelegramApi {
  private readonly baseUrl: string;

  constructor(token: string) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  private async call(method: string, payload: Record<string, unknown>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    let result: TelegramApiResponse | undefined;

    try {
      result = (await response.json()) as TelegramApiResponse;
    } catch {
      // A status-only error below is deliberately free of tokens and personal data.
    }

    if (!response.ok || !result?.ok) {
      throw new Error(`Telegram API request failed with status ${response.status}`);
    }
  }

  async sendMessage(
    chatId: string,
    text: string,
    replyMarkup?: InlineKeyboardMarkup,
  ): Promise<void> {
    await this.call("sendMessage", {
      chat_id: chatId,
      text,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
  }

  async answerCallbackQuery(callbackQueryId: string): Promise<void> {
    await this.call("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
    });
  }
}
