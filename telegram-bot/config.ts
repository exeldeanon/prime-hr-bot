export interface BotConfig {
  token: string;
  managerUsername: string;
  managerChatId?: string;
  policyUrl: string;
  personalDataUrl: string;
}

function requireValue(value: string | undefined, name: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`Missing required Telegram bot configuration: ${name}`);
  }

  return normalized;
}

function normalizeUsername(value: string): string {
  return value.startsWith("@") ? value : `@${value}`;
}

export function getBotConfig(runtimeEnv: Cloudflare.Env): BotConfig {
  const managerChatId = runtimeEnv.HR_MANAGER_CHAT_ID?.trim();

  return {
    token: requireValue(runtimeEnv.TELEGRAM_BOT_TOKEN, "TELEGRAM_BOT_TOKEN"),
    managerUsername: normalizeUsername(
      requireValue(runtimeEnv.HR_MANAGER_USERNAME, "HR_MANAGER_USERNAME"),
    ),
    managerChatId: managerChatId || undefined,
    policyUrl: requireValue(runtimeEnv.POLICY_URL, "POLICY_URL"),
    personalDataUrl: requireValue(
      runtimeEnv.PERSONAL_DATA_URL,
      "PERSONAL_DATA_URL",
    ),
  };
}

