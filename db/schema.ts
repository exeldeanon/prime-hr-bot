import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestampMs = (name: string) => integer(name, { mode: "timestamp_ms" });
const currentTimestampMs = sql`(unixepoch() * 1000)`;

export const telegramSessions = sqliteTable("telegram_sessions", {
  chatId: text("chat_id").primaryKey(),
  telegramUserId: text("telegram_user_id").notNull(),
  flowId: text("flow_id"),
  currentStep: text("current_step").notNull(),
  acceptedAt: timestampMs("accepted_at"),
  selectedVacancyId: text("selected_vacancy_id"),
  lastUpdateId: integer("last_update_id"),
  draftJson: text("draft_json", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'`),
  createdAt: timestampMs("created_at")
    .notNull()
    .default(currentTimestampMs),
  updatedAt: timestampMs("updated_at")
    .notNull()
    .default(currentTimestampMs),
});

export const candidateApplications = sqliteTable("candidate_applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceUpdateId: integer("source_update_id").notNull().unique(),
  flowId: text("flow_id").unique(),
  chatId: text("chat_id").notNull(),
  telegramUserId: text("telegram_user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  age: integer("age").notNull(),
  experience: text("experience").notNull(),
  citizenshipCity: text("citizenship_city").notNull(),
  equipment: text("equipment").notNull(),
  onlineReady: text("online_ready").notNull(),
  employmentStatus: text("employment_status").notNull(),
  vacancyId: text("vacancy_id").notNull(),
  managerDeliveryStatus: text("manager_delivery_status")
    .notNull()
    .default("not_configured"),
  managerDeliveredAt: timestampMs("manager_delivered_at"),
  rawPayload: text("raw_payload", { mode: "json" })
    .$type<unknown>()
    .notNull(),
  createdAt: timestampMs("created_at")
    .notNull()
    .default(currentTimestampMs),
  updatedAt: timestampMs("updated_at")
    .notNull()
    .default(currentTimestampMs),
});

export const processedTelegramUpdates = sqliteTable(
  "processed_telegram_updates",
  {
    updateId: integer("update_id").primaryKey(),
    status: text("status").notNull().default("completed"),
    processedAt: timestampMs("processed_at")
      .notNull()
      .default(currentTimestampMs),
  },
);

export const operatorAccesses = sqliteTable("operator_accesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  login: text("login").notNull().unique(),
  tokenHash: text("token_hash").notNull().unique(),
  status: text("status")
    .$type<"active" | "disabled" | "expired">()
    .notNull()
    .default("active"),
  createdAt: timestampMs("created_at")
    .notNull()
    .default(currentTimestampMs),
  usedAt: timestampMs("used_at"),
  lastSeenAt: timestampMs("last_seen_at"),
  expiresAt: timestampMs("expires_at"),
});
