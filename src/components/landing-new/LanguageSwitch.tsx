"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n/landing-context";
import { FlagIcon } from "./FlagIcon";

export type Lang = "ID" | "EN";

type FlagItem = {
  code: Lang;
  label: string;
};

const LANGS: FlagItem[] = [
  { code: "ID", label: "ID" },
  { code: "EN", label: "EN" },
];

export default function LanguageSwitch() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  const handleSelect = (code: Lang) => {
    setLang(code);
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-white transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
      >
        <FlagIcon code={active.code} className="h-[18px] w-[26px] rounded-[3px]" />
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
                  <FlagIcon code={l.code} className="h-[18px] w-[26px] shrink-0 rounded-[3px]" />
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
