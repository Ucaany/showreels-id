"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Lang = "ID" | "EN";

type FlagItem = {
  code: Lang;
  flag: string;
  label: string;
};

const LANGS: FlagItem[] = [
  { code: "ID", flag: "🇮🇩", label: "ID" },
  { code: "EN", flag: "🇬🇧", label: "EN" },
];

const STORAGE_KEY = "showreels-lang";

export default function LanguageSwitch() {
  const [lang, setLang] = useState<Lang>("ID");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      window.localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (saved === "ID" || saved === "EN") setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "ID" ? "id" : "en";
    }
  }, [lang]);

  const handleSelect = (code: Lang) => {
    setLang(code);
    window.localStorage.setItem(STORAGE_KEY, code);
    setOpen(false);
  };

  const active = LANGS.find((l) => l.code === lang)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Pilih bahasa"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[20px] leading-none transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
      >
        <span className="leading-none">{active.flag}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white p-1.5 shadow-[0_18px_40px_rgba(10,13,20,0.12)]"
          >
            {LANGS.map((l) => {
              const isActive = l.code === lang;
              return (
                <button
                  key={l.code}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(l.code)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-brand-50 text-ink"
                      : "text-ink/75 hover:bg-brand-50/60"
                  }`}
                >
                  <span className="text-[22px] leading-none">{l.flag}</span>
                  <span className="flex-1 text-[13px] font-semibold">
                    {l.code === "ID" ? "Bahasa Indonesia" : "English"}
                  </span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
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