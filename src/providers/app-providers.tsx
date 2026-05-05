"use client";

import { useEffect } from "react";
import { type Locale } from "@/lib/i18n";
import { SessionActivityManager } from "@/components/session-activity-manager";
import { SiteMaintenanceGate } from "@/components/site-maintenance-gate";
import { VisitorTracker } from "@/components/visitor-tracker";
import { PreferencesProvider } from "@/providers/preferences-provider";
import { SWRProvider } from "@/components/swr-provider";
import { ReactQueryProvider } from "@/components/react-query-provider";

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
    <ReactQueryProvider>
      <SWRProvider>
        <PreferencesProvider initialLocale={initialLocale}>
          <SessionActivityManager />
          <VisitorTracker />
          <SiteMaintenanceGate />
          {children}
        </PreferencesProvider>
      </SWRProvider>
    </ReactQueryProvider>
  );
}
