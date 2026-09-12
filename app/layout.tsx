import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR Prime — удалённая работа, которая вписывается в жизнь",
  description: "Удалённые вакансии HR Prime: гибкий график, оплачиваемое обучение и помощь с оформлением.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
