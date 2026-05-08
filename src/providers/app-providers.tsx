"use client";

import { SessionProvider } from "next-auth/react";
import { type Locale } from "@/lib/i18n";
import { SessionActivityManager } from "@/components/session-activity-manager";
import { SiteMaintenanceGate } from "@/components/site-maintenance-gate";
import { VisitorTracker } from "@/components/visitor-tracker";
import { PreferencesProvider } from "@/providers/preferences-provider";
import { SWRProvider } from "@/components/swr-provider";

export function AppProviders({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return (
    <SessionProvider>
      <SWRProvider>
        <PreferencesProvider initialLocale={initialLocale}>
          <SessionActivityManager />
          <VisitorTracker />
          <SiteMaintenanceGate />
          {children}
        </PreferencesProvider>
      </SWRProvider>
    </SessionProvider>
  );
}
