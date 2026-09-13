# Telegram bot for shared hosting

This is a standalone PHP version of the UpHire Telegram bot. It does not need
Next.js, npm, Node.js, Sites, Vercel, Cloudflare, or a database.

## What to upload

Upload the whole `shared-hosting-telegram-bot` folder to your hosting, for example:

```text
public_html/telegram-bot/
```

The public webhook URL will then be:

```text
https://your-domain.ru/telegram-bot/webhook.php
```

## Setup

1. Copy `config.example.php` to `config.php`.
2. Open `config.php` and fill in:
   - `bot_token` from `@BotFather`;
   - `webhook_secret`, any long random string;
   - `hr_manager_username`;
   - `hr_manager_chat_id`, optional numeric Telegram chat id;
   - `policy_url`;
   - `personal_data_url`.
3. Make sure the hosting supports PHP 7.4+ with the `curl` and `mbstring`
   extensions.
4. Open this URL once in the browser:

```text
https://your-domain.ru/telegram-bot/set-webhook.php?url=https://your-domain.ru/telegram-bot/webhook.php
```

5. If Telegram returns `"ok": true`, delete `set-webhook.php` from hosting.
6. Open your bot in Telegram and send `/start`.

## Files

- `webhook.php` is the thin public endpoint.
- `src/Bot.php` contains the questionnaire flow, validation, Telegram API calls,
  state changes, and application formatting.
- `src/vacancies.php` contains vacancy texts.
- `storage/` contains temporary JSON state files for chats.

Do not publish your bot token in chats, screenshots, or public repositories.
