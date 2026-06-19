"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { faqs } from "@/lib/constants/landing";

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-12 md:py-14">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />

      <div className="container mx-auto max-w-[760px] px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-3 text-ink/35">
            <span className="h-px w-10 bg-current" />
            <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              FAQ
            </span>
            <span className="h-px w-10 bg-current" />
          </div>
          <h2 className="text-section-display font-semibold text-ink">
            Pertanyaan yang{" "}
            <span className="font-accent text-accent">sering</span> ditanyakan.
          </h2>
        </div>

        <div className="space-y-2.5">
          {faqs.map((f, i) => {
            const open = openIdx === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  open
                    ? "border-brand-200 bg-white shadow-card"
                    : "border-[color:var(--border)] bg-white/60 hover:border-brand-200"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span
                    className={`text-[14px] font-semibold transition-colors ${
                      open ? "text-ink" : "text-ink/80"
                    }`}
                  >
                    {f.q}
                  </span>
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                      open
                        ? "border-ink bg-ink text-white"
                        : "border-[color:var(--border)] text-ink/60"
                    }`}
                  >
                    {open ? (
                      <Minus className="h-3 w-3" strokeWidth={2.6} />
                    ) : (
                      <Plus className="h-3 w-3" strokeWidth={2.6} />
                    )}
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-[13px] font-normal leading-relaxed text-ink/65">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
