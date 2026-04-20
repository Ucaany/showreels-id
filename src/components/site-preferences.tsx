import { LanguageSwitcher } from "@/components/language-switcher";

export function SitePreferences() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <LanguageSwitcher />
    </div>
  );
}
