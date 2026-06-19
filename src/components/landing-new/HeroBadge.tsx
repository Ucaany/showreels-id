"use client";

import useSWR from "swr";
import { useLang } from "@/lib/i18n/landing-context";

type PlatformStats = { users: number; videos: number };

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? (r.json() as Promise<PlatformStats>) : null));

const avatarColors = [
  { bg: "bg-brand-50", text: "text-brand-700" },
  { bg: "bg-brand-50", text: "text-brand-600" },
  { bg: "bg-brand-50", text: "text-brand-700" },
  { bg: "bg-brand-50", text: "text-brand-600" },
];

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K+`;
  return `${value}+`;
}

export default function HeroBadge() {
  const { lang } = useLang();
  const { data } = useSWR<PlatformStats | null>(
    "/api/public/platform-stats",
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: false }
  );

  const userCount = data?.users ?? 0;
  const display = userCount > 0 ? formatCompact(userCount) : "—";
  const label = lang === "EN" ? "active users" : "pengguna aktif";

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-[color:var(--border)] bg-white px-3.5 py-1.5 shadow-[0_2px_12px_rgba(10,13,20,0.04)]">
      <div className="flex -space-x-1.5">
        {avatarColors.map((c, i) => (
          <div
            key={i}
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold ${c.bg} ${c.text}`}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-60 animate-pulse-soft" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-600" />
        </span>
        <span className="font-semibold tracking-tight text-ink">{display}</span>
        <span className="text-ink/60">{label}</span>
      </span>
    </div>
  );
}