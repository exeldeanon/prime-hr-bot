<?php

declare(strict_types=1);

$configPath = __DIR__ . '/config.php';

if (!is_file($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'config.php is missing'], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;
$secret = $_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? '';

if (!hash_equals((string)$config['webhook_secret'], (string)$secret)) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'unauthorized'], JSON_UNESCAPED_UNICODE);
    exit;
}

$rawBody = file_get_contents('php://input');
$update = json_decode((string)$rawBody, true);

if (!is_array($update)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'invalid json'], JSON_UNESCAPED_UNICODE);
    exit;
}

require __DIR__ . '/src/Bot.php';

$vacancies = require __DIR__ . '/src/vacancies.php';
$bot = new Bot($config, $vacancies, __DIR__ . '/storage');
$bot->handleUpdate($update);

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
