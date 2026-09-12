import { formatCandidateApplication } from "./formatter";
import { getBotConfig, type BotConfig } from "./config";
import { TelegramBotRepository, type BotSession } from "./repository";
import {
  CALLBACKS,
  CONSENT_KEYBOARD,
  HELP_TEXT,
  QUESTIONS,
  VACANCY_KEYBOARD,
  advanceCandidateDraft,
  getPromptForStep,
  getSubmitKeyboard,
  getWelcomeText,
  toCompletedDraft,
} from "./scenario";
import { TelegramApi } from "./telegram-api";
import {
  BOT_STEPS,
  isTelegramUpdate,
  type HandleUpdateResult,
  type TelegramCallbackQuery,
  type TelegramMessage,
  type TelegramUpdate,
} from "./types";
import { isVacancyId, VACANCIES } from "./vacancies";

const VACANCY_PROMPT = "Выберите вакансию:";
const PRIVATE_CHAT_ONLY_TEXT =
  "Анкету можно заполнить только в личном чате с ботом. Откройте личный чат и отправьте /start.";

interface ProcessingState {
  stateMutated: boolean;
}

function getPersistedApplicationText(
  application: Awaited<
    ReturnType<TelegramBotRepository["getApplicationByFlow"]>
  >,
): string | null {
  if (!application || !isVacancyId(application.vacancyId)) {
    return null;
  }

  return formatCandidateApplication(
    {
      name: application.name,
      phone: application.phone,
      age: application.age,
      experience: application.experience,
      citizenshipCity: application.citizenshipCity,
      equipment: application.equipment,
      onlineReadiness: application.onlineReadiness,
      employmentStatus: application.employmentStatus,
    },
    application.vacancyId,
  );
}

async function deliverPersistedApplication(
  chatId: string,
  application: NonNullable<
    Awaited<ReturnType<TelegramBotRepository["getApplicationByFlow"]>>
  >,
  config: BotConfig,
  api: TelegramApi,
  repository: TelegramBotRepository,
): Promise<void> {
  const applicationText = getPersistedApplicationText(application);

  if (!applicationText) {
    throw new Error("Stored Telegram application has an unknown vacancy");
  }

  await api.sendMessage(chatId, applicationText);

  let deliveryStatus = application.managerDeliveryStatus;

  if (config.managerChatId && deliveryStatus === "pending") {
    const deliveryClaim = await repository.claimManagerDelivery(
      application.flowId,
    );

    if (deliveryClaim === "claimed") {
      let managerSent = false;

      try {
        await api.sendMessage(config.managerChatId, applicationText);
        managerSent = true;
      } catch {
        managerSent = false;
      }

      if (managerSent) {
        await repository.markManagerDelivery(application.flowId, "sent");
        deliveryStatus = "sent";
      } else {
        await repository.markManagerDelivery(application.flowId, "failed");
        deliveryStatus = "failed";
      }
    } else {
      deliveryStatus = deliveryClaim;
    }
  }

  if (deliveryStatus === "sent") {
    await api.sendMessage(
      chatId,
      `✅ Анкета отправлена HR-менеджеру.\nВаш HR-менеджер: ${config.managerUsername}`,
    );
    return;
  }

  await api.sendMessage(
    chatId,
    `Перешлите вашему менеджеру анкету выше.\nВаш HR-менеджер: ${config.managerUsername}`,
  );
}

function getCommand(text: string): string | null {
  const firstToken = text.trim().split(/\s+/, 1)[0]?.toLocaleLowerCase("ru-RU");

  if (!firstToken?.startsWith("/")) {
    return null;
  }

  return firstToken.split("@", 1)[0] ?? null;
}

function isSessionOwner(session: BotSession, telegramUserId: string): boolean {
  return session.telegramUserId === telegramUserId;
}

async function startScenario(
  updateId: number,
  chatId: string,
  telegramUserId: string,
  config: BotConfig,
  api: TelegramApi,
  repository: TelegramBotRepository,
  processingState: ProcessingState,
): Promise<void> {
  await repository.resetSession(chatId, telegramUserId, updateId);
  processingState.stateMutated = true;
  await api.sendMessage(chatId, getWelcomeText(config), CONSENT_KEYBOARD);
}

async function sendCurrentSessionPrompt(
  chatId: string,
  session: BotSession,
  api: TelegramApi,
): Promise<void> {
  if (session.currentStep === BOT_STEPS.awaitingVacancy) {
    await api.sendMessage(chatId, VACANCY_PROMPT, VACANCY_KEYBOARD);
    return;
  }

  if (
    session.currentStep === BOT_STEPS.awaitingSubmission &&
    session.selectedVacancyId &&
    isVacancyId(session.selectedVacancyId)
  ) {
    await api.sendMessage(
      chatId,
      VACANCIES[session.selectedVacancyId].description,
      getSubmitKeyboard(session.selectedVacancyId),
    );
    return;
  }

  await api.sendMessage(chatId, getPromptForStep(session.currentStep));
}

async function handleMessage(
  updateId: number,
  message: TelegramMessage,
  config: BotConfig,
  api: TelegramApi,
  repository: TelegramBotRepository,
  processingState: ProcessingState,
): Promise<void> {
  if (!message.from) {
    return;
  }

  const chatId = String(message.chat.id);

  if (message.chat.type !== "private") {
    await api.sendMessage(chatId, PRIVATE_CHAT_ONLY_TEXT);
    return;
  }

  const telegramUserId = String(message.from.id);
  const text = message.text;
  const command = text ? getCommand(text) : null;

  if (command === "/start" || command === "/restart") {
    await startScenario(
      updateId,
      chatId,
      telegramUserId,
      config,
      api,
      repository,
      processingState,
    );
    return;
  }

  if (command === "/help") {
    await api.sendMessage(chatId, HELP_TEXT);
    return;
  }

  if (command) {
    await api.sendMessage(chatId, `Неизвестная команда.\n\n${HELP_TEXT}`);
    return;
  }

  const session = await repository.getSession(chatId);

  if (!session || !isSessionOwner(session, telegramUserId)) {
    await api.sendMessage(chatId, "Чтобы начать анкету, отправьте /start.");
    return;
  }

  if (!text) {
    await sendCurrentSessionPrompt(chatId, session, api);
    return;
  }

  if (session.lastUpdateId === updateId) {
    await sendCurrentSessionPrompt(chatId, session, api);
    return;
  }

  const transition = advanceCandidateDraft(
    session.currentStep,
    text,
    session.draft,
  );

  if (!transition.ok) {
    await api.sendMessage(chatId, transition.message);
    return;
  }

  const saved = await repository.saveAnswer(
    chatId,
    telegramUserId,
    session.currentStep,
    transition.nextStep,
    transition.draft,
    updateId,
  );

  if (!saved) {
    const currentSession = await repository.getSession(chatId);
    await api.sendMessage(
      chatId,
      currentSession
        ? getPromptForStep(currentSession.currentStep)
        : "Чтобы начать анкету, отправьте /start.",
    );
    return;
  }

  processingState.stateMutated = true;

  if (transition.nextStep === BOT_STEPS.awaitingVacancy) {
    await api.sendMessage(chatId, VACANCY_PROMPT, VACANCY_KEYBOARD);
    return;
  }

  await api.sendMessage(
    chatId,
    QUESTIONS[transition.nextStep] ?? getPromptForStep(transition.nextStep),
  );
}

async function handleConsentCallback(
  updateId: number,
  chatId: string,
  telegramUserId: string,
  api: TelegramApi,
  repository: TelegramBotRepository,
  processingState: ProcessingState,
): Promise<void> {
  const session = await repository.getSession(chatId);

  if (
    session &&
    isSessionOwner(session, telegramUserId) &&
    session.lastUpdateId === updateId &&
    session.currentStep === BOT_STEPS.awaitingName
  ) {
    await api.sendMessage(chatId, QUESTIONS[BOT_STEPS.awaitingName]!);
    return;
  }

  if (
    !session ||
    !isSessionOwner(session, telegramUserId) ||
    session.currentStep !== BOT_STEPS.awaitingConsent
  ) {
    await api.sendMessage(chatId, "Эта кнопка уже неактуальна. Отправьте /restart, чтобы начать заново.");
    return;
  }

  const accepted = await repository.acceptDocuments(
    chatId,
    telegramUserId,
    updateId,
  );

  if (!accepted) {
    await api.sendMessage(chatId, "Эта кнопка уже неактуальна. Отправьте /restart, чтобы начать заново.");
    return;
  }

  processingState.stateMutated = true;

  await api.sendMessage(chatId, QUESTIONS[BOT_STEPS.awaitingName]!);
}

async function handleVacancyCallback(
  updateId: number,
  chatId: string,
  telegramUserId: string,
  callbackData: string,
  api: TelegramApi,
  repository: TelegramBotRepository,
  processingState: ProcessingState,
): Promise<void> {
  const vacancyId = callbackData.slice(CALLBACKS.vacancyPrefix.length);

  if (!isVacancyId(vacancyId)) {
    await api.sendMessage(chatId, "Не удалось определить вакансию. Выберите вариант ещё раз.", VACANCY_KEYBOARD);
    return;
  }

  const session = await repository.getSession(chatId);

  if (
    !session ||
    !isSessionOwner(session, telegramUserId) ||
    session.currentStep !== BOT_STEPS.awaitingVacancy &&
    session.currentStep !== BOT_STEPS.awaitingSubmission
  ) {
    await api.sendMessage(chatId, "Эта кнопка уже неактуальна. Отправьте /restart, чтобы начать заново.");
    return;
  }

  if (!toCompletedDraft(session.draft)) {
    await api.sendMessage(chatId, "Черновик анкеты неполный. Отправьте /restart, чтобы заполнить его заново.");
    return;
  }

  const selected = await repository.selectVacancy(
    chatId,
    telegramUserId,
    vacancyId,
    updateId,
  );

  if (!selected) {
    await api.sendMessage(chatId, "Не удалось сохранить выбор. Нажмите кнопку вакансии ещё раз.");
    return;
  }

  processingState.stateMutated = true;

  await api.sendMessage(
    chatId,
    VACANCIES[vacancyId].description,
    getSubmitKeyboard(vacancyId),
  );
}

async function handleSubmitCallback(
  update: TelegramUpdate,
  chatId: string,
  telegramUserId: string,
  callbackData: string,
  config: BotConfig,
  api: TelegramApi,
  repository: TelegramBotRepository,
  processingState: ProcessingState,
): Promise<void> {
  const callbackVacancyId = callbackData.slice(CALLBACKS.submitPrefix.length);

  const session = await repository.getSession(chatId);

  if (
    !session ||
    !isSessionOwner(session, telegramUserId) ||
    session.currentStep !== BOT_STEPS.awaitingSubmission ||
    !session.flowId ||
    !session.selectedVacancyId ||
    !isVacancyId(session.selectedVacancyId) ||
    !isVacancyId(callbackVacancyId)
  ) {
    await api.sendMessage(chatId, "Эта кнопка уже неактуальна. Отправьте /restart, чтобы начать заново.");
    return;
  }

  if (callbackVacancyId !== session.selectedVacancyId) {
    await api.sendMessage(
      chatId,
      `Вы выбрали другую вакансию. Актуальное описание:\n\n${VACANCIES[session.selectedVacancyId].description}`,
      getSubmitKeyboard(session.selectedVacancyId),
    );
    return;
  }

  const draft = toCompletedDraft(session.draft);

  if (!draft) {
    await api.sendMessage(chatId, "Черновик анкеты неполный. Отправьте /restart, чтобы заполнить его заново.");
    return;
  }

  const submissionStarted = await repository.beginSubmission(
    chatId,
    telegramUserId,
    update.update_id,
    session.flowId,
    session.selectedVacancyId,
  );

  if (!submissionStarted) {
    await api.sendMessage(chatId, "Анкета уже отправляется или была отправлена ранее.");
    return;
  }

  processingState.stateMutated = true;

  const application = await repository.createApplication({
    sourceUpdateId: update.update_id,
    flowId: session.flowId,
    chatId,
    telegramUserId,
    draft,
    vacancyId: session.selectedVacancyId,
    managerDeliveryStatus: config.managerChatId ? "pending" : "not_configured",
    rawPayload: update,
  });

  await repository.completeSubmission(
    chatId,
    telegramUserId,
    session.flowId,
    session.selectedVacancyId,
    update.update_id,
  );
  await deliverPersistedApplication(
    chatId,
    application,
    config,
    api,
    repository,
  );
}

async function handleCallbackQuery(
  update: TelegramUpdate,
  callbackQuery: TelegramCallbackQuery,
  config: BotConfig,
  api: TelegramApi,
  repository: TelegramBotRepository,
  processingState: ProcessingState,
): Promise<void> {
  try {
    await api.answerCallbackQuery(callbackQuery.id);
  } catch {
    // The callback is still processed if Telegram can no longer acknowledge it.
  }

  if (!callbackQuery.message || !callbackQuery.data) {
    return;
  }

  const chatId = String(callbackQuery.message.chat.id);

  if (callbackQuery.message.chat.type !== "private") {
    await api.sendMessage(chatId, PRIVATE_CHAT_ONLY_TEXT);
    return;
  }

  const telegramUserId = String(callbackQuery.from.id);

  if (callbackQuery.data === CALLBACKS.acceptConsent) {
    await handleConsentCallback(
      update.update_id,
      chatId,
      telegramUserId,
      api,
      repository,
      processingState,
    );
    return;
  }

  if (callbackQuery.data.startsWith(CALLBACKS.vacancyPrefix)) {
    await handleVacancyCallback(
      update.update_id,
      chatId,
      telegramUserId,
      callbackQuery.data,
      api,
      repository,
      processingState,
    );
    return;
  }

  if (callbackQuery.data.startsWith(CALLBACKS.submitPrefix)) {
    await handleSubmitCallback(
      update,
      chatId,
      telegramUserId,
      callbackQuery.data,
      config,
      api,
      repository,
      processingState,
    );
  }
}

async function recoverFailedUpdate(
  update: TelegramUpdate,
  config: BotConfig,
  api: TelegramApi,
  repository: TelegramBotRepository,
): Promise<void> {
  if (update.callback_query) {
    try {
      await api.answerCallbackQuery(update.callback_query.id);
    } catch {
      // Expired callbacks cannot be acknowledged, but recovery can continue.
    }
  }

  const message = update.callback_query?.message ?? update.message;
  const user = update.callback_query?.from ?? update.message?.from;

  if (!message || !user) {
    return;
  }

  const chatId = String(message.chat.id);
  const telegramUserId = String(user.id);
  const session = await repository.getSession(chatId);
  const sourceApplication =
    await repository.getApplicationBySourceUpdateId(update.update_id);

  if (
    sourceApplication &&
    sourceApplication.chatId === chatId &&
    sourceApplication.telegramUserId === telegramUserId
  ) {
    if (
      session &&
      session.flowId === sourceApplication.flowId &&
      session.lastUpdateId === update.update_id &&
      (session.currentStep === BOT_STEPS.submitting ||
        session.currentStep === BOT_STEPS.completed)
    ) {
      await repository.completeExistingSubmission(
        chatId,
        telegramUserId,
        sourceApplication.flowId,
        update.update_id,
      );
    }

    await deliverPersistedApplication(
      chatId,
      sourceApplication,
      config,
      api,
      repository,
    );
    return;
  }

  if (
    !session ||
    !isSessionOwner(session, telegramUserId) ||
    session.lastUpdateId !== update.update_id
  ) {
    return;
  }

  if (
    session.flowId &&
    (session.currentStep === BOT_STEPS.submitting ||
      session.currentStep === BOT_STEPS.completed)
  ) {
    const application = await repository.getApplicationByFlow(session.flowId);

    if (application && isVacancyId(application.vacancyId)) {
      const completed = await repository.completeExistingSubmission(
        chatId,
        telegramUserId,
        session.flowId,
        update.update_id,
      );

      if (!completed) {
        return;
      }

      await deliverPersistedApplication(
        chatId,
        application,
        config,
        api,
        repository,
      );
      return;
    }

    if (session.currentStep === BOT_STEPS.submitting) {
      await repository.restoreSubmission(
        chatId,
        telegramUserId,
        session.flowId,
        update.update_id,
      );
      const restoredSession = await repository.getSession(chatId);

      if (restoredSession) {
        await sendCurrentSessionPrompt(chatId, restoredSession, api);
      }

      return;
    }
  }

  const command = update.message?.text
    ? getCommand(update.message.text)
    : null;

  if (
    session.currentStep === BOT_STEPS.awaitingConsent &&
    (command === "/start" || command === "/restart")
  ) {
    await api.sendMessage(chatId, getWelcomeText(config), CONSENT_KEYBOARD);
    return;
  }

  await sendCurrentSessionPrompt(chatId, session, api);
}

async function wasUpdateApplied(
  update: TelegramUpdate,
  repository: TelegramBotRepository,
): Promise<boolean> {
  const message = update.callback_query?.message ?? update.message;
  const user = update.callback_query?.from ?? update.message?.from;

  if (!message || !user) {
    return false;
  }

  const session = await repository.getSession(String(message.chat.id));

  return (
    !!session &&
    isSessionOwner(session, String(user.id)) &&
    session.lastUpdateId !== null &&
    session.lastUpdateId >= update.update_id
  );
}

export async function handleTelegramUpdate(
  payload: unknown,
  runtimeEnv: Cloudflare.Env,
): Promise<HandleUpdateResult> {
  if (!isTelegramUpdate(payload)) {
    return { ok: true, ignored: true };
  }

  const config = getBotConfig(runtimeEnv);
  const repository = new TelegramBotRepository();
  const claimResult = await repository.claimUpdate(payload.update_id);

  if (claimResult === "completed") {
    return { ok: true, duplicate: true };
  }

  if (claimResult === "processing") {
    throw new Error("Telegram update is still being processed");
  }

  const api = new TelegramApi(config.token);

  if (
    claimResult === "failed" ||
    (claimResult === "stale" &&
      (await wasUpdateApplied(payload, repository)))
  ) {
    try {
      await recoverFailedUpdate(payload, config, api, repository);
      await repository.markUpdateCompleted(payload.update_id);
      return { ok: true, duplicate: true };
    } catch (error) {
      await repository.markUpdateFailed(payload.update_id);
      throw error;
    }
  }

  const processingState: ProcessingState = { stateMutated: false };

  try {
    if (payload.callback_query) {
      await handleCallbackQuery(
        payload,
        payload.callback_query,
        config,
        api,
        repository,
        processingState,
      );
    } else if (payload.message) {
      await handleMessage(
        payload.update_id,
        payload.message,
        config,
        api,
        repository,
        processingState,
      );
    }

    await repository.markUpdateCompleted(payload.update_id);
    return { ok: true };
  } catch (error) {
    if (processingState.stateMutated) {
      await repository.markUpdateFailed(payload.update_id);
    } else {
      await repository.releaseUpdate(payload.update_id);
    }
    throw error;
  }
}
