"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
  publicProfileHref,
}: {
  locale: Locale;
  welcomeLabel: string;
  userName: string;
  publicProfileHref: string;
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
    <Card className="dashboard-panel overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(47,115,255,0.2),_transparent_38%),radial-gradient(circle_at_84%_8%,rgba(148,189,255,0.2),_transparent_30%),linear-gradient(140deg,_rgba(255,255,255,0.98),_rgba(244,248,255,0.96))] p-4 sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-[#5e6f90]">{welcomeLabel}</p>
          <Link href={publicProfileHref} target="_blank">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-9 rounded-full border-[#d4e0f6] bg-white px-3 text-xs font-semibold text-[#2a4f88] sm:text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Buka publik link
            </Button>
          </Link>
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold leading-tight text-[#1d1815] sm:text-3xl lg:text-4xl">
          {greeting.text}, <span className="italic">{userName}</span>{" "}
          <span aria-hidden="true">{greeting.emoji}</span>
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
