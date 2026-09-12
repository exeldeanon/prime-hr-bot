"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Headphones,
  Layers3,
  Lightbulb,
  MessageSquare,
  Play,
  Radio,
  RefreshCcw,
  RotateCcw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Signal,
  Sparkles,
  UserRound,
  Utensils,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { PracticeBrand } from "@/components/hr-prime/practice-brand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  getScenarioById,
  getScenariosForSector,
  getSectorOption,
  LOAD_OPTIONS,
  SECTORS,
} from "./scenarios";
import {
  calculatePracticeStatistics,
  createPracticeFeedback,
  formatResponseTime,
  formatShiftDuration,
} from "./statistics";
import {
  SHIFT_DURATIONS,
  type CustomerMood,
  type PracticeLoad,
  type PracticeMessage,
  type PracticeSector,
  type PracticeTicket,
  type ReplySource,
  type ShiftSettings,
  type TicketStatus,
} from "./types";

export type PracticeAppProps = {
  login: string;
};

type PracticePhase = "setup" | "active" | "summary";

type ShiftResult = {
  settings: ShiftSettings;
  tickets: PracticeTicket[];
  startedAt: number;
  endedAt: number;
};

const DEFAULT_SETTINGS: ShiftSettings = {
  sector: "universal",
  load: "medium",
  duration: 10,
};

const MOOD_LABELS: Record<CustomerMood, string> = {
  calm: "Спокоен",
  concerned: "Обеспокоен",
  upset: "Расстроен",
  angry: "Сердится",
};

const MOOD_STYLES: Record<CustomerMood, string> = {
  calm:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-200",
  concerned:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/15 dark:bg-sky-400/10 dark:text-sky-200",
  upset:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-200",
  angry:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/15 dark:bg-rose-400/10 dark:text-rose-200",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "В работе",
  closed: "Завершено",
  escalated: "Передано",
};

function getLoadOption(load: PracticeLoad) {
  const option = LOAD_OPTIONS.find((candidate) => candidate.id === load);

  if (!option) {
    throw new Error(`Unknown practice load: ${load}`);
  }

  return option;
}

function makeMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rotateScenarios<T>(items: readonly T[]): T[] {
  if (items.length < 2) {
    return [...items];
  }

  const offset = Math.floor(Math.random() * items.length);
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function createTickets(settings: ShiftSettings, openedAt: number): PracticeTicket[] {
  const count = getLoadOption(settings.load).ticketCount;
  const scenarios = rotateScenarios(getScenariosForSector(settings.sector)).slice(
    0,
    count,
  );

  return scenarios.map((scenario, index) => ({
    scenarioId: scenario.id,
    status: "open",
    messages: [
      {
        id: `${scenario.id}-customer-${openedAt}`,
        author: "customer",
        body: scenario.issue,
        createdAt: openedAt + index,
      },
    ],
    openedAt,
    firstResponseSeconds: null,
    quickRepliesUsed: 0,
    manualReplies: 0,
    resolvedAt: null,
  }));
}

function SectorIcon({ sector, className }: { sector: PracticeSector; className?: string }) {
  if (sector === "bank") {
    return <Building2 className={className} />;
  }

  if (sector === "marketplace") {
    return <ShoppingBag className={className} />;
  }

  if (sector === "food-delivery") {
    return <Utensils className={className} />;
  }

  if (sector === "telecom") {
    return <Radio className={className} />;
  }

  return <Layers3 className={className} />;
}

function SetupScreen({
  login,
  settings,
  onChange,
  onStart,
}: {
  login: string;
  settings: ShiftSettings;
  onChange: (settings: ShiftSettings) => void;
  onStart: () => void;
}) {
  const load = getLoadOption(settings.load);

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#f5fbfa] px-4 py-5 text-slate-950 dark:bg-[#07101f] dark:text-white sm:px-6 sm:py-7">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(rgba(15,23,42,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.025)_1px,transparent_1px)] bg-[size:54px_54px] dark:bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)]" />
      <div className="absolute -right-48 -top-48 -z-10 size-[34rem] rounded-full bg-[#00c9a7]/12 blur-3xl" />
      <div className="absolute -bottom-64 -left-52 -z-10 size-[38rem] rounded-full bg-[#00b4d8]/10 blur-3xl" />

      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <PracticeBrand />
          <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[.045] dark:text-slate-300">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />
            <span className="hidden sm:inline">Доступ активен</span>
            <span className="max-w-32 truncate font-mono text-[11px] text-slate-400">
              {login}
            </span>
          </div>
        </header>

        <section className="mx-auto mt-10 max-w-5xl pb-12 sm:mt-14">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#00b998] to-[#00a7cd] text-white shadow-[0_15px_40px_rgba(0,185,152,.25)]">
              <Headphones className="size-5" />
            </div>
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#008f78] dark:text-[#59e8d0]">
              Тренировочная среда
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.055em] sm:text-5xl">
              Настройте рабочую смену
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              Выберите сферу, интенсивность очереди и время практики. Все обращения учебные — ошибки безопасны.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[30px] border border-white/90 bg-white/88 shadow-[0_28px_90px_rgba(15,23,42,.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d182b]/92 dark:shadow-[0_28px_90px_rgba(0,0,0,.28)]">
            <div className="border-b border-slate-200/70 p-5 dark:border-white/[.08] sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-xl bg-[#e6faf6] text-xs font-black text-[#008f78] dark:bg-[#43e6ca]/10 dark:text-[#65ecd6]">
                  1
                </span>
                <div>
                  <h2 className="text-sm font-black">Сектор поддержки</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Тематика входящих обращений
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {SECTORS.map((sector) => {
                  const selected = settings.sector === sector.id;

                  return (
                    <button
                      key={sector.id}
                      type="button"
                      onClick={() => onChange({ ...settings, sector: sector.id })}
                      aria-pressed={selected}
                      className={cn(
                        "group relative min-h-36 rounded-2xl border p-4 text-left outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#00c9a7]/50",
                        selected
                          ? "border-[#00b998]/45 bg-[#edfbf8] shadow-[0_14px_34px_rgba(0,185,152,.12)] dark:border-[#43e6ca]/30 dark:bg-[#43e6ca]/10"
                          : "border-slate-200/80 bg-slate-50/65 hover:-translate-y-0.5 hover:border-[#00b998]/30 hover:bg-white dark:border-white/[.08] dark:bg-white/[.025] dark:hover:bg-white/[.05]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-xl transition",
                          selected
                            ? "bg-gradient-to-br from-[#00b998] to-[#00a7cd] text-white"
                            : "bg-white text-slate-500 shadow-sm group-hover:text-[#008f78] dark:bg-white/[.06] dark:text-slate-300",
                        )}
                      >
                        <SectorIcon sector={sector.id} className="size-4" />
                      </span>
                      <span className="mt-4 block text-sm font-black leading-tight">
                        {sector.label}
                      </span>
                      <span className="mt-1.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                        {sector.description}
                      </span>
                      {selected && (
                        <CheckCircle2 className="absolute right-3 top-3 size-4 text-[#00a98e] dark:text-[#59e8d0]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid divide-y divide-slate-200/70 dark:divide-white/[.08] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-5 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-[#e6faf6] text-xs font-black text-[#008f78] dark:bg-[#43e6ca]/10 dark:text-[#65ecd6]">
                    2
                  </span>
                  <div>
                    <h2 className="text-sm font-black">Нагрузка</h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Количество диалогов и целевой ответ
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {LOAD_OPTIONS.map((option) => {
                    const selected = settings.load === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onChange({ ...settings, load: option.id })}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-2xl border px-2 py-4 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-[#00c9a7]/50",
                          selected
                            ? "border-[#00b998]/45 bg-[#edfbf8] text-[#007e6a] shadow-[0_10px_28px_rgba(0,185,152,.1)] dark:border-[#43e6ca]/30 dark:bg-[#43e6ca]/10 dark:text-[#72efd9]"
                            : "border-slate-200/80 bg-slate-50/65 text-slate-600 hover:border-[#00b998]/30 dark:border-white/[.08] dark:bg-white/[.025] dark:text-slate-300",
                        )}
                      >
                        <Zap className="mx-auto size-4" />
                        <span className="mt-2 block text-xs font-black">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">
                          {option.ticketCount} диалога
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-[#e6faf6] text-xs font-black text-[#008f78] dark:bg-[#43e6ca]/10 dark:text-[#65ecd6]">
                    3
                  </span>
                  <div>
                    <h2 className="text-sm font-black">Длительность</h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Таймер основной смены
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {SHIFT_DURATIONS.map((duration) => {
                    const selected = settings.duration === duration;

                    return (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => onChange({ ...settings, duration })}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-2xl border px-2 py-5 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-[#00c9a7]/50",
                          selected
                            ? "border-[#00b998]/45 bg-[#edfbf8] text-[#007e6a] shadow-[0_10px_28px_rgba(0,185,152,.1)] dark:border-[#43e6ca]/30 dark:bg-[#43e6ca]/10 dark:text-[#72efd9]"
                            : "border-slate-200/80 bg-slate-50/65 text-slate-600 hover:border-[#00b998]/30 dark:border-white/[.08] dark:bg-white/[.025] dark:text-slate-300",
                        )}
                      >
                        <span className="text-xl font-black tracking-[-.04em]">
                          {duration}
                        </span>
                        <span className="ml-1 text-[10px] font-bold uppercase tracking-wide">
                          мин
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-slate-50/70 p-5 dark:bg-white/[.02] sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="size-4 text-[#00a98e]" />
                <span>
                  {load.ticketCount} обращения · цель ответа до {formatResponseTime(load.targetResponseSeconds)}
                </span>
              </div>
              <Button
                type="button"
                onClick={onStart}
                className="group h-12 rounded-2xl bg-gradient-to-r from-[#00b998] to-[#00a7cd] px-7 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(0,185,152,.22)] hover:opacity-95"
              >
                <Play className="size-4 fill-current" />
                Начать смену
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function QueueItem({
  ticket,
  selected,
  onSelect,
}: {
  ticket: PracticeTicket;
  selected: boolean;
  onSelect: () => void;
}) {
  const scenario = getScenarioById(ticket.scenarioId);

  if (!scenario) {
    return null;
  }

  const lastMessage = ticket.messages.at(-1);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative w-full rounded-2xl border p-3.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#00c9a7]/50",
        selected
          ? "border-[#00b998]/40 bg-[#edfbf8] shadow-[0_12px_28px_rgba(0,169,142,.1)] dark:border-[#43e6ca]/25 dark:bg-[#43e6ca]/10"
          : "border-transparent bg-slate-50/80 hover:border-slate-200 hover:bg-white dark:bg-white/[.025] dark:hover:border-white/10 dark:hover:bg-white/[.05]",
      )}
    >
      {ticket.status === "open" && (
        <span className="absolute right-3 top-3 size-2 rounded-full bg-[#00b998] shadow-[0_0_0_4px_rgba(0,185,152,.12)]" />
      )}
      <div className="flex items-center gap-2.5 pr-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-[11px] font-black text-slate-600 shadow-sm dark:bg-white/[.07] dark:text-slate-200">
          {scenario.customerName
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-black">{scenario.customerName}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
            {scenario.category}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {lastMessage?.body}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.08em]",
            ticket.status === "open"
              ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/15 dark:bg-sky-400/10 dark:text-sky-200"
              : ticket.status === "closed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-200"
                : "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-200",
          )}
        >
          {STATUS_LABELS[ticket.status]}
        </span>
        {scenario.priority !== "normal" && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-300">
            <AlertTriangle className="size-3" />
            {scenario.priority === "critical" ? "Критично" : "Важно"}
          </span>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: PracticeMessage }) {
  if (message.author === "system") {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-400">
          {message.body}
        </span>
      </div>
    );
  }

  const operator = message.author === "operator";

  return (
    <div className={cn("flex", operator ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[72%]",
          operator
            ? "rounded-br-md bg-gradient-to-br from-[#00b998] to-[#00a7cd] text-white"
            : "rounded-bl-md border border-slate-200/80 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[.06] dark:text-slate-100",
        )}
      >
        <p>{message.body}</p>
        <div
          className={cn(
            "mt-2 flex items-center justify-end gap-1.5 text-[9px] font-semibold",
            operator ? "text-white/70" : "text-slate-400",
          )}
        >
          {operator && message.source === "quick-reply" && <span>Скрипт ·</span>}
          <time>
            {new Intl.DateTimeFormat("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(message.createdAt)}
          </time>
          {operator && <CheckCircle2 className="size-3" />}
        </div>
      </div>
    </div>
  );
}

function WorkScreen({
  login,
  settings,
  tickets,
  selectedTicketId,
  remainingSeconds,
  online,
  reply,
  onReplyChange,
  onSelectTicket,
  onSend,
  onResolve,
  onFinish,
}: {
  login: string;
  settings: ShiftSettings;
  tickets: PracticeTicket[];
  selectedTicketId: string;
  remainingSeconds: number;
  online: boolean;
  reply: string;
  onReplyChange: (reply: string) => void;
  onSelectTicket: (id: string) => void;
  onSend: (body: string, source: ReplySource) => void;
  onResolve: (status: Exclude<TicketStatus, "open">) => void;
  onFinish: () => void;
}) {
  const selectedTicket = tickets.find(
    (ticket) => ticket.scenarioId === selectedTicketId,
  );
  const scenario = selectedTicket
    ? getScenarioById(selectedTicket.scenarioId)
    : undefined;
  const sector = getSectorOption(settings.sector);
  const load = getLoadOption(settings.load);
  const openCount = tickets.filter((ticket) => ticket.status === "open").length;

  const submitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reply.trim()) {
      return;
    }

    onSend(reply, "manual");
  };

  return (
    <main className="flex min-h-svh flex-col bg-[#eef5f5] text-slate-950 dark:bg-[#06101d] dark:text-white">
      <header className="border-b border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,.02)] backdrop-blur-xl dark:border-white/[.08] dark:bg-[#0a1526]/95 sm:px-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <PracticeBrand href="/" showLabel={false} className="mr-1" />
          <div className="hidden border-l border-slate-200 pl-3 dark:border-white/10 sm:block">
            <p className="text-sm font-black leading-tight">Панель оператора</p>
            <p className="mt-0.5 max-w-36 truncate font-mono text-[9px] font-semibold text-slate-400">
              {login}
            </p>
          </div>

          <div className="order-3 flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-white/[.06] sm:order-none sm:ml-2 sm:w-auto sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-extrabold text-slate-600 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300">
              <SectorIcon sector={settings.sector} className="size-3" />
              {sector.shortLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-extrabold text-slate-600 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300">
              <Zap className="size-3" />
              {load.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-extrabold text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-200">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Смена активна
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[.04] md:flex">
              {online ? (
                <Wifi className="size-3.5 text-emerald-500" />
              ) : (
                <Signal className="size-3.5 text-rose-500" />
              )}
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
                  Связь
                </p>
                <p className="text-[10px] font-black">
                  {online ? "Стабильная" : "Нет сети"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[.04]">
              <MessageSquare className="size-3.5 text-[#00a98e]" />
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
                  Активные
                </p>
                <p className="text-[10px] font-black">{openCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[.04]">
              <Clock3 className="size-3.5 text-[#00a98e]" />
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
                  Осталось
                </p>
                <p className="min-w-10 font-mono text-[11px] font-black tabular-nums" aria-live="polite">
                  {formatShiftDuration(remainingSeconds)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onFinish}
              aria-label="Завершить смену"
              className="h-10 rounded-xl border-slate-200 px-3 text-[11px] font-extrabold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-white/10 dark:text-slate-200 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
            >
              <XCircle className="size-3.5" />
              <span className="hidden lg:inline">Завершить смену</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[17rem_minmax(0,1fr)] xl:h-[calc(100svh-5.25rem)] xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[.08] dark:bg-[#0c1728]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-white/[.07]">
            <div>
              <h2 className="text-xs font-black">Очередь обращений</h2>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {openCount} в работе · {tickets.length - openCount} обработано
              </p>
            </div>
            <span className="grid size-7 place-items-center rounded-lg bg-[#e6faf6] text-[11px] font-black text-[#008f78] dark:bg-[#43e6ca]/10 dark:text-[#65ecd6]">
              {tickets.length}
            </span>
          </div>
          <div className="grid gap-2 overflow-y-auto p-2.5 sm:grid-cols-2 lg:grid-cols-1">
            {tickets.map((ticket) => (
              <QueueItem
                key={ticket.scenarioId}
                ticket={ticket}
                selected={ticket.scenarioId === selectedTicketId}
                onSelect={() => onSelectTicket(ticket.scenarioId)}
              />
            ))}
          </div>
        </aside>

        <section className="flex min-h-[42rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[.08] dark:bg-[#0c1728] xl:min-h-0">
          {selectedTicket && scenario ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/[.07] sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e8f9f6] to-[#e8f5fa] text-xs font-black text-[#008f78] dark:from-[#43e6ca]/15 dark:to-sky-400/10 dark:text-[#65ecd6]">
                    {scenario.customerName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black">
                      {scenario.customerName}
                    </h2>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {scenario.category} · {scenario.context.clientId}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "hidden rounded-full border px-2.5 py-1 text-[9px] font-extrabold sm:inline-flex",
                      MOOD_STYLES[scenario.mood],
                    )}
                  >
                    {MOOD_LABELS[scenario.mood]}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-extrabold text-slate-600 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300">
                    {STATUS_LABELS[selectedTicket.status]}
                  </span>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col bg-[#f8fbfb] dark:bg-[#081321]">
                <div className="min-h-[22rem] flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6 xl:min-h-0">
                  <div className="mb-5 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200 dark:before:bg-white/[.08] dark:after:bg-white/[.08]">
                    Новое обращение
                  </div>
                  {selectedTicket.messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>

                <div className="border-t border-slate-200/80 bg-white p-3 dark:border-white/[.08] dark:bg-[#0c1728] sm:p-4">
                  {selectedTicket.status === "open" ? (
                    <>
                      <div className="mb-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] text-slate-500 dark:text-slate-400">
                            <Sparkles className="size-3 text-[#00a98e]" />
                            Быстрые ответы
                          </p>
                          <span className="text-[9px] text-slate-400">
                            Нажмите, чтобы отправить
                          </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {scenario.quickReplies.map((quickReply, index) => (
                            <button
                              key={quickReply}
                              type="button"
                              onClick={() => onSend(quickReply, "quick-reply")}
                              className="min-w-56 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[10px] font-semibold leading-relaxed text-slate-600 outline-none transition hover:border-[#00b998]/35 hover:bg-[#edfbf8] hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-[#00c9a7]/50 dark:border-white/10 dark:bg-white/[.035] dark:text-slate-300 dark:hover:bg-[#43e6ca]/10 dark:hover:text-white"
                            >
                              <span className="mr-1.5 text-[#00a98e]">{index + 1}.</span>
                              {quickReply}
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={submitReply} className="flex items-end gap-2">
                        <Textarea
                          value={reply}
                          onChange={(event) => onReplyChange(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              if (reply.trim()) {
                                onSend(reply, "manual");
                              }
                            }
                          }}
                          placeholder="Напишите ответ клиенту…"
                          aria-label="Ответ клиенту"
                          className="min-h-12 resize-none rounded-xl border-slate-200 bg-slate-50/80 px-3 py-3 text-sm shadow-none focus-visible:border-[#00b998] focus-visible:ring-[#00c9a7]/20 dark:border-white/10 dark:bg-white/[.035]"
                        />
                        <Button
                          type="submit"
                          disabled={!reply.trim()}
                          aria-label="Отправить ответ"
                          className="size-12 rounded-xl bg-gradient-to-br from-[#00b998] to-[#00a7cd] p-0 text-white shadow-[0_10px_24px_rgba(0,185,152,.2)] hover:opacity-95"
                        >
                          <Send className="size-4" />
                        </Button>
                      </form>

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onResolve("escalated")}
                          className="h-9 rounded-xl border-amber-200 bg-amber-50/60 px-4 text-[11px] font-extrabold text-amber-700 hover:bg-amber-100 dark:border-amber-400/15 dark:bg-amber-400/[.08] dark:text-amber-200"
                        >
                          <AlertTriangle className="size-3.5" />
                          Передать / Эскалировать
                        </Button>
                        <Button
                          type="button"
                          onClick={() => onResolve("closed")}
                          className="h-9 rounded-xl bg-slate-900 px-4 text-[11px] font-extrabold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Закрыть обращение
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center dark:border-white/10 dark:bg-white/[.035] sm:flex-row sm:text-left">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="size-5 text-emerald-500" />
                        <div>
                          <p className="text-xs font-black">
                            Обращение обработано
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Выберите следующий диалог в очереди.
                          </p>
                        </div>
                      </div>
                      {openCount === 0 && (
                        <Button
                          type="button"
                          onClick={onFinish}
                          className="h-9 rounded-xl bg-gradient-to-r from-[#00b998] to-[#00a7cd] px-4 text-[11px] font-extrabold text-white"
                        >
                          Посмотреть итоги
                          <ArrowRight className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div>
                <MessageSquare className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 text-sm font-black">Выберите обращение</p>
              </div>
            </div>
          )}
        </section>

        <aside className="min-h-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/[.08] dark:bg-[#0c1728] lg:col-span-2 xl:col-span-1">
          {scenario ? (
            <div className="h-full overflow-y-auto">
              <div className="border-b border-slate-100 px-4 py-3.5 dark:border-white/[.07]">
                <h2 className="flex items-center gap-2 text-xs font-black">
                  <UserRound className="size-3.5 text-[#00a98e]" />
                  Контекст клиента
                </h2>
                <p className="mt-1 text-[10px] text-slate-400">
                  Данные учебного профиля
                </p>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#edf9f7] to-[#eef8fb] p-3.5 dark:from-[#43e6ca]/10 dark:to-sky-400/[.07]">
                  <span className="grid size-10 place-items-center rounded-xl bg-white text-xs font-black text-[#008f78] shadow-sm dark:bg-white/[.08] dark:text-[#65ecd6]">
                    {scenario.customerName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black">
                      {scenario.customerName}
                    </p>
                    <p className="mt-1 font-mono text-[9px] font-semibold text-slate-400">
                      ID {scenario.context.clientId}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 px-3 dark:divide-white/[.07] dark:border-white/[.08]">
                  {[
                    ["Сегмент", scenario.context.segment],
                    ["С нами", scenario.context.customerSince],
                    ["Обращения", scenario.context.previousContacts],
                    ...scenario.context.details.map((item) => [item.label, item.value]),
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-2 py-3">
                      <dt className="text-[10px] font-semibold text-slate-400">
                        {label}
                      </dt>
                      <dd className="text-right text-[10px] font-extrabold leading-relaxed text-slate-700 dark:text-slate-200">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 p-3.5 dark:border-amber-400/15 dark:bg-amber-400/[.08]">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.08em] text-amber-700 dark:text-amber-200">
                    <Lightbulb className="size-3.5" />
                    Подсказка
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-amber-900/75 dark:text-amber-100/75">
                    {scenario.hint}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200/80 p-3.5 dark:border-white/[.08]">
                  <p className="text-[10px] font-black uppercase tracking-[.08em] text-slate-400">
                    Ожидаемые действия
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {scenario.expectedActions.map((action) => (
                      <span
                        key={action}
                        className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600 dark:bg-white/[.06] dark:text-slate-300"
                      >
                        {action === "reply"
                          ? "Ответить"
                          : action === "clarify"
                            ? "Уточнить"
                            : action === "verify"
                              ? "Проверить"
                              : action === "close"
                                ? "Закрыть"
                                : "Эскалировать"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function SummaryScreen({
  result,
  onRepeat,
  onChangeLoad,
  onChangeSector,
}: {
  result: ShiftResult;
  onRepeat: () => void;
  onChangeLoad: () => void;
  onChangeSector: () => void;
}) {
  const statistics = calculatePracticeStatistics({
    tickets: result.tickets,
    settings: result.settings,
    startedAt: result.startedAt,
    endedAt: result.endedAt,
  });
  const feedback = createPracticeFeedback(statistics, result.tickets);
  const sector = getSectorOption(result.settings.sector);
  const load = getLoadOption(result.settings.load);
  const metrics = [
    ["Диалогов получено", statistics.dialogsReceived.toString()],
    ["Завершено", statistics.completed.toString()],
    ["Эскалировано", statistics.escalated.toString()],
    ["Не завершено", statistics.unfinished.toString()],
    ["Средний ответ", formatResponseTime(statistics.averageResponseSeconds)],
    ["Скриптов использовано", statistics.scriptsUsed.toString()],
    ["Ручных ответов", statistics.manualReplies.toString()],
    ["Без ответа", statistics.unanswered.toString()],
    ["Критических ситуаций", statistics.criticalSituations.toString()],
    ["Нарушений общения", statistics.communicationViolations.toString()],
  ] as const;

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#f5fbfa] px-4 py-6 text-slate-950 dark:bg-[#07101f] dark:text-white sm:px-6 sm:py-8">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(rgba(15,23,42,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.025)_1px,transparent_1px)] bg-[size:54px_54px] dark:bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)]" />
      <div className="absolute -right-48 top-[-12rem] -z-10 size-[36rem] rounded-full bg-[#00c9a7]/12 blur-3xl" />
      <div className="absolute -bottom-64 -left-52 -z-10 size-[38rem] rounded-full bg-[#00b4d8]/10 blur-3xl" />

      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <PracticeBrand />
          <span className="rounded-full border border-slate-200/80 bg-white/75 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-500 backdrop-blur dark:border-white/10 dark:bg-white/[.045] dark:text-slate-300">
            Смена завершена
          </span>
        </header>

        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#00b998] to-[#00a7cd] text-white shadow-[0_18px_46px_rgba(0,185,152,.26)]">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#008f78] dark:text-[#59e8d0]">
              Практика завершена
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.055em] sm:text-5xl">
              Итоги практики
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Результаты отражают эту тренировочную смену и помогают выбрать фокус для следующего подхода.
            </p>
          </div>

          <div className="mt-9 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
            <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/90 shadow-[0_25px_70px_rgba(15,23,42,.09)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d182b]/92">
              <div className="grid gap-3 border-b border-slate-200/70 bg-gradient-to-r from-[#edf9f7] to-[#eff9fb] p-5 dark:border-white/[.08] dark:from-[#43e6ca]/10 dark:to-sky-400/[.06] sm:grid-cols-3 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-white text-[#008f78] shadow-sm dark:bg-white/[.08] dark:text-[#65ecd6]">
                    <SectorIcon sector={result.settings.sector} className="size-4" />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">
                      Сектор
                    </p>
                    <p className="mt-1 text-xs font-black">{sector.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-white text-[#008f78] shadow-sm dark:bg-white/[.08] dark:text-[#65ecd6]">
                    <Zap className="size-4" />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">
                      Нагрузка
                    </p>
                    <p className="mt-1 text-xs font-black">{load.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-white text-[#008f78] shadow-sm dark:bg-white/[.08] dark:text-[#65ecd6]">
                    <Clock3 className="size-4" />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">
                      Основная смена
                    </p>
                    <p className="mt-1 text-xs font-black">
                      {formatShiftDuration(statistics.actualDurationSeconds)} / {statistics.plannedDurationMinutes} мин
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-200/70 dark:bg-white/[.07] sm:grid-cols-5">
                {metrics.map(([label, value]) => (
                  <div key={label} className="bg-white p-4 dark:bg-[#0d182b] sm:min-h-28 sm:p-5">
                    <p className="text-2xl font-black tracking-[-.04em] text-slate-900 dark:text-white">
                      {value}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold leading-snug text-slate-400">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[26px] border border-emerald-200/70 bg-emerald-50/85 p-5 shadow-[0_18px_50px_rgba(16,185,129,.07)] dark:border-emerald-400/15 dark:bg-emerald-400/[.08]">
                <h2 className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="size-4" />
                  Что получилось хорошо
                </h2>
                <ul className="mt-4 space-y-3">
                  {feedback.strengths.map((strength) => (
                    <li key={strength} className="flex gap-2.5 text-[11px] leading-relaxed text-emerald-900/75 dark:text-emerald-100/75">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[26px] border border-amber-200/70 bg-amber-50/85 p-5 shadow-[0_18px_50px_rgba(245,158,11,.07)] dark:border-amber-400/15 dark:bg-amber-400/[.08]">
                <h2 className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-200">
                  <Lightbulb className="size-4" />
                  Что можно улучшить
                </h2>
                <ul className="mt-4 space-y-3">
                  {feedback.improvements.map((improvement) => (
                    <li key={improvement} className="flex gap-2.5 text-[11px] leading-relaxed text-amber-900/75 dark:text-amber-100/75">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 rounded-[24px] border border-white/90 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[.04] sm:flex-row sm:items-center sm:justify-center">
            <Button
              type="button"
              onClick={onRepeat}
              className="h-11 rounded-xl bg-gradient-to-r from-[#00b998] to-[#00a7cd] px-5 text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(0,185,152,.18)]"
            >
              <RotateCcw className="size-3.5" />
              Повторить смену
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onChangeLoad}
              className="h-11 rounded-xl border-slate-200 px-5 text-xs font-extrabold dark:border-white/10"
            >
              <RefreshCcw className="size-3.5" />
              Сменить нагрузку
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onChangeSector}
              className="h-11 rounded-xl border-slate-200 px-5 text-xs font-extrabold dark:border-white/10"
            >
              <Layers3 className="size-3.5" />
              Сменить сферу
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

export function PracticeApp({ login }: PracticeAppProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<PracticePhase>("setup");
  const [settings, setSettings] = useState<ShiftSettings>(DEFAULT_SETTINGS);
  const [tickets, setTickets] = useState<PracticeTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [reply, setReply] = useState("");
  const [shiftStartedAt, setShiftStartedAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_SETTINGS.duration * 60,
  );
  const [result, setResult] = useState<ShiftResult | null>(null);
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const sessionRequestActive = useRef(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;

    const validateSession = async () => {
      if (disposed || sessionRequestActive.current) {
        return;
      }

      sessionRequestActive.current = true;

      try {
        const response = await fetch("/api/operator/session", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!disposed && (response.status === 401 || response.status === 403)) {
          router.replace("/operator?state=session_expired");
          router.refresh();
        }
      } catch {
        // A transient network failure should not erase an otherwise valid practice.
      } finally {
        sessionRequestActive.current = false;
      }
    };

    void validateSession();
    const interval = window.setInterval(() => void validateSession(), 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void validateSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      sessionRequestActive.current = false;
    };
  }, [router]);

  const startShift = useCallback(() => {
    const startedAt = Date.now();
    const nextTickets = createTickets(settings, startedAt);

    setTickets(nextTickets);
    setSelectedTicketId(nextTickets[0]?.scenarioId ?? "");
    setReply("");
    setShiftStartedAt(startedAt);
    setRemainingSeconds(settings.duration * 60);
    setResult(null);
    setPhase("active");
  }, [settings]);

  const finishShift = useCallback(() => {
    if (phase !== "active" || shiftStartedAt === null) {
      return;
    }

    setResult({
      settings,
      tickets,
      startedAt: shiftStartedAt,
      endedAt: Date.now(),
    });
    setPhase("summary");
  }, [phase, settings, shiftStartedAt, tickets]);

  useEffect(() => {
    if (phase !== "active" || shiftStartedAt === null) {
      return;
    }

    const plannedSeconds = settings.duration * 60;
    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - shiftStartedAt) / 1_000);
      const nextRemaining = Math.max(0, plannedSeconds - elapsedSeconds);
      setRemainingSeconds(nextRemaining);

      if (nextRemaining === 0) {
        finishShift();
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1_000);
    return () => window.clearInterval(interval);
  }, [finishShift, phase, settings.duration, shiftStartedAt]);

  const sendReply = (body: string, source: ReplySource) => {
    const normalized = body.trim();
    if (!normalized || phase !== "active") {
      return;
    }

    const now = Date.now();
    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.scenarioId !== selectedTicketId || ticket.status !== "open") {
          return ticket;
        }

        return {
          ...ticket,
          messages: [
            ...ticket.messages,
            {
              id: makeMessageId(),
              author: "operator",
              body: normalized,
              createdAt: now,
              source,
            },
          ],
          firstResponseSeconds:
            ticket.firstResponseSeconds ??
            Math.max(1, Math.round((now - ticket.openedAt) / 1_000)),
          quickRepliesUsed:
            ticket.quickRepliesUsed + (source === "quick-reply" ? 1 : 0),
          manualReplies: ticket.manualReplies + (source === "manual" ? 1 : 0),
        };
      }),
    );

    if (source === "manual") {
      setReply("");
    }
  };

  const resolveTicket = (status: Exclude<TicketStatus, "open">) => {
    const now = Date.now();
    const nextTickets = tickets.map((ticket) => {
      if (ticket.scenarioId !== selectedTicketId || ticket.status !== "open") {
        return ticket;
      }

      return {
        ...ticket,
        status,
        resolvedAt: now,
        messages: [
          ...ticket.messages,
          {
            id: makeMessageId(),
            author: "system" as const,
            body:
              status === "closed"
                ? "Обращение закрыто оператором"
                : "Обращение передано профильному специалисту",
            createdAt: now,
          },
        ],
      };
    });

    setTickets(nextTickets);
    setReply("");

    const nextOpen = nextTickets.find((ticket) => ticket.status === "open");
    if (nextOpen) {
      setSelectedTicketId(nextOpen.scenarioId);
    }
  };

  const returnToSetup = () => {
    setPhase("setup");
    setTickets([]);
    setSelectedTicketId("");
    setReply("");
    setShiftStartedAt(null);
    setRemainingSeconds(settings.duration * 60);
  };

  if (phase === "setup") {
    return (
      <SetupScreen
        login={login}
        settings={settings}
        onChange={setSettings}
        onStart={startShift}
      />
    );
  }

  if (phase === "summary" && result) {
    return (
      <SummaryScreen
        result={result}
        onRepeat={startShift}
        onChangeLoad={returnToSetup}
        onChangeSector={returnToSetup}
      />
    );
  }

  return (
    <WorkScreen
      login={login}
      settings={settings}
      tickets={tickets}
      selectedTicketId={selectedTicketId}
      remainingSeconds={remainingSeconds}
      online={online}
      reply={reply}
      onReplyChange={setReply}
      onSelectTicket={(id) => {
        setSelectedTicketId(id);
        setReply("");
      }}
      onSend={sendReply}
      onResolve={resolveTicket}
      onFinish={finishShift}
    />
  );
}

export default PracticeApp;
