"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import { PracticeBrand } from "@/components/uphire/practice-brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type OperatorLoginProps = {
  inviteToken?: string;
  inviteState?: string | null;
  sessionState?: string | null;
};

type ApiRecord = Record<string, unknown>;

const LOGIN_ERRORS: Record<string, string> = {
  access_disabled: "Этот доступ отключён. Обратитесь к менеджеру за новым доступом.",
  access_expired: "Срок действия доступа истёк. Попросите менеджера выдать новый.",
  disabled: "Этот доступ отключён. Обратитесь к менеджеру за новым доступом.",
  expired: "Срок действия доступа истёк. Попросите менеджера выдать новый.",
  invalid_credentials: "Логин не найден. Проверьте написание и попробуйте снова.",
  invalid_invite: "Пригласительная ссылка недействительна. Проверьте адрес или запросите новую.",
  invalid_login: "Логин не найден. Проверьте написание и попробуйте снова.",
  invalid_token: "Пригласительная ссылка недействительна. Проверьте адрес или запросите новую.",
  invite_invalid: "Пригласительная ссылка недействительна. Проверьте адрес или запросите новую.",
  login_mismatch: "Этот логин не подходит к пригласительной ссылке.",
  not_found: "Логин не найден. Проверьте написание и попробуйте снова.",
};

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

function normalizeCode(value: unknown): string {
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  if (isRecord(value) && typeof value.code === "string") {
    return value.code.trim().toLowerCase();
  }

  return "";
}

function inviteError(state?: string | null): string | null {
  const normalized = state?.trim().toLowerCase();

  if (!normalized || normalized === "valid" || normalized === "active") {
    return null;
  }

  if (normalized.includes("expir")) {
    return LOGIN_ERRORS.access_expired;
  }

  if (normalized.includes("disable")) {
    return LOGIN_ERRORS.access_disabled;
  }

  return LOGIN_ERRORS.invalid_invite;
}

function sessionError(state?: string | null): string | null {
  const normalized = state?.trim().toLowerCase();

  if (!normalized) return null;
  if (normalized.includes("disable")) return LOGIN_ERRORS.access_disabled;
  if (normalized.includes("expir")) return LOGIN_ERRORS.access_expired;

  return "Сессия практики завершена. Введите действующий логин, чтобы войти снова.";
}

function responseError(response: Response, data: ApiRecord): string {
  const code = normalizeCode(data.error) || normalizeCode(data.code);

  if (code && LOGIN_ERRORS[code]) {
    return LOGIN_ERRORS[code];
  }

  if (response.status === 401) {
    return LOGIN_ERRORS.invalid_login;
  }

  if (response.status === 403) {
    return LOGIN_ERRORS.access_disabled;
  }

  if (response.status === 410) {
    return LOGIN_ERRORS.access_expired;
  }

  if (response.status >= 500) {
    return "Сервис входа временно недоступен. Попробуйте ещё раз чуть позже.";
  }

  return "Не удалось войти. Проверьте логин и попробуйте снова.";
}

export function OperatorLogin({
  inviteToken,
  inviteState,
  sessionState,
}: OperatorLoginProps) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isInvite = Boolean(inviteToken);
  const invalidInviteMessage = isInvite ? inviteError(inviteState) : null;
  const sessionMessage = !isInvite ? sessionError(sessionState) : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedLogin = login.trim();
    if (!normalizedLogin || pending || invalidInviteMessage) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/operator/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: normalizedLogin,
          ...(inviteToken ? { token: inviteToken } : {}),
        }),
      });
      const data = await readJson(response);

      if (!response.ok || data.ok !== true) {
        setError(responseError(response, data));
        return;
      }

      router.replace("/operator/practice");
      router.refresh();
    } catch {
      setError("Не удалось связаться с сервисом. Проверьте интернет и попробуйте снова.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[#f5fbfa] px-4 py-10 text-slate-950 dark:bg-[#07101f] dark:text-white sm:px-6">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(rgba(15,23,42,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.025)_1px,transparent_1px)] bg-[size:54px_54px] dark:bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)]" />
      <div className="absolute -left-40 top-[-10rem] -z-10 size-[32rem] rounded-full bg-[#00b4d8]/10 blur-3xl" />
      <div className="absolute -right-40 bottom-[-12rem] -z-10 size-[36rem] rounded-full bg-[#00c9a7]/15 blur-3xl dark:bg-[#00c9a7]/10" />

      <main className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between px-1">
          <PracticeBrand />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-white/70 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a98e]/50 dark:text-slate-400 dark:hover:bg-white/[.06] dark:hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            На сайт
          </Link>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-white/90 bg-white/88 shadow-[0_30px_90px_rgba(15,23,42,.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d182b]/92 dark:shadow-[0_30px_90px_rgba(0,0,0,.28)]">
          <div className="border-b border-slate-200/70 px-6 py-7 dark:border-white/[.08] sm:px-8 sm:py-8">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#00b998] to-[#00a7cd] text-white shadow-[0_14px_34px_rgba(0,185,152,.25)]">
              <LockKeyhole className="size-5" />
            </div>
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#008f78] dark:text-[#59e8d0]">
              {isInvite ? "Вход по приглашению" : "Операторская практика"}
            </p>
            <h1 className="mt-2 text-[30px] font-black leading-[1.05] tracking-[-.05em] sm:text-[34px]">
              Практика оператора UpHire
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Введите логин, который вы получили от менеджера. Пароль для входа не нужен.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-8 sm:py-8">
            {isInvite && !invalidInviteMessage && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-400/15 dark:bg-emerald-400/[.08] dark:text-emerald-200">
                <CheckCircle2 className="size-4 shrink-0" />
                Пригласительная ссылка принята
              </div>
            )}

            {invalidInviteMessage && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle />
                <AlertDescription>{invalidInviteMessage}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {sessionMessage && !error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle />
                <AlertDescription>{sessionMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="operator-login" className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                Логин доступа
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="operator-login"
                  name="login"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  placeholder="Например, HRP-4KM8X-2D7QF-9W3NC"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={pending || Boolean(invalidInviteMessage)}
                  aria-invalid={Boolean(error)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 pr-4 font-mono text-sm shadow-none focus-visible:border-[#00a98e] focus-visible:ring-[#00c9a7]/20 dark:border-white/10 dark:bg-white/[.045]"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={pending || !login.trim() || Boolean(invalidInviteMessage)}
              className="group h-12 w-full rounded-2xl bg-gradient-to-r from-[#00b998] to-[#00a7cd] text-sm font-extrabold text-white shadow-[0_14px_32px_rgba(0,185,152,.22)] hover:opacity-95"
            >
              {pending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Проверяем доступ…
                </>
              ) : (
                <>
                  Войти в практику
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>

            <p className="text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Нет логина или доступ не работает? Обратитесь к менеджеру, который выдал приглашение.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

export default OperatorLogin;
