"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AlertCircle, KeyRound, LoaderCircle, LogIn, ShieldCheck } from "lucide-react";

import { PracticeBrand } from "@/components/hr-prime/practice-brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiRecord = Record<string, unknown>;

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

function managerLoginError(response: Response, data: ApiRecord): string {
  const rawError =
    typeof data.error === "string"
      ? data.error
      : isRecord(data.error) && typeof data.error.code === "string"
        ? data.error.code
        : "";
  const code = rawError.toLowerCase();

  if (response.status === 401 || code.includes("password") || code.includes("unauthorized")) {
    return "Неверный пароль менеджера.";
  }

  if (response.status >= 500 || code.includes("config")) {
    return "Вход временно недоступен. Проверьте настройку админки или попробуйте позже.";
  }

  return "Не удалось войти. Попробуйте ещё раз.";
}

export function ManagerLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password || pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/manager/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await readJson(response);

      if (!response.ok || data.ok !== true) {
        setError(managerLoginError(response, data));
        return;
      }

      setPassword("");
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
        <div className="mb-6 px-1">
          <PracticeBrand />
        </div>

        <section className="overflow-hidden rounded-[30px] border border-white/90 bg-white/88 shadow-[0_30px_90px_rgba(15,23,42,.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d182b]/92 dark:shadow-[0_30px_90px_rgba(0,0,0,.28)]">
          <div className="border-b border-slate-200/70 px-6 py-7 dark:border-white/[.08] sm:px-8 sm:py-8">
            <div className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-[0_14px_34px_rgba(15,23,42,.22)] dark:bg-white dark:text-slate-950">
              <ShieldCheck className="size-5" />
            </div>
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#008f78] dark:text-[#59e8d0]">
              Защищённый раздел
            </p>
            <h1 className="mt-2 text-[30px] font-black leading-[1.05] tracking-[-.05em] sm:text-[34px]">
              Вход для менеджера
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Войдите, чтобы создавать и управлять доступами к практике оператора.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-8 sm:py-8">
            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="manager-password" className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                Пароль администратора
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="manager-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  disabled={pending}
                  aria-invalid={Boolean(error)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm shadow-none focus-visible:border-[#00a98e] focus-visible:ring-[#00c9a7]/20 dark:border-white/10 dark:bg-white/[.045]"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={pending || !password}
              className="group h-12 w-full rounded-2xl bg-slate-950 text-sm font-extrabold text-white shadow-[0_14px_32px_rgba(15,23,42,.18)] hover:bg-[#008f78] dark:bg-white dark:text-slate-950 dark:hover:bg-[#55ebd2]"
            >
              {pending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Входим…
                </>
              ) : (
                <>
                  Войти в админку
                  <LogIn className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default ManagerLogin;
