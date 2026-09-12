import { and, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db";
import {
  candidateApplications,
  processedTelegramUpdates,
  telegramSessions,
} from "@/db/schema";
import {
  BOT_STEPS,
  type BotStep,
  type CandidateDraft,
  type CompletedCandidateDraft,
  type TelegramUpdate,
} from "./types";
import { isBotStep } from "./scenario";
import type { VacancyId } from "./vacancies";

export interface BotSession {
  chatId: string;
  telegramUserId: string;
  flowId: string | null;
  currentStep: BotStep;
  acceptedAt: Date | null;
  selectedVacancyId: string | null;
  lastUpdateId: number | null;
  draft: CandidateDraft;
}

export type UpdateClaimResult =
  | "claimed"
  | "completed"
  | "failed"
  | "stale"
  | "processing";

export interface PersistedApplication {
  sourceUpdateId: number;
  flowId: string;
  chatId: string;
  telegramUserId: string;
  name: string;
  phone: string;
  age: number;
  experience: string;
  citizenshipCity: string;
  equipment: string;
  onlineReadiness: string;
  employmentStatus: string;
  vacancyId: string;
  managerDeliveryStatus: string;
}

export type ManagerDeliveryStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "not_configured";

function toPersistedApplication(
  row: typeof candidateApplications.$inferSelect,
): PersistedApplication | null {
  if (!row.flowId) {
    return null;
  }

  return {
    sourceUpdateId: row.sourceUpdateId,
    flowId: row.flowId,
    chatId: row.chatId,
    telegramUserId: row.telegramUserId,
    name: row.name,
    phone: row.phone,
    age: row.age,
    experience: row.experience,
    citizenshipCity: row.citizenshipCity,
    equipment: row.equipment,
    onlineReadiness: row.onlineReady,
    employmentStatus: row.employmentStatus,
    vacancyId: row.vacancyId,
    managerDeliveryStatus: row.managerDeliveryStatus,
  };
}

export class TelegramBotRepository {
  private readonly db = getDb();

  async claimUpdate(updateId: number): Promise<UpdateClaimResult> {
    const rows = await this.db
      .insert(processedTelegramUpdates)
      .values({ updateId, status: "processing" })
      .onConflictDoNothing()
      .returning({ updateId: processedTelegramUpdates.updateId });

    if (rows.length === 1) {
      return "claimed";
    }

    const [existing] = await this.db
      .select({
        status: processedTelegramUpdates.status,
        processedAt: processedTelegramUpdates.processedAt,
      })
      .from(processedTelegramUpdates)
      .where(eq(processedTelegramUpdates.updateId, updateId))
      .limit(1);

    if (!existing) {
      return "processing";
    }

    if (existing.status === "completed") {
      return "completed";
    }

    const now = new Date();

    if (existing.status === "failed") {
      const acquired = await this.db
        .update(processedTelegramUpdates)
        .set({ status: "processing", processedAt: now })
        .where(
          and(
            eq(processedTelegramUpdates.updateId, updateId),
            eq(processedTelegramUpdates.status, "failed"),
          ),
        )
        .returning({ updateId: processedTelegramUpdates.updateId });

      return acquired.length === 1 ? "failed" : "processing";
    }

    const staleBefore = new Date(now.getTime() - 60_000);

    if (existing.processedAt < staleBefore) {
      const reclaimed = await this.db
        .update(processedTelegramUpdates)
        .set({ status: "processing", processedAt: now })
        .where(
          and(
            eq(processedTelegramUpdates.updateId, updateId),
            eq(processedTelegramUpdates.status, "processing"),
            lt(processedTelegramUpdates.processedAt, staleBefore),
          ),
        )
        .returning({ updateId: processedTelegramUpdates.updateId });

      if (reclaimed.length === 1) {
        return "stale";
      }
    }

    return "processing";
  }

  async releaseUpdate(updateId: number): Promise<void> {
    await this.db
      .delete(processedTelegramUpdates)
      .where(eq(processedTelegramUpdates.updateId, updateId));
  }

  async markUpdateFailed(updateId: number): Promise<void> {
    await this.db
      .update(processedTelegramUpdates)
      .set({ status: "failed" })
      .where(eq(processedTelegramUpdates.updateId, updateId));
  }

  async markUpdateCompleted(updateId: number): Promise<void> {
    await this.db
      .update(processedTelegramUpdates)
      .set({ status: "completed" })
      .where(eq(processedTelegramUpdates.updateId, updateId));
  }

  async getSession(chatId: string): Promise<BotSession | null> {
    const [row] = await this.db
      .select()
      .from(telegramSessions)
      .where(eq(telegramSessions.chatId, chatId))
      .limit(1);

    if (!row || !isBotStep(row.currentStep)) {
      return null;
    }

    return {
      chatId: row.chatId,
      telegramUserId: row.telegramUserId,
      flowId: row.flowId,
      currentStep: row.currentStep,
      acceptedAt: row.acceptedAt,
      selectedVacancyId: row.selectedVacancyId,
      lastUpdateId: row.lastUpdateId,
      draft: row.draftJson as CandidateDraft,
    };
  }

  async resetSession(
    chatId: string,
    telegramUserId: string,
    updateId: number,
  ): Promise<void> {
    const now = new Date();
    const flowId = crypto.randomUUID();

    await this.db
      .insert(telegramSessions)
      .values({
        chatId,
        telegramUserId,
        flowId,
        currentStep: BOT_STEPS.awaitingConsent,
        acceptedAt: null,
        selectedVacancyId: null,
        lastUpdateId: updateId,
        draftJson: {},
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: telegramSessions.chatId,
        set: {
          telegramUserId,
          flowId,
          currentStep: BOT_STEPS.awaitingConsent,
          acceptedAt: null,
          selectedVacancyId: null,
          lastUpdateId: updateId,
          draftJson: {},
          updatedAt: now,
        },
      });
  }

  async acceptDocuments(
    chatId: string,
    telegramUserId: string,
    updateId: number,
  ): Promise<boolean> {
    const rows = await this.db
      .update(telegramSessions)
      .set({
        currentStep: BOT_STEPS.awaitingName,
        acceptedAt: new Date(),
        lastUpdateId: updateId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(telegramSessions.chatId, chatId),
          eq(telegramSessions.telegramUserId, telegramUserId),
          eq(telegramSessions.currentStep, BOT_STEPS.awaitingConsent),
        ),
      )
      .returning({ chatId: telegramSessions.chatId });

    return rows.length === 1;
  }

  async saveAnswer(
    chatId: string,
    telegramUserId: string,
    expectedStep: BotStep,
    nextStep: BotStep,
    draft: CandidateDraft,
    updateId: number,
  ): Promise<boolean> {
    const rows = await this.db
      .update(telegramSessions)
      .set({
        currentStep: nextStep,
        draftJson: draft,
        lastUpdateId: updateId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(telegramSessions.chatId, chatId),
          eq(telegramSessions.telegramUserId, telegramUserId),
          eq(telegramSessions.currentStep, expectedStep),
        ),
      )
      .returning({ chatId: telegramSessions.chatId });

    return rows.length === 1;
  }

  async selectVacancy(
    chatId: string,
    telegramUserId: string,
    vacancyId: VacancyId,
    updateId: number,
  ): Promise<boolean> {
    const rows = await this.db
      .update(telegramSessions)
      .set({
        currentStep: BOT_STEPS.awaitingSubmission,
        selectedVacancyId: vacancyId,
        lastUpdateId: updateId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(telegramSessions.chatId, chatId),
          eq(telegramSessions.telegramUserId, telegramUserId),
          inArray(telegramSessions.currentStep, [
            BOT_STEPS.awaitingVacancy,
            BOT_STEPS.awaitingSubmission,
          ]),
        ),
      )
      .returning({ chatId: telegramSessions.chatId });

    return rows.length === 1;
  }

  async getApplicationByFlow(
    flowId: string,
  ): Promise<PersistedApplication | null> {
    const [row] = await this.db
      .select()
      .from(candidateApplications)
      .where(eq(candidateApplications.flowId, flowId))
      .limit(1);

    return row ? toPersistedApplication(row) : null;
  }

  async getApplicationBySourceUpdateId(
    sourceUpdateId: number,
  ): Promise<PersistedApplication | null> {
    const [row] = await this.db
      .select()
      .from(candidateApplications)
      .where(eq(candidateApplications.sourceUpdateId, sourceUpdateId))
      .limit(1);

    return row ? toPersistedApplication(row) : null;
  }

  async claimManagerDelivery(
    flowId: string,
  ): Promise<"claimed" | ManagerDeliveryStatus> {
    const claimed = await this.db
      .update(candidateApplications)
      .set({ managerDeliveryStatus: "sending", updatedAt: new Date() })
      .where(
        and(
          eq(candidateApplications.flowId, flowId),
          eq(candidateApplications.managerDeliveryStatus, "pending"),
        ),
      )
      .returning({ flowId: candidateApplications.flowId });

    if (claimed.length === 1) {
      return "claimed";
    }

    const application = await this.getApplicationByFlow(flowId);
    const status = application?.managerDeliveryStatus;

    if (
      status === "pending" ||
      status === "sending" ||
      status === "sent" ||
      status === "failed" ||
      status === "not_configured"
    ) {
      return status;
    }

    return "failed";
  }

  async markManagerDelivery(
    flowId: string,
    status: "sent" | "failed",
  ): Promise<void> {
    await this.db
      .update(candidateApplications)
      .set({
        managerDeliveryStatus: status,
        managerDeliveredAt: status === "sent" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(candidateApplications.flowId, flowId),
          eq(candidateApplications.managerDeliveryStatus, "sending"),
        ),
      );
  }

  async beginSubmission(
    chatId: string,
    telegramUserId: string,
    updateId: number,
    flowId: string,
    vacancyId: VacancyId,
  ): Promise<boolean> {
    const rows = await this.db
      .update(telegramSessions)
      .set({
        currentStep: BOT_STEPS.submitting,
        lastUpdateId: updateId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(telegramSessions.chatId, chatId),
          eq(telegramSessions.telegramUserId, telegramUserId),
          eq(telegramSessions.flowId, flowId),
          eq(telegramSessions.selectedVacancyId, vacancyId),
          eq(telegramSessions.currentStep, BOT_STEPS.awaitingSubmission),
        ),
      )
      .returning({ chatId: telegramSessions.chatId });

    return rows.length === 1;
  }

  async restoreSubmission(
    chatId: string,
    telegramUserId: string,
    flowId: string,
    updateId: number,
  ): Promise<void> {
    await this.db
      .update(telegramSessions)
      .set({ currentStep: BOT_STEPS.awaitingSubmission, updatedAt: new Date() })
      .where(
        and(
          eq(telegramSessions.chatId, chatId),
          eq(telegramSessions.telegramUserId, telegramUserId),
          eq(telegramSessions.flowId, flowId),
          eq(telegramSessions.lastUpdateId, updateId),
          eq(telegramSessions.currentStep, BOT_STEPS.submitting),
        ),
      );
  }

  async completeSubmission(
    chatId: string,
    telegramUserId: string,
    flowId: string,
    vacancyId: VacancyId,
    updateId: number,
  ): Promise<boolean> {
    const rows = await this.db
      .update(telegramSessions)
      .set({ currentStep: BOT_STEPS.completed, updatedAt: new Date() })
      .where(
        and(
          eq(telegramSessions.chatId, chatId),
          eq(telegramSessions.telegramUserId, telegramUserId),
          eq(telegramSessions.flowId, flowId),
          eq(telegramSessions.selectedVacancyId, vacancyId),
          eq(telegramSessions.lastUpdateId, updateId),
          eq(telegramSessions.currentStep, BOT_STEPS.submitting),
        ),
      )
      .returning({ chatId: telegramSessions.chatId });

    return rows.length === 1;
  }

  async completeExistingSubmission(
    chatId: string,
    telegramUserId: string,
    flowId: string,
    updateId: number,
  ): Promise<boolean> {
    const rows = await this.db
      .update(telegramSessions)
      .set({ currentStep: BOT_STEPS.completed, updatedAt: new Date() })
      .where(
        and(
          eq(telegramSessions.chatId, chatId),
          eq(telegramSessions.telegramUserId, telegramUserId),
          eq(telegramSessions.flowId, flowId),
          eq(telegramSessions.lastUpdateId, updateId),
          inArray(telegramSessions.currentStep, [
            BOT_STEPS.submitting,
            BOT_STEPS.completed,
          ]),
        ),
      )
      .returning({ chatId: telegramSessions.chatId });

    return rows.length === 1;
  }

  async createApplication(input: {
    sourceUpdateId: number;
    flowId: string;
    chatId: string;
    telegramUserId: string;
    draft: CompletedCandidateDraft;
    vacancyId: VacancyId;
    managerDeliveryStatus: ManagerDeliveryStatus;
    rawPayload: TelegramUpdate;
  }): Promise<PersistedApplication> {
    const inserted = await this.db
      .insert(candidateApplications)
      .values({
        sourceUpdateId: input.sourceUpdateId,
        flowId: input.flowId,
        chatId: input.chatId,
        telegramUserId: input.telegramUserId,
        name: input.draft.name,
        phone: input.draft.phone,
        age: input.draft.age,
        experience: input.draft.experience,
        citizenshipCity: input.draft.citizenshipCity,
        equipment: input.draft.equipment,
        onlineReady: input.draft.onlineReadiness,
        employmentStatus: input.draft.employmentStatus,
        vacancyId: input.vacancyId,
        managerDeliveryStatus: input.managerDeliveryStatus,
        rawPayload: input.rawPayload,
        updatedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    const insertedApplication = inserted[0]
      ? toPersistedApplication(inserted[0])
      : null;
    const application =
      insertedApplication ?? (await this.getApplicationByFlow(input.flowId));

    if (!application) {
      throw new Error("Unable to persist Telegram candidate application");
    }

    return application;
  }
}
