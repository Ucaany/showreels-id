"use client";

import { useEffect, useRef, useState } from "react";
import { stats } from "@/lib/constants/landing";

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
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const { value: n, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center md:text-left">
      <div className="text-[40px] md:text-[48px] font-semibold leading-none tracking-[-0.04em] text-ink">
        {n.toLocaleString("id-ID")}
        <span className="text-brand-600">{suffix}</span>
      </div>
      <div className="mt-2 text-[12.5px] font-normal text-ink/55">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="relative py-12 md:py-14">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />
      <div className="container mx-auto max-w-[1080px] px-6">
        <div className="grid grid-cols-2 gap-6 rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-card md:grid-cols-4 md:gap-8 md:p-8">
          {stats.map((s, i) => (
            <StatItem key={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
