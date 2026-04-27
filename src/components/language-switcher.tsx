"use client";

import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/use-preferences";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, dictionary } = usePreferences();
  const baseButtonClass =
    "h-8 rounded-full px-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[#2f73ff]/50";

  return (
    <div
      className={`inline-flex items-center gap-1 ${compact ? "" : "min-h-10"}`}
      aria-label={dictionary.language}
    >
      <Button
        size="sm"
        variant="ghost"
          className={`${baseButtonClass} ${
            locale === "id"
              ? "bg-[#2f73ff] text-black hover:bg-[#225fe0]"
              : "text-black hover:bg-[#edf4ff]"
          }`}
        onClick={() => setLocale("id")}
        title={dictionary.language}
        aria-label={`${dictionary.language} ID`}
      >
        ID
      </Button>
      <Button
        size="sm"
        variant="ghost"
          className={`${baseButtonClass} ${
            locale === "en"
              ? "bg-[#2f73ff] text-black hover:bg-[#225fe0]"
              : "text-black hover:bg-[#edf4ff]"
          }`}
        onClick={() => setLocale("en")}
        title={dictionary.language}
        aria-label={`${dictionary.language} EN`}
      >
        EN
      </Button>
    </div>
  );
}
