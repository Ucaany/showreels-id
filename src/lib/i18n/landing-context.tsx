"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/components/landing-new/LanguageSwitch";

const STORAGE_KEY = "showreels-lang";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: "ID",
  setLang: () => {},
});

export function LandingLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ID");

  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? (window.localStorage.getItem(STORAGE_KEY) as Lang | null)
      : null;
    if (saved === "ID" || saved === "EN") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l === "ID" ? "id" : "en";
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
