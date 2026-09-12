export const SECTOR_IDS = [
  "bank",
  "marketplace",
  "food-delivery",
  "telecom",
  "universal",
] as const;

export type PracticeSector = (typeof SECTOR_IDS)[number];

export const LOAD_LEVEL_IDS = ["light", "medium", "high"] as const;

export type PracticeLoad = (typeof LOAD_LEVEL_IDS)[number];

export const SHIFT_DURATIONS = [10, 20, 30] as const;

export type ShiftDuration = (typeof SHIFT_DURATIONS)[number];

export type CustomerMood = "calm" | "concerned" | "upset" | "angry";

export type ScenarioPriority = "normal" | "high" | "critical";

export type ExpectedAction =
  | "reply"
  | "clarify"
  | "verify"
  | "close"
  | "escalate";

export type TicketStatus = "open" | "closed" | "escalated";

export type MessageAuthor = "customer" | "operator" | "system";

export type ReplySource = "manual" | "quick-reply";

export interface SectorOption {
  id: PracticeSector;
  label: string;
  shortLabel: string;
  description: string;
}

export interface LoadOption {
  id: PracticeLoad;
  label: string;
  description: string;
  ticketCount: number;
  targetResponseSeconds: number;
}

export interface ScenarioContextItem {
  label: string;
  value: string;
}

export interface ScenarioContext {
  clientId: string;
  segment: string;
  customerSince: string;
  previousContacts: string;
  details: readonly ScenarioContextItem[];
}

export interface PracticeScenario {
  id: string;
  sector: PracticeSector;
  category: string;
  customerName: string;
  mood: CustomerMood;
  priority: ScenarioPriority;
  issue: string;
  context: ScenarioContext;
  hint: string;
  quickReplies: readonly string[];
  expectedActions: readonly ExpectedAction[];
}

export interface ShiftSettings {
  sector: PracticeSector;
  load: PracticeLoad;
  duration: ShiftDuration;
}

export interface PracticeMessage {
  id: string;
  author: MessageAuthor;
  body: string;
  createdAt: number;
  source?: ReplySource;
}

export interface PracticeTicket {
  scenarioId: string;
  status: TicketStatus;
  messages: PracticeMessage[];
  openedAt: number;
  firstResponseSeconds: number | null;
  quickRepliesUsed: number;
  manualReplies: number;
  resolvedAt: number | null;
}

export interface PracticeStatistics {
  plannedDurationMinutes: number;
  actualDurationSeconds: number;
  dialogsReceived: number;
  completed: number;
  escalated: number;
  unfinished: number;
  averageResponseSeconds: number | null;
  scriptsUsed: number;
  manualReplies: number;
  unanswered: number;
  criticalSituations: number;
  communicationViolations: number;
  targetResponseSeconds: number;
}

export interface PracticeFeedback {
  strengths: string[];
  improvements: string[];
}
