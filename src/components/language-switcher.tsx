"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePreferences } from "@/hooks/use-preferences";
import { FlagIcon } from "@/components/landing-new/FlagIcon";

export function LanguageSwitcher({ compact: _ = false }: { compact?: boolean }) {
  const { locale, setLocale } = usePreferences();
  const [open, setOpen] = useState(false);

  const current = locale === "id" ? "ID" : "EN";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Pilih bahasa"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
      >
        <FlagIcon code={current} className="h-[16px] w-[24px] rounded-[3px]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(10,13,20,0.12)]"
          >
            {(["ID", "EN"] as const).map((code) => {
              const isActive = current === code;
              return (
                <button
                  key={code}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setLocale(code.toLowerCase() as "id" | "en");
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-blue-50 text-slate-900"
                      : "text-slate-600 hover:bg-blue-50/60"
                  }`}
                >
                  <FlagIcon code={code} className="h-[16px] w-[24px] shrink-0 rounded-[3px]" />
                  <span className="flex-1 text-[13px] font-semibold">
                    {code === "ID" ? "Bahasa Indonesia" : "English"}
                  </span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
