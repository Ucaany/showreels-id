"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useLang } from "@/lib/i18n/landing-context";
import { statsEN } from "@/lib/constants/landing-en";

type PlatformStats = { users: number; videos: number };

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? (r.json() as Promise<PlatformStats>) : null));

function formatCompact(value: number): { number: number; suffix: string } {
  if (value >= 1_000_000) return { number: value / 1_000_000, suffix: "M+" };
  if (value >= 1_000) return { number: value / 1_000, suffix: "K+" };
  return { number: value, suffix: "+" };
}

function useCountUp(target: number, durationMs = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [target, durationMs]);

  return { value, ref };
}

function StatItem({
  number,
  displaySuffix,
  label,
}: {
  number: number;
  displaySuffix: string;
  label: string;
}) {
  const { value, ref } = useCountUp(number);
  return (
    <div ref={ref} className="text-center md:text-left">
      <div className="text-[40px] md:text-[48px] font-semibold leading-none tracking-[-0.04em] text-ink">
        {value.toLocaleString("id-ID")}
        <span className="text-brand-600">{displaySuffix}</span>
      </div>
      <div className="mt-2 text-[12.5px] font-normal text-ink/55">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  const { lang } = useLang();
  const isEN = lang === "EN";
  const { data } = useSWR<PlatformStats | null>(
    "/api/public/platform-stats",
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: false }
  );

  const creatorsLabel = isEN ? "Registered creators" : "Kreator terdaftar";
  const videosLabel = isEN ? "Videos connected" : "Video terhubung";
  const uptimeLabel = isEN ? "Uptime guaranteed" : "Uptime terjamin";
  const ratingLabel = isEN ? "User rating" : "Rating pengguna";

  const userCount = data?.users ?? 0;
  const videoCount = data?.videos ?? 0;
  const usersFmt = formatCompact(userCount);
  const videosFmt = formatCompact(videoCount);

  const items = [
    {
      number: usersFmt.number,
      displaySuffix: usersFmt.suffix,
      label: creatorsLabel,
    },
    {
      number: videosFmt.number,
      displaySuffix: videosFmt.suffix,
      label: videosLabel,
    },
    {
      number: isEN ? statsEN[2].value : 98,
      displaySuffix: isEN ? statsEN[2].suffix : "%",
      label: uptimeLabel,
    },
    {
      number: isEN ? statsEN[3].value : 5,
      displaySuffix: isEN ? statsEN[3].suffix : "★",
      label: ratingLabel,
    },
  ];

  return (
    <section className="relative py-12 md:py-14">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />
      <div className="container mx-auto max-w-[1080px] px-6">
        <div className="grid grid-cols-2 gap-6 rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-card md:grid-cols-4 md:gap-8 md:p-8">
          {items.map((s, i) => (
            <StatItem key={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}