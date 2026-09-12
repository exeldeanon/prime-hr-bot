declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    BUCKET?: R2Bucket;
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_WEBHOOK_SECRET: string;
    HR_MANAGER_USERNAME: string;
    HR_MANAGER_CHAT_ID?: string;
    POLICY_URL: string;
    PERSONAL_DATA_URL: string;
    MANAGER_ADMIN_PASSWORD: string;
    AUTH_SESSION_SECRET: string;
    OPERATOR_ACCESS_TTL_DAYS?: string;
  }
}
