"use client";

import { TrendingDown, TrendingUp, Link2, PlaySquare, Eye } from "lucide-react";
import { useLang } from "@/lib/i18n/landing-context";
import { beforeAfterEN } from "@/lib/constants/landing-en";

function ProfileCard({ variant }: { variant: "before" | "after" }) {
  const isBefore = variant === "before";

  return (
    <div
      className={`relative w-[210px] rounded-2xl border bg-white p-4 shadow-[0_8px_32px_rgba(10,13,20,0.10)] ${
        isBefore
          ? "rotate-[-6deg] border-gray-100"
          : "rotate-[5deg] border-gray-100"
      }`}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-2.5">
        <div
          className={`h-9 w-9 shrink-0 rounded-full ${
            isBefore
              ? "bg-gradient-to-br from-gray-200 to-gray-300"
              : "bg-gradient-to-br from-brand-400 to-brand-600"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div
            className={`h-2.5 rounded-full ${
              isBefore ? "w-16 bg-gray-200" : "w-24 bg-gray-800"
            }`}
          />
          <div className={`mt-1.5 h-2 w-14 rounded-full ${isBefore ? "bg-gray-100" : "bg-brand-100"}`} />
        </div>
      </div>

      {/* Link area */}
      <div
        className={`mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 ${
          isBefore
            ? "bg-gray-50 border border-dashed border-gray-200"
            : "bg-brand-50 border border-brand-100"
        }`}
      >
        <Link2
          className={`h-3.5 w-3.5 shrink-0 ${
            isBefore ? "text-gray-300" : "text-brand-500"
          }`}
          strokeWidth={2}
        />
        <div
          className={`h-2 rounded-full ${
            isBefore ? "w-20 bg-gray-200" : "w-28 bg-brand-300"
          }`}
        />
      </div>

      {/* Video grid */}
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`relative h-12 rounded-lg ${
              isBefore
                ? "bg-gray-100"
                : "bg-gradient-to-br from-brand-100 to-brand-200"
            }`}
          >
            {!isBefore && (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlaySquare className="h-4 w-4 text-brand-500 opacity-70" strokeWidth={1.5} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-3 flex justify-between">
        {["Views", "Clicks", "Links"].map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span
              className={`text-[10px] font-bold ${
                isBefore ? "text-gray-300" : "text-ink"
              }`}
            >
              {isBefore ? ["—", "—", "—"][i] : ["1.2K", "340", "5+"][i]}
            </span>
            <span className={`text-[9px] ${ isBefore ? "text-gray-300" : "text-ink/40" }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const beforeBadgesID = [
  {
    icon: <TrendingDown className="h-3 w-3 text-red-500" />,
    text: "Link bio lemah",
    color: "text-red-500",
    pos: "-top-5 -left-8",
  },
  {
    icon: <Eye className="h-3 w-3 text-red-400" />,
    text: "0 klik video",
    color: "text-red-400",
    pos: "-bottom-4 -right-6",
  },
  {
    icon: <Link2 className="h-3 w-3 text-red-400" />,
    text: "Portofolio tersebar",
    color: "text-red-400",
    pos: "top-1/2 -left-14",
  },
];

const afterBadgesID = [
  {
    icon: <TrendingUp className="h-3 w-3 text-emerald-500" />,
    text: "Views ↗ 1200+",
    color: "text-emerald-600",
    pos: "-top-5 -right-8",
  },
  {
    icon: <Eye className="h-3 w-3 text-emerald-500" />,
    text: "Klik ↗ 340%",
    color: "text-emerald-600",
    pos: "-bottom-4 -left-8",
  },
  {
    icon: <Link2 className="h-3 w-3 text-emerald-500" />,
    text: "1 link, semua video",
    color: "text-emerald-600",
    pos: "top-1/2 -right-14",
  },
];

function FloatingBadge({
  icon,
  text,
  color,
  pos,
}: {
  icon: React.ReactNode;
  text: string;
  color: string;
  pos: string;
}) {
  return (
    <div
      className={`absolute ${pos} flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/60 bg-white px-2.5 py-1 shadow-[0_4px_16px_rgba(10,13,20,0.10)]`}
    >
      {icon}
      <span className={`text-[10.5px] font-semibold ${color}`}>{text}</span>
    </div>
  );
}

export default function BeforeAfterSection() {
  const { lang } = useLang();
  const isEN = lang === "EN";

  const beforeBadges = isEN
    ? [
        { icon: <TrendingDown className="h-3 w-3 text-red-500" />, text: beforeAfterEN.before.badges[0].text, color: "text-red-500", pos: "-top-5 -left-8" },
        { icon: <Eye className="h-3 w-3 text-red-400" />, text: beforeAfterEN.before.badges[1].text, color: "text-red-400", pos: "-bottom-4 -right-6" },
        { icon: <Link2 className="h-3 w-3 text-red-400" />, text: beforeAfterEN.before.badges[2].text, color: "text-red-400", pos: "top-1/2 -left-14" },
      ]
    : beforeBadgesID;

  const afterBadges = isEN
    ? [
        { icon: <TrendingUp className="h-3 w-3 text-emerald-500" />, text: beforeAfterEN.after.badges[0].text, color: "text-emerald-600", pos: "-top-5 -right-8" },
        { icon: <Eye className="h-3 w-3 text-emerald-500" />, text: beforeAfterEN.after.badges[1].text, color: "text-emerald-600", pos: "-bottom-4 -left-8" },
        { icon: <Link2 className="h-3 w-3 text-emerald-500" />, text: beforeAfterEN.after.badges[2].text, color: "text-emerald-600", pos: "top-1/2 -right-14" },
      ]
    : afterBadgesID;

  return (
    <section className="relative overflow-hidden pb-16 pt-4">
      {/* Before / After visual */}
      <div className="relative mt-6 flex items-center justify-center gap-12 px-6 pb-0">
        {/* Before card */}
        <div className="relative flex flex-col items-center">
          <span className="mb-6 text-[11px] font-semibold uppercase tracking-widest text-ink/25">
            {isEN ? "Before" : "Before"}
          </span>
          <div className="relative">
            <ProfileCard variant="before" />
            {beforeBadges.map((b, i) => (
              <FloatingBadge key={i} {...b} />
            ))}
          </div>
        </div>

        {/* Curved arrow */}
        <div className="relative z-10 -mt-8 flex shrink-0 items-center justify-center">
          <svg
            width="72"
            height="48"
            viewBox="0 0 72 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-sky-400"
          >
            <path
              d="M4 40 C4 40 20 4 68 8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="5 4"
            />
            <path
              d="M62 4 L68 8 L62 14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* After card */}
        <div className="relative flex flex-col items-center">
          <span className="mb-6 text-[11px] font-semibold uppercase tracking-widest text-ink/60">
            {isEN ? "After" : "After"}
          </span>
          <div className="relative">
            <ProfileCard variant="after" />
            {afterBadges.map((b, i) => (
              <FloatingBadge key={i} {...b} />
            ))}
          </div>
        </div>
      </div>

      {/* Fade-out to white at bottom */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.85) 60%, white 100%)",
        }}
        aria-hidden
      />
    </section>
  );
}
