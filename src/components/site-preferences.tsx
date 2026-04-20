import { LanguageSwitcher } from "@/components/language-switcher";

export function SitePreferences({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-nowrap items-center gap-2">
      <LanguageSwitcher compact={compact} />
    </div>
  );
}
