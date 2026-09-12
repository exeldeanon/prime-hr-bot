<?php

return [
    // Token from @BotFather. Do not publish it anywhere.
    'bot_token' => 'PASTE_TELEGRAM_BOT_TOKEN_HERE',

    // Any long random string. Telegram will send it in the
    // X-Telegram-Bot-Api-Secret-Token header.
    'webhook_secret' => 'PASTE_RANDOM_SECRET_HERE',

    // Telegram username without @. Used in candidate-facing messages.
    'hr_manager_username' => 'hrinformhr',

    // Optional numeric chat id. If set, the bot sends applications there.
    // Keep null if you want candidates to forward the final form manually.
    'hr_manager_chat_id' => null,

    // Replace with your published legal pages.
    'policy_url' => 'https://example.com/privacy',
    'personal_data_url' => 'https://example.com/personal-data',
];
