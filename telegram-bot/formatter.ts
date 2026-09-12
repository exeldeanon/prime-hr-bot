import type { CompletedCandidateDraft } from "./types";
import { VACANCIES, type VacancyId } from "./vacancies";

export function formatCandidateApplication(
  draft: CompletedCandidateDraft,
  vacancyId: VacancyId,
): string {
  return `📄 Анкета кандидата
Вакансия: ${VACANCIES[vacancyId].title}

Имя: ${draft.name}
Возраст: ${draft.age}
Телефон: ${draft.phone}
Опыт работы: ${draft.experience}
Гражданство / город: ${draft.citizenshipCity}
Техника для работы: ${draft.equipment}
Готовность к онлайн: ${draft.onlineReadiness}
Статус/самозанятость/ИП: ${draft.employmentStatus}

Прошу рассмотреть мою кандидатуру. Спасибо! 🙌`;
}

