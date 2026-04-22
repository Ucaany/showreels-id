"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";

function getGreetingByHour(hour: number, locale: Locale) {
  const isEnglish = locale === "en";

  if (hour < 11) {
    return {
      text: isEnglish ? "Good morning" : "Selamat pagi",
      emoji: "\u2600\uFE0F",
    };
  }

  if (hour < 16) {
    return {
      text: isEnglish ? "Good afternoon" : "Selamat siang",
      emoji: "\uD83C\uDF24\uFE0F",
    };
  }

  if (hour < 19) {
    return {
      text: isEnglish ? "Good evening" : "Selamat sore",
      emoji: "\uD83C\uDF07",
    };
  }

  return {
    text: isEnglish ? "Good night" : "Selamat malam",
    emoji: "\uD83C\uDF19",
  };
}

export function DashboardGreetingCard({
  locale,
  welcomeLabel,
  userName,
}: {
  locale: Locale;
  welcomeLabel: string;
  userName: string;
}) {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    const syncHour = () => {
      setHour(new Date().getHours());
    };

    syncHour();
    const timer = window.setInterval(syncHour, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    if (hour === null) {
      return {
        text: locale === "en" ? "Welcome" : "Selamat datang",
        emoji: "\u2728",
      };
    }

    return getGreetingByHour(hour, locale);
  }, [hour, locale]);

  return (
    <Card className="dashboard-clean-card overflow-hidden border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.13),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.96))] p-4 sm:p-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-600">{welcomeLabel}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl lg:text-4xl">
          {greeting.text}, {userName} <span aria-hidden="true">{greeting.emoji}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
          {locale === "en"
            ? "Manage your work, track video status, and keep your portfolio tidy from one focused workspace."
            : "Kelola karya, pantau status video, dan rapikan portofolio dari satu ruang kerja yang lebih fokus."}
        </p>
      </div>
    </Card>
  );
}
