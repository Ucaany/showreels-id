"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import type { DbUser } from "@/db/schema";
import type { AppMode } from "@/components/app-shared";

export function DashboardShell({
  children,
  user,
  planName = "free",
  mode = "creator",
  hideChrome = false,
}: {
  children: React.ReactNode;
  user: DbUser;
  planName?: "free" | "creator" | "business";
  mode?: AppMode;
  hideChrome?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = searchParams.get("auth");
  const searchParamsValue = searchParams.toString();

  // Prefetch creator routes only
  useEffect(() => {
    if (mode !== "creator") return;
    const routesToPrefetch = [
      "/dashboard",
      "/dashboard/profile",
      "/dashboard/link-builder",
      "/dashboard/videos",
      "/dashboard/analytics",
      "/dashboard/billing",
      "/dashboard/settings",
      "/dashboard/notifications",
    ];
    const timer = setTimeout(() => {
      routesToPrefetch.forEach((route) => {
        if (route !== pathname) router.prefetch(route);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show login success alert
  useEffect(() => {
    if (authStatus !== "login") return;
    void showFeedbackAlert({
      title: "Berhasil Login",
      text: "Akun berhasil masuk. Kamu akan tetap berada di dashboard.",
      icon: "success",
      confirmButtonText: "Lanjut",
      timer: 1800,
    }).finally(() => {
      const params = new URLSearchParams(searchParamsValue);
      params.delete("auth");
      const nextUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(nextUrl, { scroll: false });
    });
  }, [authStatus, pathname, router, searchParamsValue]);

  if (hideChrome) {
    return <div className="min-h-screen bg-background font-sans">{children}</div>;
  }

  return (
    <AppShell user={user} mode={mode}>
      {children}
    </AppShell>
  );
}
