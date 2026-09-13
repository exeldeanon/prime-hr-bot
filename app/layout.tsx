import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UpHire — удалённая работа, которая вписывается в жизнь",
  description: "Удалённые вакансии UpHire: гибкий график, оплачиваемое обучение и помощь с оформлением.",
  icons: {
    icon: [{ url: "/uphire-logo.png", type: "image/png" }],
    shortcut: "/uphire-logo.png",
    apple: "/uphire-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
