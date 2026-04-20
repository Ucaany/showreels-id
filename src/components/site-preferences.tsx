import { LanguageSwitcher } from "@/components/language-switcher";

export function SitePreferences() {
  return (
    <div className="flex flex-nowrap items-center gap-2">
      <LanguageSwitcher />
    </div>
  );
}
