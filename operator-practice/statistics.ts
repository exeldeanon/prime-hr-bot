import { getScenarioById } from "./scenarios";
import type {
  PracticeFeedback,
  PracticeStatistics,
  PracticeTicket,
  ShiftSettings,
} from "./types";

const COMMUNICATION_RISK_PATTERNS = [
  /сам(?:а|и)? виноват/iu,
  /успокойтесь/iu,
  /не моя проблема/iu,
  /читайте внимательнее/iu,
  /ничем не могу помочь/iu,
  /пришлите.{0,24}(?:пароль|код из смс|cvv|cvc)/iu,
  /полный номер карты/iu,
] as const;

export interface CalculatePracticeStatisticsInput {
  tickets: readonly PracticeTicket[];
  settings: ShiftSettings;
  startedAt: number;
  endedAt: number;
}

function countCommunicationViolations(
  tickets: readonly PracticeTicket[],
): number {
  return tickets.reduce((total, ticket) => {
    const violationsInTicket = ticket.messages.filter(
      (message) =>
        message.author === "operator" &&
        COMMUNICATION_RISK_PATTERNS.some((pattern) => pattern.test(message.body)),
    ).length;

    return total + violationsInTicket;
  }, 0);
}

export function calculatePracticeStatistics({
  tickets,
  settings,
  startedAt,
  endedAt,
}: CalculatePracticeStatisticsInput): PracticeStatistics {
  const responseTimes = tickets.flatMap((ticket) =>
    ticket.firstResponseSeconds === null ? [] : [ticket.firstResponseSeconds],
  );
  const totalResponseSeconds = responseTimes.reduce(
    (total, seconds) => total + seconds,
    0,
  );
  const load = settings.load;
  const targetResponseSeconds =
    load === "light" ? 90 : load === "medium" ? 60 : 40;

  return {
    plannedDurationMinutes: settings.duration,
    actualDurationSeconds: Math.max(
      0,
      Math.round((Math.max(endedAt, startedAt) - startedAt) / 1_000),
    ),
    dialogsReceived: tickets.length,
    completed: tickets.filter((ticket) => ticket.status === "closed").length,
    escalated: tickets.filter((ticket) => ticket.status === "escalated").length,
    unfinished: tickets.filter((ticket) => ticket.status === "open").length,
    averageResponseSeconds:
      responseTimes.length > 0
        ? Math.round(totalResponseSeconds / responseTimes.length)
        : null,
    scriptsUsed: tickets.reduce(
      (total, ticket) => total + ticket.quickRepliesUsed,
      0,
    ),
    manualReplies: tickets.reduce(
      (total, ticket) => total + ticket.manualReplies,
      0,
    ),
    unanswered: tickets.filter((ticket) => ticket.firstResponseSeconds === null)
      .length,
    criticalSituations: tickets.filter(
      (ticket) => getScenarioById(ticket.scenarioId)?.priority === "critical",
    ).length,
    communicationViolations: countCommunicationViolations(tickets),
    targetResponseSeconds,
  };
}

function countCorrectCriticalEscalations(
  tickets: readonly PracticeTicket[],
): number {
  return tickets.filter(
    (ticket) =>
      ticket.status === "escalated" &&
      getScenarioById(ticket.scenarioId)?.priority === "critical",
  ).length;
}

export function createPracticeFeedback(
  statistics: PracticeStatistics,
  tickets: readonly PracticeTicket[],
): PracticeFeedback {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const resolved = statistics.completed + statistics.escalated;
  const resolutionRate =
    statistics.dialogsReceived === 0
      ? 0
      : resolved / statistics.dialogsReceived;
  const criticalEscalations = countCorrectCriticalEscalations(tickets);

  if (resolutionRate >= 0.8) {
    strengths.push(
      `Вы довели до результата ${resolved} из ${statistics.dialogsReceived} обращений.`,
    );
  }

  if (
    statistics.averageResponseSeconds !== null &&
    statistics.averageResponseSeconds <= statistics.targetResponseSeconds
  ) {
    strengths.push(
      `Среднее время первого ответа уложилось в целевые ${formatResponseTime(statistics.targetResponseSeconds)}.`,
    );
  }

  if (statistics.scriptsUsed > 0) {
    strengths.push(
      `Вы использовали готовые скрипты ${statistics.scriptsUsed} ${decline(statistics.scriptsUsed, "раз", "раза", "раз")}, сохраняя единый тон общения.`,
    );
  }

  if (
    statistics.criticalSituations > 0 &&
    criticalEscalations === statistics.criticalSituations
  ) {
    strengths.push("Все критические ситуации были вовремя переданы специалистам.");
  }

  if (strengths.length === 0 && statistics.manualReplies > 0) {
    strengths.push(
      "Вы включались в диалоги вручную и адаптировали ответы под ситуацию клиента.",
    );
  }

  if (strengths.length === 0) {
    strengths.push("Вы познакомились с очередью и основными действиями оператора.");
  }

  if (statistics.unfinished > 0) {
    improvements.push(
      `Перед завершением смены закрывайте или передавайте оставшиеся обращения — сейчас их ${statistics.unfinished}.`,
    );
  }

  if (statistics.unanswered > 0) {
    improvements.push(
      `Не оставляйте клиентов без первого ответа: без ответа осталось ${statistics.unanswered}.`,
    );
  }

  if (
    statistics.averageResponseSeconds !== null &&
    statistics.averageResponseSeconds > statistics.targetResponseSeconds
  ) {
    improvements.push(
      `Сократите первый ответ до ${formatResponseTime(statistics.targetResponseSeconds)}: текущий средний результат — ${formatResponseTime(statistics.averageResponseSeconds)}.`,
    );
  }

  if (criticalEscalations < statistics.criticalSituations) {
    improvements.push(
      "Критические вопросы безопасности и здоровья лучше сразу эскалировать профильной команде.",
    );
  }

  if (statistics.communicationViolations > 0) {
    improvements.push(
      "Проверьте формулировки ручных ответов: избегайте резкого тона и запроса секретных данных.",
    );
  }

  if (
    improvements.length === 0 &&
    statistics.manualReplies === 0 &&
    statistics.dialogsReceived > 0
  ) {
    improvements.push(
      "Попробуйте дополнить скрипты короткими ручными ответами, когда клиенту нужна персонализация.",
    );
  }

  if (improvements.length === 0) {
    improvements.push(
      "На следующей смене попробуйте более высокую нагрузку, сохранив текущую точность.",
    );
  }

  return {
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  };
}

export function formatResponseTime(seconds: number | null): string {
  if (seconds === null) {
    return "—";
  }

  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return minutes > 0
    ? `${minutes}:${remainder.toString().padStart(2, "0")}`
    : `${remainder} сек`;
}

export function formatShiftDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const remainder = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, remainder]
      .map((part) => part.toString().padStart(2, "0"))
      .join(":");
  }

  return `${minutes.toString().padStart(2, "0")}:${remainder
    .toString()
    .padStart(2, "0")}`;
}

function decline(
  value: number,
  singular: string,
  paucal: string,
  plural: string,
): string {
  const mod100 = Math.abs(value) % 100;
  const mod10 = mod100 % 10;

  if (mod100 >= 11 && mod100 <= 19) {
    return plural;
  }

  if (mod10 === 1) {
    return singular;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return paucal;
  }

  return plural;
}
