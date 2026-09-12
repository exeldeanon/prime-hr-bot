import type { BotConfig } from "./config";
import {
  BOT_STEPS,
  type BotStep,
  type CandidateDraft,
  type CompletedCandidateDraft,
  type InlineKeyboardMarkup,
} from "./types";
import {
  validateAge,
  validateEmploymentStatus,
  validateOnlineReadiness,
  validateRussianPhone,
  validateText,
} from "./validators";
import { VACANCIES, type VacancyId } from "./vacancies";

export const CALLBACKS = {
  acceptConsent: "consent:accept",
  vacancyPrefix: "vacancy:",
  submitPrefix: "application:submit:",
} as const;

export const HELP_TEXT = `Чтобы пройти анкету, отправьте /start и нажмите «Принимаю». Затем ответьте по очереди на 8 коротких вопросов, выберите вакансию и нажмите «Отправить анкету».

/restart — начать анкету заново
/help — показать эту подсказку`;

export const QUESTIONS: Partial<Record<BotStep, string>> = {
  [BOT_STEPS.awaitingName]: "Как я могу к вам обращаться?",
  [BOT_STEPS.awaitingPhone]:
    "Укажите номер телефона для связи. Например: +7 999 123-45-67",
  [BOT_STEPS.awaitingAge]: "Укажите ваш возраст (числом).",
  [BOT_STEPS.awaitingExperience]:
    "Расскажите коротко об опыте работы (в любой сфере). Если опыта нет - напишите «нет».",
  [BOT_STEPS.awaitingLocation]:
    "Гражданство и город, где вы сейчас находитесь?",
  [BOT_STEPS.awaitingEquipment]:
    "Какая у вас техника для работы (ПК/ноутбук/телефон)?",
  [BOT_STEPS.awaitingOnlineReadiness]:
    "Готовы ли вы работать онлайн? (да/нет)",
  [BOT_STEPS.awaitingEmploymentStatus]:
    "Имеется ли у вас открытая самозанятость или ИП, или в каком статусе вы сейчас? (ИП, самозанятость, ничего)",
};

export const CONSENT_KEYBOARD: InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: "✅ Принимаю", callback_data: CALLBACKS.acceptConsent }],
  ],
};

export const VACANCY_KEYBOARD: InlineKeyboardMarkup = {
  inline_keyboard: Object.entries(VACANCIES).map(([id, vacancy]) => [
    {
      text: vacancy.title,
      callback_data: `${CALLBACKS.vacancyPrefix}${id}`,
    },
  ]),
};

export function getSubmitKeyboard(vacancyId: VacancyId): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: "✅ Отправить анкету",
          callback_data: `${CALLBACKS.submitPrefix}${vacancyId}`,
        },
      ],
    ],
  };
}

export function getWelcomeText(config: BotConfig): string {
  return `Здравствуйте! 👋
Я - HR-бот HR Prime. Помогу пройти короткую анкету, выбрать подходящую вакансию и передать заявку HR-менеджеру.

Перед началом ознакомьтесь с документами:
🔗 Политика конфиденциальности: ${config.policyUrl}
🔗 Согласие на обработку персональных данных: ${config.personalDataUrl}

Нажимая «Принимаю», вы соглашаетесь с обоими документами.`;
}

export function getPromptForStep(step: BotStep): string {
  if (step === BOT_STEPS.awaitingConsent) {
    return "Ознакомьтесь с документами выше и нажмите «Принимаю».";
  }

  if (step === BOT_STEPS.awaitingVacancy) {
    return "Выберите вакансию с помощью кнопок выше.";
  }

  if (step === BOT_STEPS.awaitingSubmission) {
    return "Проверьте описание вакансии и нажмите «Отправить анкету».";
  }

  if (step === BOT_STEPS.submitting) {
    return "Анкета уже отправляется. Пожалуйста, подождите.";
  }

  if (step === BOT_STEPS.completed) {
    return "Анкета уже отправлена. Чтобы заполнить новую, отправьте /restart.";
  }

  return QUESTIONS[step] ?? "Чтобы начать анкету, отправьте /start.";
}

interface AnswerSuccess {
  ok: true;
  draft: CandidateDraft;
  nextStep: BotStep;
}

interface AnswerFailure {
  ok: false;
  message: string;
}

export type AnswerTransition = AnswerSuccess | AnswerFailure;

export function advanceCandidateDraft(
  step: BotStep,
  input: string,
  draft: CandidateDraft,
): AnswerTransition {
  switch (step) {
    case BOT_STEPS.awaitingName: {
      const result = validateText(input, { label: "имя", maxLength: 120 });
      return result.ok
        ? {
            ok: true,
            draft: { ...draft, name: result.value },
            nextStep: BOT_STEPS.awaitingPhone,
          }
        : result;
    }

    case BOT_STEPS.awaitingPhone: {
      const result = validateRussianPhone(input);
      return result.ok
        ? {
            ok: true,
            draft: { ...draft, phone: result.value },
            nextStep: BOT_STEPS.awaitingAge,
          }
        : result;
    }

    case BOT_STEPS.awaitingAge: {
      const result = validateAge(input);
      return result.ok
        ? {
            ok: true,
            draft: { ...draft, age: result.value },
            nextStep: BOT_STEPS.awaitingExperience,
          }
        : result;
    }

    case BOT_STEPS.awaitingExperience: {
      const result = validateText(input, {
        label: "опыт работы или «нет»",
        maxLength: 1_000,
      });
      return result.ok
        ? {
            ok: true,
            draft: { ...draft, experience: result.value },
            nextStep: BOT_STEPS.awaitingLocation,
          }
        : result;
    }

    case BOT_STEPS.awaitingLocation: {
      const result = validateText(input, {
        label: "гражданство и город",
        maxLength: 300,
      });
      return result.ok
        ? {
            ok: true,
            draft: { ...draft, citizenshipCity: result.value },
            nextStep: BOT_STEPS.awaitingEquipment,
          }
        : result;
    }

    case BOT_STEPS.awaitingEquipment: {
      const result = validateText(input, {
        label: "технику для работы",
        maxLength: 500,
      });
      return result.ok
        ? {
            ok: true,
            draft: { ...draft, equipment: result.value },
            nextStep: BOT_STEPS.awaitingOnlineReadiness,
          }
        : result;
    }

    case BOT_STEPS.awaitingOnlineReadiness: {
      const result = validateOnlineReadiness(input);
      return result.ok
        ? {
            ok: true,
            draft: { ...draft, onlineReadiness: result.value },
            nextStep: BOT_STEPS.awaitingEmploymentStatus,
          }
        : result;
    }

    case BOT_STEPS.awaitingEmploymentStatus: {
      const result = validateEmploymentStatus(input);
      return result.ok
        ? {
            ok: true,
            draft: { ...draft, employmentStatus: result.value },
            nextStep: BOT_STEPS.awaitingVacancy,
          }
        : result;
    }

    default:
      return {
        ok: false,
        message: getPromptForStep(step),
      };
  }
}

export function toCompletedDraft(
  draft: CandidateDraft,
): CompletedCandidateDraft | null {
  if (
    !draft.name ||
    !draft.phone ||
    typeof draft.age !== "number" ||
    !draft.experience ||
    !draft.citizenshipCity ||
    !draft.equipment ||
    !draft.onlineReadiness ||
    !draft.employmentStatus
  ) {
    return null;
  }

  return {
    name: draft.name,
    phone: draft.phone,
    age: draft.age,
    experience: draft.experience,
    citizenshipCity: draft.citizenshipCity,
    equipment: draft.equipment,
    onlineReadiness: draft.onlineReadiness,
    employmentStatus: draft.employmentStatus,
  };
}

export function isBotStep(value: string): value is BotStep {
  return Object.values(BOT_STEPS).some((step) => step === value);
}
