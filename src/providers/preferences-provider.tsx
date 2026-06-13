"use client";

import {
  createContext,
  startTransition,
  useContext,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  dictionaries,
  type Dictionary,
  type Locale,
  resolveLocale,
} from "@/lib/i18n";

interface PreferencesContextValue {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined
);

export function PreferencesProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(resolveLocale(initialLocale));

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000`;
    window.localStorage.setItem("locale", nextLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  const value = {
    locale,
    dictionary: dictionaries[locale],
    setLocale,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
