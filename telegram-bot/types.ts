export const BOT_STEPS = {
  awaitingConsent: "awaiting_consent",
  awaitingName: "awaiting_name",
  awaitingPhone: "awaiting_phone",
  awaitingAge: "awaiting_age",
  awaitingExperience: "awaiting_experience",
  awaitingLocation: "awaiting_location",
  awaitingEquipment: "awaiting_equipment",
  awaitingOnlineReadiness: "awaiting_online_readiness",
  awaitingEmploymentStatus: "awaiting_employment_status",
  awaitingVacancy: "awaiting_vacancy",
  awaitingSubmission: "awaiting_submission",
  submitting: "submitting",
  completed: "completed",
} as const;

export type BotStep = (typeof BOT_STEPS)[keyof typeof BOT_STEPS];

export interface CandidateDraft extends Record<string, unknown> {
  name?: string;
  phone?: string;
  age?: number;
  experience?: string;
  citizenshipCity?: string;
  equipment?: string;
  onlineReadiness?: string;
  employmentStatus?: string;
}

export interface CompletedCandidateDraft {
  name: string;
  phone: string;
  age: number;
  experience: string;
  citizenshipCity: string;
  equipment: string;
  onlineReadiness: string;
  employmentStatus: string;
}

export interface TelegramUser {
  id: number;
}

export interface TelegramChat {
  id: number;
  type: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface HandleUpdateResult {
  ok: true;
  duplicate?: true;
  ignored?: true;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isTelegramUpdate(value: unknown): value is TelegramUpdate {
  if (!isObject(value)) {
    return false;
  }

  return Number.isInteger(value.update_id) && Number(value.update_id) >= 0;
}
