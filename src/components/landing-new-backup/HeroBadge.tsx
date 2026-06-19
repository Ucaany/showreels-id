"use client";

import { useEffect, useState } from "react";

const avatarColors = [
  { bg: "bg-brand-50", text: "text-brand-700" },
  { bg: "bg-brand-50", text: "text-brand-600" },
  { bg: "bg-brand-50", text: "text-brand-700" },
  { bg: "bg-brand-50", text: "text-brand-600" },
];

const baseCount = 12505;
const variance = 18;

export default function HeroBadge() {
  const [count, setCount] = useState(baseCount);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(baseCount + Math.floor(Math.random() * variance));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const display = count.toLocaleString("id-ID");

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
        <span className="text-ink/60">pengguna aktif</span>
      </span>
    </div>
  );
}