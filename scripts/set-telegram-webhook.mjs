const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const webhookUrl = process.argv[2]?.trim() || process.env.TELEGRAM_WEBHOOK_URL?.trim();

if (!token) {
  throw new Error("Set TELEGRAM_BOT_TOKEN before installing the webhook.");
}

if (!webhookUrl) {
  throw new Error(
    "Pass the public webhook URL as an argument or set TELEGRAM_WEBHOOK_URL.",
  );
}

if (secret && !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  throw new Error(
    "TELEGRAM_WEBHOOK_SECRET must contain 1-256 characters: A-Z, a-z, 0-9, _ or -.",
  );
}

const url = new URL(webhookUrl);

if (url.protocol !== "https:") {
  throw new Error("Telegram requires an HTTPS webhook URL.");
}

if (url.port && !["443", "80", "88", "8443"].includes(url.port)) {
  throw new Error("Telegram supports webhook ports 443, 80, 88 and 8443.");
}

const response = await fetch(
  `https://api.telegram.org/bot${token}/setWebhook`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: url.toString(),
      allowed_updates: ["message", "callback_query"],
      max_connections: 1,
      ...(secret ? { secret_token: secret } : {}),
    }),
  },
);

const result = await response.json();

if (!response.ok || !result?.ok) {
  throw new Error(`Telegram rejected setWebhook with status ${response.status}.`);
}

console.log(`Telegram webhook installed for ${url.origin}${url.pathname}`);
