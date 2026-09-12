<?php

final class Bot
{
    private const ACCEPT_CONSENT = 'consent:accept';
    private const VACANCY_PREFIX = 'vacancy:';
    private const SUBMIT_PREFIX = 'application:submit:';

    private array $config;
    private array $vacancies;
    private string $storageDir;

    public function __construct(array $config, array $vacancies, string $storageDir)
    {
        $this->config = $config;
        $this->vacancies = $vacancies;
        $this->storageDir = $storageDir;
    }

    public function handleUpdate(array $update): void
    {
        if (isset($update['callback_query'])) {
            $this->handleCallback($update['callback_query']);
            return;
        }

        if (!isset($update['message'])) {
            return;
        }

        $message = $update['message'];
        $chatId = $message['chat']['id'] ?? null;
        $text = trim((string)($message['text'] ?? ''));

        if (!$chatId || $text === '') {
            return;
        }

        if ($text === '/start' || $text === '/restart') {
            $this->saveState($chatId, ['step' => 'awaiting_consent', 'draft' => []]);
            $this->sendMessage($chatId, $this->welcomeText(), $this->consentKeyboard());
            return;
        }

        if ($text === '/help') {
            $this->sendMessage($chatId, $this->helpText());
            return;
        }

        $state = $this->loadState($chatId);
        $step = $state['step'] ?? 'idle';
        $draft = $state['draft'] ?? [];

        $transition = $this->advanceDraft($step, $text, $draft);

        if (!$transition['ok']) {
            $this->sendMessage($chatId, $transition['message']);
            return;
        }

        $this->saveState($chatId, [
            'step' => $transition['next_step'],
            'draft' => $transition['draft'],
        ]);

        if ($transition['next_step'] === 'awaiting_vacancy') {
            $this->sendMessage($chatId, 'Спасибо! Теперь выберите вакансию:', $this->vacancyKeyboard());
            return;
        }

        $this->sendMessage($chatId, $this->questionForStep($transition['next_step']));
    }

    private function handleCallback(array $callback): void
    {
        $callbackId = $callback['id'] ?? null;
        $data = (string)($callback['data'] ?? '');
        $chatId = $callback['message']['chat']['id'] ?? null;

        if ($callbackId) {
            $this->answerCallbackQuery($callbackId);
        }

        if (!$chatId) {
            return;
        }

        if ($data === self::ACCEPT_CONSENT) {
            $this->saveState($chatId, ['step' => 'awaiting_name', 'draft' => []]);
            $this->sendMessage($chatId, $this->questionForStep('awaiting_name'));
            return;
        }

        if ($this->startsWith($data, self::VACANCY_PREFIX)) {
            $vacancyId = substr($data, strlen(self::VACANCY_PREFIX));

            if (!isset($this->vacancies[$vacancyId])) {
                $this->sendMessage($chatId, 'Вакансия не найдена. Отправьте /restart и попробуйте снова.');
                return;
            }

            $state = $this->loadState($chatId);
            $this->saveState($chatId, [
                'step' => 'awaiting_submission',
                'draft' => $state['draft'] ?? [],
                'vacancy_id' => $vacancyId,
            ]);

            $this->sendMessage($chatId, $this->vacancies[$vacancyId]['description'], $this->submitKeyboard($vacancyId));
            return;
        }

        if ($this->startsWith($data, self::SUBMIT_PREFIX)) {
            $vacancyId = substr($data, strlen(self::SUBMIT_PREFIX));
            $state = $this->loadState($chatId);
            $draft = $state['draft'] ?? [];

            if (!isset($this->vacancies[$vacancyId]) || !$this->isCompletedDraft($draft)) {
                $this->sendMessage($chatId, 'Не хватает данных анкеты. Отправьте /restart и заполните ее заново.');
                return;
            }

            $application = $this->formatApplication($draft, $vacancyId);
            $sentToManager = $this->sendToManager($application);

            $this->saveState($chatId, [
                'step' => 'completed',
                'draft' => $draft,
                'vacancy_id' => $vacancyId,
            ]);

            if ($sentToManager) {
                $this->sendMessage($chatId, "Анкета отправлена HR-менеджеру. Спасибо!\n\n" . $application);
                return;
            }

            $username = $this->config['hr_manager_username'] ?? '';
            $suffix = $username ? "\n\nОтправьте ее HR-менеджеру: @" . ltrim($username, '@') : '';
            $this->sendMessage($chatId, "Анкета готова, но автоматическая отправка менеджеру не настроена.$suffix\n\n" . $application);
        }
    }

    private function advanceDraft(string $step, string $input, array $draft): array
    {
        switch ($step) {
            case 'awaiting_name':
                return $this->validateTextStep($input, $draft, 'name', 'awaiting_phone', 'имя', 120);
            case 'awaiting_phone':
                $result = $this->validatePhone($input);
                return $result['ok']
                    ? ['ok' => true, 'draft' => array_merge($draft, ['phone' => $result['value']]), 'next_step' => 'awaiting_age']
                    : $result;
            case 'awaiting_age':
                $result = $this->validateAge($input);
                return $result['ok']
                    ? ['ok' => true, 'draft' => array_merge($draft, ['age' => $result['value']]), 'next_step' => 'awaiting_experience']
                    : $result;
            case 'awaiting_experience':
                return $this->validateTextStep($input, $draft, 'experience', 'awaiting_location', 'опыт работы или «нет»', 1000);
            case 'awaiting_location':
                return $this->validateTextStep($input, $draft, 'citizenship_city', 'awaiting_equipment', 'гражданство и город', 300);
            case 'awaiting_equipment':
                return $this->validateTextStep($input, $draft, 'equipment', 'awaiting_online_readiness', 'технику для работы', 500);
            case 'awaiting_online_readiness':
                $result = $this->validateOnlineReadiness($input);
                return $result['ok']
                    ? ['ok' => true, 'draft' => array_merge($draft, ['online_readiness' => $result['value']]), 'next_step' => 'awaiting_employment_status']
                    : $result;
            case 'awaiting_employment_status':
                $result = $this->validateEmploymentStatus($input);
                return $result['ok']
                    ? ['ok' => true, 'draft' => array_merge($draft, ['employment_status' => $result['value']]), 'next_step' => 'awaiting_vacancy']
                    : $result;
            default:
                return ['ok' => false, 'message' => 'Чтобы начать анкету, отправьте /start.'];
        }
    }

    private function validateTextStep(string $input, array $draft, string $field, string $nextStep, string $label, int $maxLength): array
    {
        $result = $this->validateText($input, $label, $maxLength);
        return $result['ok']
            ? ['ok' => true, 'draft' => array_merge($draft, [$field => $result['value']]), 'next_step' => $nextStep]
            : $result;
    }

    private function validateText(string $input, string $label, int $maxLength): array
    {
        $value = trim($input);

        if ($value === '') {
            return ['ok' => false, 'message' => "⚠️ Укажите {$label}."];
        }

        if (mb_strlen($value) > $maxLength) {
            return ['ok' => false, 'message' => "⚠️ Ответ слишком длинный. Сократите его до {$maxLength} символов."];
        }

        return ['ok' => true, 'value' => $value];
    }

    private function validatePhone(string $input): array
    {
        $digits = preg_replace('/\D+/', '', $input);

        if ($digits === '') {
            return ['ok' => false, 'message' => '⚠️ Укажите номер телефона цифрами.'];
        }

        if (strlen($digits) === 11 && ($digits[0] === '7' || $digits[0] === '8')) {
            return ['ok' => true, 'value' => '+7' . substr($digits, 1)];
        }

        if (strlen($digits) === 10 && $digits[0] === '9') {
            return ['ok' => true, 'value' => '+7' . $digits];
        }

        return ['ok' => false, 'message' => '⚠️ Не похоже на номер. Формат: +7XXXXXXXXXX.'];
    }

    private function validateAge(string $input): array
    {
        $value = trim($input);

        if (!preg_match('/^\d{1,3}$/', $value)) {
            return ['ok' => false, 'message' => '⚠️ Укажите возраст целым числом от 1 до 120.'];
        }

        $age = (int)$value;

        if ($age < 1 || $age > 120) {
            return ['ok' => false, 'message' => '⚠️ Укажите возраст целым числом от 1 до 120.'];
        }

        return ['ok' => true, 'value' => $age];
    }

    private function validateOnlineReadiness(string $input): array
    {
        $value = mb_strtolower(trim($input), 'UTF-8');

        if ($value === 'да') {
            return ['ok' => true, 'value' => 'Да'];
        }

        if ($value === 'нет') {
            return ['ok' => true, 'value' => 'Нет'];
        }

        return ['ok' => false, 'message' => '⚠️ Ответьте «да» или «нет».'];
    }

    private function validateEmploymentStatus(string $input): array
    {
        $value = mb_strtolower(trim($input), 'UTF-8');

        if ($value === 'ип') {
            return ['ok' => true, 'value' => 'ИП'];
        }

        if (in_array($value, ['самозанятость', 'самозанятый', 'самозанятая'], true)) {
            return ['ok' => true, 'value' => 'Самозанятость'];
        }

        if (in_array($value, ['ничего', 'нет', 'не имеется'], true)) {
            return ['ok' => true, 'value' => 'Ничего'];
        }

        return ['ok' => false, 'message' => '⚠️ Укажите один из вариантов: ИП, самозанятость или ничего.'];
    }

    private function isCompletedDraft(array $draft): bool
    {
        return isset(
            $draft['name'],
            $draft['phone'],
            $draft['age'],
            $draft['experience'],
            $draft['citizenship_city'],
            $draft['equipment'],
            $draft['online_readiness'],
            $draft['employment_status']
        );
    }

    private function formatApplication(array $draft, string $vacancyId): string
    {
        return "📄 Анкета кандидата\n"
            . 'Вакансия: ' . $this->vacancies[$vacancyId]['title'] . "\n\n"
            . 'Имя: ' . $draft['name'] . "\n"
            . 'Возраст: ' . $draft['age'] . "\n"
            . 'Телефон: ' . $draft['phone'] . "\n"
            . 'Опыт работы: ' . $draft['experience'] . "\n"
            . 'Гражданство / город: ' . $draft['citizenship_city'] . "\n"
            . 'Техника для работы: ' . $draft['equipment'] . "\n"
            . 'Готовность к онлайн: ' . $draft['online_readiness'] . "\n"
            . 'Статус/самозанятость/ИП: ' . $draft['employment_status'] . "\n\n"
            . 'Прошу рассмотреть мою кандидатуру. Спасибо! 🙌';
    }

    private function questionForStep(string $step): string
    {
        $questions = [
            'awaiting_name' => 'Как я могу к вам обращаться?',
            'awaiting_phone' => 'Укажите номер телефона для связи. Например: +7 999 123-45-67',
            'awaiting_age' => 'Укажите ваш возраст (числом).',
            'awaiting_experience' => 'Расскажите коротко об опыте работы (в любой сфере). Если опыта нет - напишите «нет».',
            'awaiting_location' => 'Гражданство и город, где вы сейчас находитесь?',
            'awaiting_equipment' => 'Какая у вас техника для работы (ПК/ноутбук/телефон)?',
            'awaiting_online_readiness' => 'Готовы ли вы работать онлайн? (да/нет)',
            'awaiting_employment_status' => 'Имеется ли у вас открытая самозанятость или ИП, или в каком статусе вы сейчас? (ИП, самозанятость, ничего)',
        ];

        return $questions[$step] ?? 'Чтобы начать анкету, отправьте /start.';
    }

    private function welcomeText(): string
    {
        return "Здравствуйте! 👋\n"
            . "Я - HR-бот HR Prime. Помогу пройти короткую анкету, выбрать подходящую вакансию и передать заявку HR-менеджеру.\n\n"
            . "Перед началом ознакомьтесь с документами:\n"
            . '🔗 Политика конфиденциальности: ' . $this->config['policy_url'] . "\n"
            . '🔗 Согласие на обработку персональных данных: ' . $this->config['personal_data_url'] . "\n\n"
            . 'Нажимая «Принимаю», вы соглашаетесь с обоими документами.';
    }

    private function helpText(): string
    {
        return "Чтобы пройти анкету, отправьте /start и нажмите «Принимаю». Затем ответьте по очереди на 8 коротких вопросов, выберите вакансию и нажмите «Отправить анкету».\n\n"
            . "/restart — начать анкету заново\n"
            . "/help — показать эту подсказку";
    }

    private function consentKeyboard(): array
    {
        return ['inline_keyboard' => [[['text' => '✅ Принимаю', 'callback_data' => self::ACCEPT_CONSENT]]]];
    }

    private function vacancyKeyboard(): array
    {
        $buttons = [];

        foreach ($this->vacancies as $id => $vacancy) {
            $buttons[] = [['text' => $vacancy['title'], 'callback_data' => self::VACANCY_PREFIX . $id]];
        }

        return ['inline_keyboard' => $buttons];
    }

    private function submitKeyboard(string $vacancyId): array
    {
        return ['inline_keyboard' => [[['text' => '✅ Отправить анкету', 'callback_data' => self::SUBMIT_PREFIX . $vacancyId]]]];
    }

    private function loadState($chatId): array
    {
        $path = $this->statePath($chatId);

        if (!is_file($path)) {
            return ['step' => 'idle', 'draft' => []];
        }

        $state = json_decode((string)file_get_contents($path), true);
        return is_array($state) ? $state : ['step' => 'idle', 'draft' => []];
    }

    private function saveState($chatId, array $state): void
    {
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0755, true);
        }

        file_put_contents($this->statePath($chatId), json_encode($state, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    }

    private function statePath($chatId): string
    {
        return $this->storageDir . '/chat-' . preg_replace('/[^0-9-]/', '', (string)$chatId) . '.json';
    }

    private function sendToManager(string $text): bool
    {
        $managerChatId = $this->config['hr_manager_chat_id'] ?? null;

        if (!$managerChatId) {
            return false;
        }

        return $this->sendMessage($managerChatId, $text);
    }

    private function sendMessage($chatId, string $text, ?array $replyMarkup = null): bool
    {
        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
        ];

        if ($replyMarkup) {
            $payload['reply_markup'] = $replyMarkup;
        }

        return $this->telegramRequest('sendMessage', $payload);
    }

    private function answerCallbackQuery(string $callbackId): bool
    {
        return $this->telegramRequest('answerCallbackQuery', ['callback_query_id' => $callbackId]);
    }

    private function telegramRequest(string $method, array $payload): bool
    {
        $url = 'https://api.telegram.org/bot' . $this->config['bot_token'] . '/' . $method;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT => 10,
        ]);

        curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode >= 200 && $httpCode < 300;
    }

    private function startsWith(string $value, string $prefix): bool
    {
        return substr($value, 0, strlen($prefix)) === $prefix;
    }
}
