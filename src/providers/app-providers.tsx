"use client";

import { useEffect } from "react";
import { type Locale } from "@/lib/i18n";
import { SessionActivityManager } from "@/components/session-activity-manager";
import { SiteMaintenanceGate } from "@/components/site-maintenance-gate";
import { VisitorTracker } from "@/components/visitor-tracker";
import { PreferencesProvider } from "@/providers/preferences-provider";

export function AppProviders({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.removeItem("theme");
    window.localStorage.removeItem("next-theme");
    window.localStorage.removeItem("next-themes-theme");
  }, []);

  return (
    <PreferencesProvider initialLocale={initialLocale}>
      <SessionActivityManager />
      <VisitorTracker />
      <SiteMaintenanceGate />
      {children}
    </PreferencesProvider>
  );
}
