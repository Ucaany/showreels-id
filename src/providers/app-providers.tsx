"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const shouldRunSessionActivity =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/payment");

  return (
    <SessionProvider>
      <SWRProvider>
        <PreferencesProvider initialLocale={initialLocale}>
          {shouldRunSessionActivity ? <SessionActivityManager /> : null}
          <VisitorTracker />
          <SiteMaintenanceGate />
          {children}
        </PreferencesProvider>
      </SWRProvider>
    </SessionProvider>
  );
}
