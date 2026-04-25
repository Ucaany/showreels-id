"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";

function getGreetingByMinute(minuteOfDay: number, locale: Locale) {
  const isEnglish = locale === "en";

  if (minuteOfDay >= 240 && minuteOfDay <= 659) {
    return {
      text: isEnglish ? "Good morning" : "Selamat pagi",
      emoji: "\u2600\uFE0F",
    };
  }

  if (minuteOfDay >= 660 && minuteOfDay <= 899) {
    return {
      text: isEnglish ? "Good afternoon" : "Selamat siang",
      emoji: "\uD83C\uDF24\uFE0F",
    };
  }

  if (minuteOfDay >= 900 && minuteOfDay <= 1079) {
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
  const [minuteOfDay, setMinuteOfDay] = useState<number | null>(null);

  useEffect(() => {
    const syncMinuteOfDay = () => {
      const now = new Date();
      setMinuteOfDay(now.getHours() * 60 + now.getMinutes());
    };

    syncMinuteOfDay();
    const timer = window.setInterval(syncMinuteOfDay, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    if (minuteOfDay === null) {
      return {
        text: locale === "en" ? "Welcome" : "Selamat datang",
        emoji: "\u2728",
      };
    }

    return getGreetingByMinute(minuteOfDay, locale);
  }, [minuteOfDay, locale]);

  return (
    <Card className="dashboard-clean-card overflow-hidden border-[#ddd3cd] bg-[radial-gradient(circle_at_top_left,_rgba(239,79,63,0.18),_transparent_38%),radial-gradient(circle_at_84%_8%,rgba(37,99,235,0.13),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(247,243,239,0.96))] p-4 sm:p-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#655952]">{welcomeLabel}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold leading-tight text-[#1d1815] sm:text-3xl lg:text-4xl">
          {greeting.text}, {userName} <span aria-hidden="true">{greeting.emoji}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#564b45] sm:text-base">
          {locale === "en"
            ? "Track your Showreels performance and manage your profile, links, and portfolio from one clean workspace."
            : "Pantau performa halaman showreels kamu dan kelola semua konten dari satu tempat."}
        </p>
      </div>
    </Card>
  );
}
