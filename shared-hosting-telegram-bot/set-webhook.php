<?php

declare(strict_types=1);

// Run this file once from the browser, then delete it from hosting.
// Example: https://your-domain.ru/telegram-bot/set-webhook.php?url=https://your-domain.ru/telegram-bot/webhook.php

$configPath = __DIR__ . '/config.php';

if (!is_file($configPath)) {
    http_response_code(500);
    echo 'config.php is missing';
    exit;
}

$config = require $configPath;
$webhookUrl = $_GET['url'] ?? '';

if (!filter_var($webhookUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo 'Pass webhook URL in ?url=https://your-domain.ru/telegram-bot/webhook.php';
    exit;
}

$apiUrl = 'https://api.telegram.org/bot' . $config['bot_token'] . '/setWebhook';
$payload = [
    'url' => $webhookUrl,
    'secret_token' => $config['webhook_secret'],
    'allowed_updates' => ['message', 'callback_query'],
];

$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_TIMEOUT => 15,
]);

$response = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode ?: 500);
header('Content-Type: application/json; charset=utf-8');
echo $response ?: json_encode(['ok' => false, 'error' => 'Telegram request failed'], JSON_UNESCAPED_UNICODE);
