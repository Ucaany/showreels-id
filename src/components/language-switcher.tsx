"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/use-preferences";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, dictionary } = usePreferences();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd3cd] bg-white px-2 py-1.5 shadow-sm">
      <span
        className={`inline-flex h-8 items-center gap-2 px-2 text-xs font-semibold text-[#665952] ${
          compact ? "min-w-0 justify-center" : "min-w-[102px]"
        }`}
        title={dictionary.language}
        aria-label={dictionary.language}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#fde8e2] text-[#e24f3b]">
          <Languages className="h-3.5 w-3.5" />
        </span>
        {compact ? null : dictionary.language}
      </span>
      <div className="inline-flex items-center gap-1 rounded-full bg-[#f4ede8] p-1">
        <Button
          size="sm"
          variant={locale === "id" ? "primary" : "ghost"}
          className="h-8 rounded-full px-3 text-sm"
          onClick={() => setLocale("id")}
        >
          ID
        </Button>
        <Button
          size="sm"
          variant={locale === "en" ? "primary" : "ghost"}
          className="h-8 rounded-full px-3 text-sm"
          onClick={() => setLocale("en")}
        >
          EN
        </Button>
      </div>
    </div>
  );
}
