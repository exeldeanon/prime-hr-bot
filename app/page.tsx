"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileCheck2,
  Handshake,
  Headphones,
  HeartHandshake,
  Laptop2,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessagesSquare,
  Moon,
  Network,
  Phone,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  UsersRound,
  Wifi,
  X,
} from "lucide-react";

const navItems = [
  ["О компании", "#about"],
  ["Вакансии", "#vacancies"],
  ["Условия", "#benefits"],
  ["Офис", "#office"],
  ["Контакты", "#contacts"],
];

const vacancies = [
  {
    icon: MessagesSquare,
    number: "01",
    title: "Оператор чата",
    text: "Помогайте клиентам в онлайн-чате по готовой базе знаний.",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Страховой агент",
    subtitle: "ОСАГО, КАСКО, ипотека",
    text: "Подбирайте страховые продукты и сопровождайте клиентов.",
  },
  {
    icon: PhoneCall,
    number: "03",
    title: "Оператор колл-центра",
    text: "Общайтесь с клиентами по понятным сценариям и без холодных продаж.",
  },
  {
    icon: Network,
    number: "04",
    title: "Affiliate-менеджер",
    text: "Развивайте партнёрскую сеть и помогайте командам расти.",
  },
];

const benefits = [
  { icon: CircleDollarSign, title: "Стабильный доход", text: "Выплаты регулярно по договору ГПХ. Прозрачные условия без скрытых штрафов.", span: "lg:col-span-4" },
  { icon: Clock3, title: "Гибкий график", text: "Удалённая работа из любого города. Совмещайте с другими делами.", span: "lg:col-span-4" },
  { icon: BookOpenCheck, title: "Обучение за наш счёт", text: "Полная оплата обучения, доступ к материалам и наставнику.", span: "lg:col-span-4" },
  { icon: FileCheck2, title: "Оформление", text: "Помогаем с самозанятостью или ИП. Без серых схем.", span: "lg:col-span-3" },
  { icon: HeartHandshake, title: "Поддержка", text: "Менеджер на связи в Telegram. Помогаем с первыми шагами.", span: "lg:col-span-5" },
  { icon: Laptop2, title: "Техника", text: "Достаточно ПК или ноутбука и стабильного интернета.", span: "lg:col-span-4" },
];

const steps = [
  { icon: Send, title: "Отклик", text: "Нажмите «Откликнуться» и напишите нашему боту в Telegram — это займёт минуту." },
  { icon: Handshake, title: "Знакомство", text: "Менеджер свяжется с вами, расскажет условия и ответит на все вопросы." },
  { icon: BookOpenCheck, title: "Обучение", text: "Проходите обучение за наш счёт — с наставником и всеми материалами." },
  { icon: BriefcaseBusiness, title: "Старт", text: "Начинаете работать удалённо по гибкому графику и получать доход." },
];

function Brand() {
  return (
    <a href="#top" className="group flex items-center gap-2.5" aria-label="HR Prime — наверх">
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-[14px] bg-[#0f172a] shadow-[0_10px_30px_rgba(0,201,167,.28)] ring-1 ring-white/10">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,#00e7c2,transparent_42%)]" />
        <span className="relative text-[12px] font-extrabold tracking-[-.08em] text-white">HP</span>
      </span>
      <span className="text-[18px] font-extrabold tracking-[-.045em] text-slate-950 dark:text-white">
        HR <span className="text-[#00a98e] dark:text-[#36e3c6]">Prime</span>
      </span>
    </a>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("hr-prime-theme");
    const initial = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("hr-prime-theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="group grid size-10 place-items-center rounded-full border border-slate-200/80 bg-white/60 text-slate-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#00c9a7]/40 hover:text-[#00a98e] dark:border-white/10 dark:bg-white/[.06] dark:text-slate-200"
      aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
    >
      {dark ? <Sun className="size-[17px] transition-transform group-hover:rotate-12" /> : <Moon className="size-[17px] transition-transform group-hover:-rotate-12" />}
    </button>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  center = false,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  center?: boolean;
  inverse?: boolean;
}) {
  return (
    <div className={`mb-10 max-w-[790px] sm:mb-14 ${center ? "mx-auto text-center" : ""}`}>
      <div className={`mb-5 flex items-center gap-2 ${center ? "justify-center" : ""}`}>
        <span className="size-1.5 rounded-full bg-[#00c9a7] shadow-[0_0_14px_#00c9a7]" />
        <span className="text-[11px] font-extrabold uppercase tracking-[.19em] text-[#009d84] dark:text-[#52e8cf]">{eyebrow}</span>
      </div>
      <h2 className={`text-[clamp(2.35rem,5vw,5rem)] font-black leading-[.96] tracking-[-.065em] ${inverse ? "text-white" : "text-slate-950 dark:text-white"}`}>{title}</h2>
      <p className={`mt-5 max-w-[700px] text-[16px] leading-[1.72] ${inverse ? "text-slate-300" : "text-slate-600 dark:text-slate-300"} ${center ? "mx-auto" : ""}`}>{description}</p>
    </div>
  );
}

function WorkspaceCard() {
  return (
    <div id="practice" className="relative mx-auto w-full max-w-[590px] lg:ml-auto">
      <div className="absolute -inset-10 -z-10 rounded-full bg-[#00c9a7]/15 blur-3xl dark:bg-[#00c9a7]/10" />
      <Image
        src="/hr-prime-hero.png"
        alt="Объёмная сфера удалённой команды HR Prime"
        width={1448}
        height={1086}
        priority
        className="pointer-events-none absolute -right-[15%] -top-[27%] z-0 w-[82%] select-none opacity-60 drop-shadow-[0_28px_48px_rgba(0,180,216,.18)] sm:-right-[22%] sm:-top-[32%] dark:opacity-35"
      />
      <div className="relative z-10 overflow-hidden rounded-[30px] border border-white/80 bg-white/70 p-2.5 shadow-[0_35px_90px_rgba(15,23,42,.16),0_0_0_1px_rgba(255,255,255,.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1327]/75 dark:shadow-[0_35px_100px_rgba(0,0,0,.42),0_0_70px_rgba(0,201,167,.08)]">
        <div className="rounded-[23px] border border-slate-200/70 bg-[#f8fbfc]/85 p-4 sm:p-5 dark:border-white/[.07] dark:bg-[#0c1529]/90">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-white/[.07]">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-slate-950 text-[10px] font-black tracking-[-.08em] text-white shadow-[0_8px_22px_rgba(0,201,167,.22)] dark:bg-white dark:text-slate-950">HP</div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-400">HR-Prime</p>
                <p className="text-sm font-bold tracking-[-.02em] text-slate-900 dark:text-white">Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-300">
              <span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" /></span>
              Online
            </div>
          </div>

          <div className="mb-5 grid grid-cols-4 gap-1.5" aria-label="Этапы отбора">
            {["Отклик", "Знакомство", "Обучение", "Старт"].map((item, index) => (
              <div key={item} className="min-w-0">
                <div className={`mb-2 h-1 rounded-full ${index < 3 ? "bg-gradient-to-r from-[#00c9a7] to-[#00b4d8]" : "bg-slate-200 dark:bg-white/10"}`} />
                <p className={`truncate text-[9px] font-bold uppercase tracking-[.06em] ${index === 2 ? "text-[#009d84] dark:text-[#46e5ca]" : "text-slate-400"}`}>{item}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#00c9a7] to-[#00b4d8] text-white shadow-[0_8px_20px_rgba(0,201,167,.25)]"><Sparkles className="size-3.5" /></div>
              <div className="max-w-[82%] rounded-[5px_18px_18px_18px] border border-slate-200/70 bg-white px-3.5 py-3 text-[12px] leading-relaxed text-slate-600 shadow-sm dark:border-white/[.07] dark:bg-white/[.05] dark:text-slate-300">
                Отлично! Доступ к обучению открыт. Начнём с короткой практики?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-[18px_5px_18px_18px] bg-slate-950 px-3.5 py-3 text-[12px] leading-relaxed text-white shadow-[0_10px_25px_rgba(15,23,42,.16)] dark:bg-gradient-to-r dark:from-[#00a98e] dark:to-[#008fb1]">Да, готов начать 👋</div>
            </div>
          </div>

          <div className="mt-5 rounded-[19px] border border-slate-200/70 bg-white/85 p-4 shadow-[0_12px_30px_rgba(15,23,42,.06)] dark:border-white/[.07] dark:bg-white/[.045]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-400"><LockKeyhole className="size-3" /> Текущая вакансия</div>
              <span className="rounded-full bg-[#00c9a7]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#00957d] dark:text-[#4be4ca]">Удалённо</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-extrabold tracking-[-.025em] text-slate-950 dark:text-white">Специалист поддержки</h3>
                <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">от 55 000 ₽ / месяц</p>
              </div>
              <a href="#vacancies" aria-label="Перейти к вакансиям" className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white transition hover:scale-105 hover:bg-[#00a98e] dark:bg-white dark:text-slate-950"><ArrowUpRight className="size-4" /></a>
            </div>
          </div>
        </div>
      </div>
      <div className="float-slow absolute -bottom-5 -left-3 z-20 hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-3 py-2.5 shadow-[0_14px_40px_rgba(15,23,42,.13)] backdrop-blur-xl sm:flex dark:border-white/10 dark:bg-[#111b30]/80">
        <span className="grid size-8 place-items-center rounded-xl bg-[#00c9a7]/12 text-[#009b82]"><Check className="size-4" /></span>
        <div><p className="text-[10px] font-bold text-slate-950 dark:text-white">Обучение оплачено</p><p className="text-[9px] text-slate-400">Можно начинать</p></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main id="top" className="min-h-screen overflow-x-clip bg-[var(--background)] text-[var(--foreground)]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 bg-white/65 backdrop-blur-2xl dark:border-white/[.07] dark:bg-[#07101f]/65">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between gap-5 px-5 sm:px-8 xl:px-12">
          <Brand />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
            {navItems.map(([label, href]) => <a key={label} href={href} className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-950/[.04] hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[.06] dark:hover:text-white">{label}</a>)}
          </nav>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <a href="#practice" className="hidden rounded-full border border-slate-200/80 bg-white/50 px-4 py-2.5 text-[12px] font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-[#00c9a7]/40 dark:border-white/10 dark:bg-white/[.05] dark:text-white sm:block">Войти в практику</a>
            <a href="https://t.me/HRinformHR_bot" target="_blank" rel="noreferrer" className="group hidden items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_10px_30px_rgba(0,201,167,.2)] transition hover:-translate-y-0.5 hover:bg-[#009f86] hover:shadow-[0_12px_38px_rgba(0,201,167,.32)] dark:bg-white dark:text-slate-950 dark:hover:bg-[#55ebd2] sm:inline-flex">
              <span className="hidden md:inline">Откликнуться</span><span className="md:hidden">Отклик</span><ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="grid size-10 place-items-center rounded-full border border-slate-200/80 bg-white/60 text-slate-800 lg:hidden dark:border-white/10 dark:bg-white/[.06] dark:text-white" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen}>
              {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="absolute inset-x-4 top-[78px] rounded-[24px] border border-white/80 bg-white/90 p-3 shadow-[0_24px_70px_rgba(15,23,42,.16)] backdrop-blur-2xl lg:hidden dark:border-white/10 dark:bg-[#0d182b]/95" aria-label="Мобильная навигация">
            {navItems.map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/[.06]">{label}<ChevronRight className="size-4 text-slate-400" /></a>)}
            <a href="https://t.me/HRinformHR_bot" target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00b998] to-[#00a7cd] px-4 py-3.5 text-sm font-extrabold text-white"><Send className="size-4" /> Откликнуться</a>
          </nav>
        )}
      </header>

      <section className="hero-grid relative isolate overflow-hidden pb-12 pt-[120px] sm:pb-16 sm:pt-[145px] lg:min-h-[900px] lg:pb-24 lg:pt-[175px]">
        <div className="orb orb-one" /><div className="orb orb-two" />
        <div className="mx-auto grid max-w-[1480px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 xl:px-12">
          <div className="relative z-10 max-w-[760px]">
            <div className="mb-7 inline-flex max-w-full items-center gap-2 rounded-full border border-[#00c9a7]/20 bg-white/65 px-3 py-2 text-[10px] font-bold uppercase tracking-[.105em] text-slate-700 shadow-[0_8px_30px_rgba(0,201,167,.08)] backdrop-blur-xl sm:px-4 sm:text-[11px] dark:border-[#53e8cf]/15 dark:bg-white/[.055] dark:text-slate-200">
              <Sparkles className="size-3.5 shrink-0 text-[#00a98e]" /><span className="truncate">Удалённая работа · гибкий график · обучение</span>
            </div>
            <h1 className="text-[clamp(2.1rem,11.1vw,3.25rem)] font-black uppercase leading-[.86] tracking-[-.075em] text-slate-950 sm:text-[clamp(3.25rem,7vw,7.6rem)] sm:leading-[.84] dark:text-white">
              Работа, которая <span className="gradient-text block text-[.84em] sm:text-[1em]">вписывается</span> в жизнь
            </h1>
            <p className="mt-7 max-w-[680px] text-[16px] leading-[1.72] text-slate-600 sm:text-[17px] dark:text-slate-300">
              HR Prime набирает команду для удалённой работы: поддержка онлайн-чата и телекома, страховые агенты и affiliate-менеджеры. Гибкий график, оплачиваемое обучение и помощь с оформлением.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a href="#practice" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00b998] to-[#00a7cd] px-6 py-3 text-[13px] font-extrabold text-white shadow-[0_14px_38px_rgba(0,201,167,.28)] transition hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(0,201,167,.38)]">Войти в практику <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></a>
              <a href="https://t.me/HRinformHR_bot" target="_blank" rel="noreferrer" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-6 py-3 text-[13px] font-extrabold text-slate-900 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#00b4d8]/35 hover:shadow-[0_14px_34px_rgba(0,180,216,.12)] dark:border-white/10 dark:bg-white/[.055] dark:text-white"><Send className="size-4 fill-[#24a1de] text-[#24a1de]" />Откликнуться в Telegram</a>
              <a href="#vacancies" className="group inline-flex min-h-12 items-center justify-center gap-2 px-3 text-[12px] font-bold text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"><ArrowDown className="size-4 transition-transform group-hover:translate-y-1" />Смотреть вакансии</a>
            </div>
            <p className="mt-5 flex max-w-[650px] items-start gap-2 text-[11px] leading-relaxed text-slate-400 sm:text-[12px]"><LockKeyhole className="mt-0.5 size-3.5 shrink-0" />Уже получили доступ к тренажёру? Входите по логину и паролю, который установили при активации.</p>
          </div>
          <WorkspaceCard />
        </div>

        <div className="relative z-10 mx-auto mt-16 max-w-[1480px] px-5 sm:px-8 lg:mt-20 xl:px-12">
          <div className="grid overflow-hidden rounded-[26px] border border-white/70 bg-white/55 shadow-[0_24px_80px_rgba(15,23,42,.09)] backdrop-blur-2xl dark:border-white/[.08] dark:bg-white/[.035] sm:grid-cols-2 lg:grid-cols-4">
            {[["4", "открытых вакансии"], ["от 55к ₽", "доход в месяц"], ["гибко", "график работы"], ["100%", "оплата обучения"]].map(([value, label], index) => (
              <div key={label} className={`relative px-6 py-5 sm:px-8 sm:py-6 ${index ? "border-t border-slate-200/60 sm:[&:nth-child(2)]:border-t-0 lg:border-l lg:border-t-0 dark:border-white/[.07]" : ""}`}>
                <div className="mb-2 flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#00c9a7] shadow-[0_0_10px_#00c9a7]" /><span className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">HR Prime</span></div>
                <p className="text-[clamp(1.6rem,3vw,2.35rem)] font-black tracking-[-.055em] text-slate-950 dark:text-white">{value}</p>
                <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <ChevronRight className="absolute right-5 top-1/2 size-4 -translate-y-1/2 text-slate-300 dark:text-white/15" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section-shell relative bg-white dark:bg-[#081220]">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 xl:px-12">
          <SectionHeader
            eyebrow="О компании"
            title="Удалённая работа без лишней бюрократии"
            description="HR Prime собирает команду для удалённой работы с поддержкой онлайн-чата, телеком-услуг, страховых и партнёрских продуктов. Мы ценим самостоятельность, честность и желание учиться."
          />
          <div className="grid gap-5 lg:grid-cols-12">
            <article className="glass-card card-glow group relative min-h-[420px] overflow-hidden p-6 sm:p-9 lg:col-span-7">
              <div className="relative z-10 max-w-[390px]">
                <div className="icon-tile"><UsersRound className="size-5" /></div>
                <p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-[#009f86] dark:text-[#52e8cf]">Команда</p>
                <h3 className="mt-2 text-[clamp(1.8rem,4vw,3.4rem)] font-black leading-[.98] tracking-[-.055em] text-slate-950 dark:text-white">Одна волна.<br />Разные города.</h3>
                <p className="mt-5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">Работаем из разных часовых поясов, но всегда остаёмся рядом — в понятных процессах и живой коммуникации.</p>
              </div>
              <div className="team-orbit absolute -bottom-20 -right-16 size-[380px] rounded-full border border-[#00c9a7]/20 sm:-bottom-10 sm:right-0">
                <div className="absolute inset-[18%] rounded-full border border-[#00b4d8]/20" />
                <div className="absolute inset-[37%] rounded-full bg-gradient-to-br from-[#00c9a7] to-[#00b4d8] shadow-[0_0_80px_rgba(0,201,167,.28)]" />
                {[
                  ["АМ", "left-[4%] top-[45%] bg-[#0f172a]"],
                  ["ЕК", "right-[8%] top-[18%] bg-[#00a98e]"],
                  ["ИВ", "right-[2%] bottom-[18%] bg-[#008fb1]"],
                  ["НС", "left-[34%] top-[2%] bg-white text-slate-900"],
                ].map(([initials, style]) => <span key={initials} className={`absolute grid size-12 place-items-center rounded-2xl border border-white/30 text-[11px] font-black text-white shadow-[0_12px_30px_rgba(15,23,42,.18)] transition duration-500 group-hover:-translate-y-2 ${style}`}>{initials}</span>)}
              </div>
            </article>

            <div className="grid gap-5 lg:col-span-5">
              <article className="glass-card group relative min-h-[198px] overflow-hidden p-6 sm:p-8">
                <div className="absolute right-6 top-6 grid size-20 place-items-center rounded-[26px] bg-gradient-to-br from-[#00c9a7]/20 to-[#00b4d8]/10 text-[#00a98e] shadow-[inset_0_0_0_1px_rgba(0,201,167,.15),0_18px_50px_rgba(0,201,167,.12)] transition duration-500 group-hover:rotate-6 group-hover:scale-105 dark:text-[#55e8cf]"><HeartHandshake className="size-8" /></div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#009f86] dark:text-[#52e8cf]">Поддержка</p>
                <h3 className="mt-3 max-w-[260px] text-[24px] font-black tracking-[-.04em] text-slate-950 dark:text-white">Не оставляем один на один</h3>
                <p className="mt-4 max-w-[350px] pr-12 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">Помогаем с оформлением, обучением и первыми шагами. Менеджер на связи в Telegram.</p>
              </article>
              <article className="glass-card group relative min-h-[198px] overflow-hidden p-6 sm:p-8">
                <div className="absolute -bottom-8 -right-5 flex h-36 w-52 items-end gap-2 opacity-80">
                  {[32, 47, 63, 84].map((height, index) => <span key={height} className="w-8 rounded-t-xl bg-gradient-to-t from-[#00b4d8]/15 to-[#00c9a7]/70 transition-all duration-500 group-hover:-translate-y-2" style={{ height: `${height}%`, transitionDelay: `${index * 45}ms` }} />)}
                </div>
                <div className="icon-tile"><TrendingUp className="size-5" /></div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[.18em] text-[#009f86] dark:text-[#52e8cf]">Развитие</p>
                <h3 className="mt-2 max-w-[290px] text-[24px] font-black tracking-[-.04em] text-slate-950 dark:text-white">Доход растёт вместе с навыками</h3>
                <p className="mt-3 max-w-[340px] pr-16 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">Платим за обучение, даём материалы и постепенно повышаем доход.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="vacancies" className="section-shell soft-grid relative overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 xl:px-12">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeader
              eyebrow="Вакансии"
              title="Открытые направления"
              description="Все вакансии — удалённо, по договору ГПХ с самозанятыми. Обучение оплачивается."
            />
            <div className="mb-10 hidden items-center gap-2 rounded-full border border-[#00c9a7]/20 bg-[#00c9a7]/[.07] px-4 py-2 text-[11px] font-bold text-[#008e77] dark:text-[#5ae9d1] sm:flex lg:mb-14">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#00c9a7] opacity-60" /><span className="relative size-2 rounded-full bg-[#00c9a7]" /></span>
              Набор открыт
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {vacancies.map((vacancy) => {
              const Icon = vacancy.icon;
              return (
                <article key={vacancy.title} className="vacancy-card group relative min-h-[330px] overflow-hidden rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-[0_20px_55px_rgba(15,23,42,.07)] backdrop-blur-xl transition duration-500 hover:-translate-y-2 hover:border-[#00c9a7]/30 hover:shadow-[0_28px_75px_rgba(0,201,167,.13)] sm:p-8 dark:border-white/[.08] dark:bg-white/[.035]">
                  <div className="absolute right-7 top-5 text-[54px] font-black tracking-[-.08em] text-slate-950/[.035] dark:text-white/[.045]">{vacancy.number}</div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="icon-tile transition duration-500 group-hover:rotate-6 group-hover:scale-110"><Icon className="size-5" /></div>
                    <div className="flex flex-wrap justify-end gap-2 pr-10">
                      <span className="status-pill"><span className="size-1.5 rounded-full bg-[#00c9a7] shadow-[0_0_9px_#00c9a7]" /> открыта</span>
                      <span className="status-pill"><Wifi className="size-3" /> удалённо</span>
                    </div>
                  </div>
                  <h3 className="mt-9 max-w-[460px] text-[clamp(1.55rem,3vw,2.35rem)] font-black leading-[1.03] tracking-[-.05em] text-slate-950 dark:text-white">{vacancy.title}</h3>
                  {vacancy.subtitle && <p className="mt-2 text-[12px] font-bold uppercase tracking-[.09em] text-[#00a58b] dark:text-[#50e4cb]">{vacancy.subtitle}</p>}
                  <p className="mt-4 max-w-[490px] text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{vacancy.text}</p>
                  <button type="button" disabled className="mt-7 flex w-full cursor-not-allowed items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-100/70 px-4 py-3.5 text-left text-[12px] font-bold text-slate-400 dark:border-white/[.07] dark:bg-white/[.035] dark:text-slate-500">
                    Отклик временно недоступен <LockKeyhole className="size-3.5" />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="benefits" className="section-shell bg-white dark:bg-[#081220]">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 xl:px-12">
          <SectionHeader
            eyebrow="Условия"
            title="Что мы предлагаем"
            description="Прозрачные условия, человеческое отношение и помощь на каждом этапе."
            center
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <article key={benefit.title} className={`benefit-card group relative min-h-[245px] overflow-hidden rounded-[26px] border border-slate-200/70 bg-[#f8fbfb] p-6 transition duration-500 hover:-translate-y-1.5 hover:border-[#00c9a7]/30 hover:bg-white hover:shadow-[0_24px_60px_rgba(0,201,167,.1)] sm:p-7 dark:border-white/[.07] dark:bg-white/[.035] dark:hover:bg-white/[.055] ${benefit.span}`}>
                  <span className="absolute -right-3 -top-6 text-[86px] font-black tracking-[-.08em] text-slate-950/[.025] dark:text-white/[.025]">0{index + 1}</span>
                  <div className="icon-tile transition duration-500 group-hover:-translate-y-1 group-hover:rotate-3"><Icon className="size-5" /></div>
                  <h3 className="mt-7 text-[21px] font-black tracking-[-.035em] text-slate-950 dark:text-white">{benefit.title}</h3>
                  <p className="mt-3 max-w-[420px] text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{benefit.text}</p>
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[#00c9a7] to-[#00b4d8] transition-all duration-500 group-hover:w-full" />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="process" className="section-shell relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(0,201,167,.16),transparent_28%),radial-gradient(circle_at_90%_60%,rgba(0,180,216,.12),transparent_27%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:58px_58px]" />
        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 xl:px-12">
          <SectionHeader
            eyebrow="Как это работает"
            title="Путь от отклика до старта"
            description="Четыре простых шага — без многоэтапных собеседований и долгих ожиданий."
            inverse
          />
          <ol className="timeline-track relative grid gap-4 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="group relative rounded-[26px] border border-white/10 bg-white/[.055] p-6 backdrop-blur-lg transition duration-500 hover:-translate-y-2 hover:border-[#00c9a7]/30 hover:bg-white/[.08] sm:p-7">
                  <div className="mb-12 flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#00c9a7] to-[#00a4cc] text-white shadow-[0_12px_34px_rgba(0,201,167,.24)]"><Icon className="size-5" /></span>
                    <span className="font-mono text-[11px] font-bold tracking-[.16em] text-white/30">0{index + 1} / 04</span>
                  </div>
                  <h3 className="text-[25px] font-black tracking-[-.04em]">{step.title}</h3>
                  <p className="mt-4 text-[14px] leading-[1.7] text-slate-300">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="office" className="section-shell soft-grid overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 xl:px-12">
          <SectionHeader
            eyebrow="Наш офис"
            title="Найдите нас на карте"
            description="Работа удалённая, но мы всегда на связи. При необходимости можно подъехать в офис — отметка ниже."
          />
          <div className="grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
            <div className="map-frame relative min-h-[520px] overflow-hidden rounded-[30px] border border-white/80 bg-slate-200 shadow-[0_24px_70px_rgba(15,23,42,.12)] dark:border-white/[.08] dark:bg-slate-900">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=37.615%2C55.689%2C37.636%2C55.701&layer=mapnik&marker=55.695296%2C37.625325"
                title="Офис HR Prime на интерактивной карте"
                loading="lazy"
                className="absolute inset-0 size-full border-0"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="pointer-events-none absolute left-5 top-5 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#0d182b]/85">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-950 dark:text-white"><MapPin className="size-4 text-[#00ad91]" /> Новоданиловская наб., 12</div>
                <p className="mt-1 pl-6 text-[10px] text-slate-500 dark:text-slate-400">Москва · 13 этаж</p>
              </div>
            </div>
            <article className="glass-card relative flex min-h-[520px] flex-col overflow-hidden p-6 sm:p-8">
              <div className="relative z-10">
                <div className="icon-tile"><Building2 className="size-5" /></div>
                <div className="mt-7 space-y-6">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">Адрес офиса</p>
                    <p className="mt-2 max-w-[380px] text-[17px] font-bold leading-[1.5] tracking-[-.02em] text-slate-950 dark:text-white">Новоданиловская набережная 12, 13 этаж, Донской, Москва, 117105</p>
                  </div>
                  <div className="flex items-start gap-3 border-t border-slate-200/70 pt-5 dark:border-white/[.08]">
                    <CalendarDays className="mt-0.5 size-4 text-[#00a98e]" />
                    <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">Часы работы</p><p className="mt-1 text-[14px] font-bold text-slate-800 dark:text-slate-200">Пн–Пт, 10:00–19:00</p></div>
                  </div>
                </div>
                <a href="https://yandex.ru/maps/?text=%D0%9D%D0%BE%D0%B2%D0%BE%D0%B4%D0%B0%D0%BD%D0%B8%D0%BB%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F%20%D0%BD%D0%B0%D0%B1%D0%B5%D1%80%D0%B5%D0%B6%D0%BD%D0%B0%D1%8F%2012%2C%20%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0" target="_blank" rel="noreferrer" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-[12px] font-extrabold text-white transition hover:-translate-y-1 hover:bg-[#00a98e] dark:bg-white dark:text-slate-950 dark:hover:bg-[#55e8cf]">Открыть в Яндекс.Картах <ExternalLink className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a>
              </div>
              <Image src="/hr-prime-office.png" alt="3D-миниатюра офиса HR Prime у набережной" width={1448} height={1086} className="pointer-events-none -mb-10 mt-auto w-full translate-y-8 select-none drop-shadow-[0_20px_35px_rgba(15,23,42,.22)] transition duration-700 hover:scale-105" />
            </article>
          </div>
        </div>
      </section>

      <section id="contacts" className="section-shell bg-white dark:bg-[#081220]">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 xl:px-12">
          <SectionHeader
            eyebrow="Контакты"
            title="Свяжитесь с нами"
            description="Быстрее всего — в Telegram. Откликнуться можно в один клик."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            <a href="https://t.me/HRinformHR_bot" target="_blank" rel="noreferrer" className="telegram-card group relative min-h-[300px] overflow-hidden rounded-[30px] bg-slate-950 p-7 text-white shadow-[0_30px_75px_rgba(0,180,216,.19)] transition duration-500 hover:-translate-y-2 sm:p-9">
              <div className="absolute -right-16 -top-20 size-72 rounded-full bg-[#00c9a7]/25 blur-3xl transition duration-700 group-hover:scale-125" />
              <div className="relative">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#24a1de] shadow-[0_12px_35px_rgba(36,161,222,.35)]"><Send className="size-5 fill-white" /></div>
                <p className="mt-9 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#5fead2]">Telegram-бот</p>
                <h3 className="mt-3 max-w-[390px] text-[28px] font-black leading-[1.08] tracking-[-.045em]">Откликнуться и пройти отбор в одном чате</h3>
                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-[14px] font-extrabold"><span>@HRinformHR_bot</span><ArrowUpRight className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div>
              </div>
            </a>
            <article className="glass-card group relative min-h-[300px] overflow-hidden p-7 sm:p-9">
              <div className="icon-tile"><Phone className="size-5" /></div>
              <p className="mt-9 text-[10px] font-extrabold uppercase tracking-[.2em] text-slate-400">Телефоны</p>
              <h3 className="mt-3 text-[25px] font-black tracking-[-.04em] text-slate-950 dark:text-white">Скоро на связи</h3>
              <p className="mt-4 max-w-[320px] text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">Телефоны будут добавлены позже.</p>
              <Phone className="absolute -bottom-8 -right-5 size-36 text-slate-950/[.025] transition duration-500 group-hover:-translate-y-2 dark:text-white/[.035]" />
            </article>
            <article className="glass-card group relative min-h-[300px] overflow-hidden p-7 sm:p-9">
              <div className="icon-tile"><Mail className="size-5" /></div>
              <p className="mt-9 text-[10px] font-extrabold uppercase tracking-[.2em] text-slate-400">Email</p>
              <h3 className="mt-3 text-[25px] font-black tracking-[-.04em] text-slate-950 dark:text-white">Готовим почту</h3>
              <p className="mt-4 max-w-[320px] text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">Email будет добавлен позже.</p>
              <Mail className="absolute -bottom-8 -right-5 size-36 text-slate-950/[.025] transition duration-500 group-hover:-translate-y-2 dark:text-white/[.035]" />
            </article>
          </div>
        </div>
      </section>

      <footer className="relative overflow-hidden bg-[#06101e] pb-8 pt-16 text-white sm:pt-20">
        <div className="absolute -right-40 -top-40 size-[520px] rounded-full bg-[#00c9a7]/10 blur-3xl" />
        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 xl:px-12">
          <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.4fr_.6fr_.6fr]">
            <div>
              <Brand />
              <p className="mt-6 max-w-[490px] text-[15px] leading-[1.75] text-slate-400">HR Prime — удалённая работа по договору ГПХ с самозанятыми. Открытый набор на 4 направления.</p>
              <a href="https://t.me/HRinformHR_bot" target="_blank" rel="noreferrer" className="group mt-7 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#00b998] to-[#00a7cd] px-6 py-3.5 text-[13px] font-extrabold shadow-[0_16px_42px_rgba(0,201,167,.22)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,201,167,.34)]"><Send className="size-4 fill-white" />Написать в Telegram-бот <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></a>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#53e7cf]">Вакансии</p>
              <div className="mt-5 flex flex-col gap-3.5">
                {vacancies.map((vacancy) => <a key={vacancy.title} href="#vacancies" className="text-[13px] font-semibold text-slate-400 transition hover:text-white">{vacancy.title}</a>)}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#53e7cf]">Контакты</p>
              <div className="mt-5 flex flex-col gap-3.5">
                <a href="https://t.me/HRinformHR_bot" target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-slate-400 transition hover:text-white">Telegram-бот</a>
                <a href="#office" className="text-[13px] font-semibold text-slate-400 transition hover:text-white">Офис в Москве</a>
                <a href="#contacts" className="text-[13px] font-semibold text-slate-400 transition hover:text-white">Связаться с нами</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-7 text-[11px] font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 HR Prime. Все права защищены.</p>
            <a href="#practice" className="transition hover:text-white">Вход для менеджера</a>
          </div>
        </div>
      </footer>

      <a href="#top" aria-label="Наверх" className="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full border border-white/70 bg-white/80 text-slate-950 shadow-[0_12px_40px_rgba(15,23,42,.16)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-[#00c9a7] hover:text-white dark:border-white/10 dark:bg-[#111c30]/80 dark:text-white dark:hover:bg-[#00a98e]"><ArrowUp className="size-4" /></a>
    </main>
  );
}
