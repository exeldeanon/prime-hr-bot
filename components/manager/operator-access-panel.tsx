"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CirclePlus,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldOff,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";

import { PracticeBrand } from "@/components/hr-prime/practice-brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ApiRecord = Record<string, unknown>;
type AccessStatus = "active" | "disabled" | "expired";
type DateValue = string | number | null;

type OperatorAccess = {
  id: string;
  login: string;
  status: AccessStatus;
  createdAt: DateValue;
  usedAt: DateValue;
  lastSeenAt: DateValue;
  expiresAt: DateValue;
};

type IssuedCredentials = {
  login: string;
  inviteUrl: string;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null;
}

async function readJson(response: Response): Promise<ApiRecord> {
  try {
    const value: unknown = await response.json();
    return isRecord(value) ? value : {};
  } catch {
    return {};
  }
}

function readDate(value: unknown): DateValue {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function asDate(value: DateValue): Date | null {
  if (value === null) {
    return null;
  }

  const timestamp = typeof value === "number" && value < 10_000_000_000 ? value * 1000 : value;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function accessStatus(value: ApiRecord): AccessStatus {
  const rawStatus =
    typeof value.effectiveStatus === "string"
      ? value.effectiveStatus
      : typeof value.status === "string"
        ? value.status
        : "active";
  const normalizedStatus = rawStatus.toLowerCase();

  if (normalizedStatus === "disabled") {
    return "disabled";
  }

  if (normalizedStatus === "expired") {
    return "expired";
  }

  const expiresAt = asDate(readDate(value.expiresAt));
  return expiresAt && expiresAt.getTime() <= Date.now() ? "expired" : "active";
}

function normalizeAccess(value: unknown): OperatorAccess | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawId = value.id;
  const login = typeof value.login === "string" ? value.login.trim() : "";

  if ((typeof rawId !== "string" && typeof rawId !== "number") || !login) {
    return null;
  }

  return {
    id: String(rawId),
    login,
    status: accessStatus(value),
    createdAt: readDate(value.createdAt),
    usedAt: readDate(value.usedAt),
    lastSeenAt: readDate(value.lastSeenAt),
    expiresAt: readDate(value.expiresAt),
  };
}

function normalizeCredentials(value: unknown): IssuedCredentials | null {
  if (!isRecord(value)) {
    return null;
  }

  const login = typeof value.login === "string" ? value.login.trim() : "";
  const inviteUrl = typeof value.inviteUrl === "string" ? value.inviteUrl.trim() : "";

  return login && inviteUrl ? { login, inviteUrl } : null;
}

function normalizeAccessList(value: unknown): OperatorAccess[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const access = normalizeAccess(item);
    return access ? [access] : [];
  });
}

function apiError(response: Response, data: ApiRecord, fallback: string): string {
  const rawError =
    typeof data.error === "string"
      ? data.error
      : isRecord(data.error) && typeof data.error.message === "string"
        ? data.error.message
        : "";

  if (response.status === 401) {
    return "Сессия менеджера завершена. Войдите снова.";
  }

  if (response.status >= 500) {
    return "Сервис доступов временно недоступен. Попробуйте ещё раз чуть позже.";
  }

  return rawError || fallback;
}

function formatDate(value: DateValue): string {
  const date = asDate(value);
  return date ? dateFormatter.format(date) : "—";
}

function statusMeta(status: AccessStatus) {
  switch (status) {
    case "disabled":
      return {
        label: "Отключён",
        dot: "bg-slate-400",
        className:
          "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/[.06] dark:text-slate-300",
      };
    case "expired":
      return {
        label: "Истёк",
        dot: "bg-amber-500",
        className:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/15 dark:bg-amber-400/[.08] dark:text-amber-200",
      };
    case "active":
      return {
        label: "Активен",
        dot: "bg-emerald-500",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/15 dark:bg-emerald-400/[.08] dark:text-emerald-200",
      };
  }
}

async function writeClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Clipboard is unavailable");
  }
}

function CopyField({
  copyKey,
  copiedKey,
  label,
  value,
  onCopy,
}: {
  copyKey: string;
  copiedKey: string | null;
  label: string;
  value: string;
  onCopy: (key: string, value: string) => void;
}) {
  const copied = copiedKey === copyKey;

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-white/75 p-4 dark:border-emerald-400/15 dark:bg-white/[.045]">
      <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-emerald-700 dark:text-emerald-300">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <code className="min-w-0 flex-1 break-all text-sm font-bold text-slate-900 dark:text-white">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCopy(copyKey, value)}
          className="shrink-0 rounded-xl border-emerald-200 bg-white text-xs font-bold hover:bg-emerald-50 dark:border-emerald-400/15 dark:bg-white/[.06] dark:hover:bg-emerald-400/[.1]"
          aria-label={`Скопировать ${label.toLowerCase()}`}
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? "Скопировано" : "Копировать"}
        </Button>
      </div>
    </div>
  );
}

function AccessStatusBadge({ status }: { status: AccessStatus }) {
  const meta = statusMeta(status);

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.08em]",
        meta.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function OperatorAccessPanel() {
  const router = useRouter();
  const [accesses, setAccesses] = useState<OperatorAccess[]>([]);
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/manager/operator-accesses", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await readJson(response);

        if (!response.ok) {
          setError(apiError(response, data, "Не удалось загрузить список доступов."));
          if (response.status === 401) {
            router.refresh();
          }
          return;
        }

        setAccesses(normalizeAccessList(data.accesses));
      } catch (requestError) {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setError("Не удалось загрузить доступы. Проверьте соединение и обновите список.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [router]);

  const handleCopy = (key: string, value: string) => {
    void (async () => {
      try {
        await writeClipboard(value);
        setCopiedKey(key);
        window.setTimeout(() => {
          setCopiedKey((current) => (current === key ? null : current));
        }, 1800);
      } catch {
        setError("Не удалось скопировать. Выделите значение и скопируйте его вручную.");
      }
    })();
  };

  const handleRefresh = () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch("/api/manager/operator-accesses", {
          cache: "no-store",
        });
        const data = await readJson(response);

        if (!response.ok) {
          setError(apiError(response, data, "Не удалось обновить список доступов."));
          if (response.status === 401) {
            router.refresh();
          }
          return;
        }

        setAccesses(normalizeAccessList(data.accesses));
      } catch {
        setError("Не удалось обновить список. Проверьте соединение и попробуйте снова.");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleCreate = () => {
    if (creating) {
      return;
    }

    setCreating(true);
    setError(null);
    setIssuedCredentials(null);

    void (async () => {
      try {
        const response = await fetch("/api/manager/operator-accesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await readJson(response);

        if (!response.ok) {
          setError(apiError(response, data, "Не удалось создать доступ."));
          if (response.status === 401) {
            router.refresh();
          }
          return;
        }

        const access = normalizeAccess(data.access);
        const credentials = normalizeCredentials(data.credentials);

        if (!access || !credentials) {
          setError("Доступ создан, но сервис вернул неполные данные. Обновите список.");
          return;
        }

        setAccesses((current) => [
          access,
          ...current.filter((item) => item.id !== access.id),
        ]);
        setIssuedCredentials(credentials);
      } catch {
        setError("Не удалось создать доступ. Проверьте соединение и попробуйте снова.");
      } finally {
        setCreating(false);
      }
    })();
  };

  const handleDisable = (access: OperatorAccess) => {
    if (disablingId) {
      return;
    }

    setDisablingId(access.id);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(
          `/api/manager/operator-accesses/${encodeURIComponent(access.id)}/disable`,
          { method: "POST" },
        );
        const data = await readJson(response);

        if (!response.ok) {
          setError(apiError(response, data, "Не удалось отключить доступ."));
          if (response.status === 401) {
            router.refresh();
          }
          return;
        }

        const updatedAccess = normalizeAccess(data.access) ?? {
          ...access,
          status: "disabled" as const,
        };
        setAccesses((current) =>
          current.map((item) => (item.id === access.id ? updatedAccess : item)),
        );
      } catch {
        setError("Не удалось отключить доступ. Проверьте соединение и попробуйте снова.");
      } finally {
        setDisablingId(null);
      }
    })();
  };

  const handleLogout = () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch("/api/manager/logout", { method: "POST" });

        if (!response.ok) {
          const data = await readJson(response);
          setError(apiError(response, data, "Не удалось выйти из админки."));
          return;
        }

        router.replace("/manager");
        router.refresh();
      } catch {
        setError("Не удалось выйти из админки. Проверьте соединение и попробуйте снова.");
      } finally {
        setLoggingOut(false);
      }
    })();
  };

  const activeCount = accesses.filter((access) => access.status === "active").length;

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#f5fbfa] text-slate-950 dark:bg-[#07101f] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.025)_1px,transparent_1px)] bg-[size:54px_54px] dark:bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute -left-52 -top-48 size-[34rem] rounded-full bg-[#00b4d8]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 top-52 size-[38rem] rounded-full bg-[#00c9a7]/10 blur-3xl" />

      <header className="relative border-b border-slate-200/70 bg-white/70 backdrop-blur-2xl dark:border-white/[.08] dark:bg-[#07101f]/75">
        <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <PracticeBrand />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-full px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 sm:inline-flex dark:text-slate-400 dark:hover:bg-white/[.06] dark:hover:text-white"
            >
              На сайт
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full border-slate-200 bg-white/80 text-xs font-bold dark:border-white/10 dark:bg-white/[.06]"
            >
              {loggingOut ? <LoaderCircle className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00c9a7]/20 bg-[#00c9a7]/[.07] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#008f78] dark:text-[#59e8d0]">
              <UserRoundCheck className="size-3.5" />
              Админка менеджера
            </div>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.1rem,5vw,4.3rem)] font-black leading-[.98] tracking-[-.06em]">
              Доступ к практике оператора
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
              Создайте логин и одноразовую пригласительную ссылку, передайте их человеку и при необходимости отключите доступ.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="h-12 rounded-2xl bg-gradient-to-r from-[#00b998] to-[#00a7cd] px-6 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(0,185,152,.24)] hover:opacity-95"
          >
            {creating ? <LoaderCircle className="size-4 animate-spin" /> : <CirclePlus className="size-4" />}
            {creating ? "Создаём доступ…" : "Сгенерировать доступ"}
          </Button>
        </section>

        {error && (
          <Alert variant="destructive" className="mt-7 rounded-2xl border-red-200 bg-white/85 dark:border-red-400/20 dark:bg-[#0d182b]/90">
            <AlertCircle />
            <AlertDescription className="grid-cols-[minmax(0,1fr)_auto] items-center justify-items-stretch gap-4">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded-lg p-1 text-current transition hover:bg-red-500/10"
                aria-label="Закрыть сообщение"
              >
                <X className="size-3.5" />
              </button>
            </AlertDescription>
          </Alert>
        )}

        {issuedCredentials && (
          <section className="relative mt-7 overflow-hidden rounded-[28px] border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,.96),rgba(236,254,255,.92))] p-5 shadow-[0_22px_65px_rgba(0,169,142,.12)] dark:border-emerald-400/15 dark:bg-[linear-gradient(135deg,rgba(16,185,129,.10),rgba(14,165,233,.07))] sm:p-7">
            <div className="absolute -right-16 -top-20 size-64 rounded-full bg-[#00c9a7]/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-emerald-900 dark:text-emerald-100">
                    <Sparkles className="size-4" />
                    Доступ готов
                  </div>
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-100/70">
                    Сохраните оба значения сейчас. Пригласительная ссылка содержит секретный токен и повторно в списке не показывается.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIssuedCredentials(null)}
                  className="rounded-xl p-2 text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-200"
                  aria-label="Закрыть данные нового доступа"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-[.7fr_1.3fr]">
                <CopyField
                  copyKey="new-login"
                  copiedKey={copiedKey}
                  label="Логин"
                  value={issuedCredentials.login}
                  onCopy={handleCopy}
                />
                <CopyField
                  copyKey="new-invite"
                  copiedKey={copiedKey}
                  label="Пригласительная ссылка"
                  value={issuedCredentials.inviteUrl}
                  onCopy={handleCopy}
                />
              </div>
              <a
                href={issuedCredentials.inviteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-emerald-800 transition hover:text-emerald-600 dark:text-emerald-200 dark:hover:text-white"
              >
                Проверить страницу приглашения
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </section>
        )}

        <section className="mt-8 overflow-hidden rounded-[28px] border border-white/90 bg-white/82 shadow-[0_25px_75px_rgba(15,23,42,.09)] backdrop-blur-2xl dark:border-white/[.09] dark:bg-[#0d182b]/88">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-white/[.08]">
            <div>
              <h2 className="text-lg font-black tracking-[-.035em]">Выданные доступы</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Всего {accesses.length} · активных {activeCount}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="w-fit rounded-xl border-slate-200 bg-white text-xs font-bold dark:border-white/10 dark:bg-white/[.045]"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Обновить
            </Button>
          </div>

          {loading ? (
            <div className="grid min-h-56 place-items-center px-5 py-12 text-center">
              <div>
                <LoaderCircle className="mx-auto size-6 animate-spin text-[#00a98e]" />
                <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Загружаем доступы…</p>
              </div>
            </div>
          ) : accesses.length === 0 ? (
            <div className="grid min-h-64 place-items-center px-5 py-12 text-center">
              <div className="max-w-sm">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[.06]">
                  <KeyRound className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-black">Доступов пока нет</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Сгенерируйте первый логин и отправьте человеку его вместе с пригласительной ссылкой.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-[minmax(180px,1.2fr)_130px_minmax(150px,.8fr)_minmax(150px,.8fr)_auto] gap-5 border-b border-slate-200/60 px-7 py-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400 lg:grid dark:border-white/[.06]">
                <span>Логин</span>
                <span>Статус</span>
                <span>Создан</span>
                <span>Последний вход</span>
                <span className="text-right">Действие</span>
              </div>
              <div className="divide-y divide-slate-200/70 dark:divide-white/[.07]">
                {accesses.map((access) => (
                  <article
                    key={access.id}
                    className="grid gap-5 px-5 py-5 transition hover:bg-slate-50/70 sm:px-7 lg:grid-cols-[minmax(180px,1.2fr)_130px_minmax(150px,.8fr)_minmax(150px,.8fr)_auto] lg:items-center dark:hover:bg-white/[.025]"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400 lg:hidden">Логин</p>
                      <div className="mt-1 flex min-w-0 items-center gap-2 lg:mt-0">
                        <code className="truncate text-sm font-black text-slate-900 dark:text-white">{access.login}</code>
                        <button
                          type="button"
                          onClick={() => handleCopy(`login-${access.id}`, access.login)}
                          className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-[#00c9a7]/10 hover:text-[#008f78] dark:hover:text-[#59e8d0]"
                          aria-label={`Скопировать логин ${access.login}`}
                        >
                          {copiedKey === `login-${access.id}` ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400 lg:hidden">Статус</p>
                      <AccessStatusBadge status={access.status} />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400 lg:hidden">Создан</p>
                      <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-600 lg:mt-0 dark:text-slate-300">
                        <CalendarDays className="size-3.5 text-slate-400" />
                        {formatDate(access.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400 lg:hidden">Последний вход</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600 lg:mt-0 dark:text-slate-300">
                        {formatDate(access.lastSeenAt ?? access.usedAt)}
                      </p>
                      {access.expiresAt !== null && access.status === "active" && (
                        <p className="mt-1 text-[10px] text-slate-400">до {formatDate(access.expiresAt)}</p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={access.status !== "active" || disablingId === access.id}
                            className="rounded-xl text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-400/[.08] dark:hover:text-red-200"
                          >
                            {disablingId === access.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <ShieldOff className="size-3.5" />}
                            {access.status === "disabled" ? "Отключён" : access.status === "expired" ? "Истёк" : "Отключить"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[24px] border-slate-200 bg-white dark:border-white/10 dark:bg-[#0d182b]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-black tracking-[-.025em]">
                              Отключить доступ?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="leading-relaxed">
                              Логин <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{access.login}</span> больше не позволит войти в практику. Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold">
                              Оставить активным
                            </AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDisable(access)}
                              className="rounded-xl font-bold"
                            >
                              Отключить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-5 flex items-start gap-2 px-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <Link2 className="mt-0.5 size-3.5 shrink-0" />
          Повторный вход выполняется на странице <Link href="/operator" className="font-bold text-[#008f78] hover:underline dark:text-[#59e8d0]">/operator</Link> по выданному логину.
        </div>
      </main>
    </div>
  );
}

export default OperatorAccessPanel;
