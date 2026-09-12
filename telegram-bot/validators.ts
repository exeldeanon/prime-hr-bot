interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

interface ValidationFailure {
  ok: false;
  message: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validateText(
  input: string,
  options: { label: string; maxLength: number },
): ValidationResult<string> {
  const value = input.trim();

  if (!value) {
    return { ok: false, message: `⚠️ Укажите ${options.label}.` };
  }

  if (value.length > options.maxLength) {
    return {
      ok: false,
      message: `⚠️ Ответ слишком длинный. Сократите его до ${options.maxLength} символов.`,
    };
  }

  return { ok: true, value };
}

export function validateRussianPhone(input: string): ValidationResult<string> {
  const digits = input.replace(/\D/g, "");

  if (!digits) {
    return { ok: false, message: "⚠️ Укажите номер телефона цифрами." };
  }

  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return { ok: true, value: `+7${digits.slice(1)}` };
  }

  if (digits.length === 10 && digits.startsWith("9")) {
    return { ok: true, value: `+7${digits}` };
  }

  return {
    ok: false,
    message: "⚠️ Не похоже на номер. Формат: +7XXXXXXXXXX.",
  };
}

export function validateAge(input: string): ValidationResult<number> {
  const value = input.trim();

  if (!/^\d{1,3}$/.test(value)) {
    return {
      ok: false,
      message: "⚠️ Укажите возраст целым числом от 1 до 120.",
    };
  }

  const age = Number(value);

  if (age < 1 || age > 120) {
    return {
      ok: false,
      message: "⚠️ Укажите возраст целым числом от 1 до 120.",
    };
  }

  return { ok: true, value: age };
}

export function validateOnlineReadiness(input: string): ValidationResult<string> {
  const value = input.trim().toLocaleLowerCase("ru-RU");

  if (value === "да") {
    return { ok: true, value: "Да" };
  }

  if (value === "нет") {
    return { ok: true, value: "Нет" };
  }

  return { ok: false, message: "⚠️ Ответьте «да» или «нет»." };
}

export function validateEmploymentStatus(input: string): ValidationResult<string> {
  const value = input.trim().toLocaleLowerCase("ru-RU");

  if (value === "ип") {
    return { ok: true, value: "ИП" };
  }

  if (["самозанятость", "самозанятый", "самозанятая"].includes(value)) {
    return { ok: true, value: "Самозанятость" };
  }

  if (["ничего", "нет", "не имеется"].includes(value)) {
    return { ok: true, value: "Ничего" };
  }

  return {
    ok: false,
    message: "⚠️ Укажите один из вариантов: ИП, самозанятость или ничего.",
  };
}

