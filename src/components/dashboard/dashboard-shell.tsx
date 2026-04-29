"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Film,
  Home,
  LifeBuoy,
  Link2,
  LogOut,
  Menu,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/hooks/use-preferences";
import type { DbUser } from "@/db/schema";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  matchPrefix?: string;
};

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/link-builder": "Build Link",
  "/dashboard/videos": "Upload Video",
  "/dashboard/analytics": "Analytics",
  "/dashboard/billing": "Billing",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
};

export function DashboardShell({
  children,
  user,
  planName = "free",
  mode = "creator",
}: {
  children: React.ReactNode;
  user: DbUser;
  planName?: "free" | "creator" | "business";
  mode?: "creator" | "admin";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = searchParams.get("auth");
  const searchParamsValue = searchParams.toString();
  const { dictionary } = usePreferences();
  const supabase = createClient();
  const displayUsername = user.username ? `@${user.username}` : "@creator";
  const planLabel =
    planName === "business" ? "Business" : planName === "creator" ? "Creator" : "Free";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryNavItems: NavItem[] =
    mode === "admin"
      ? [{ href: "/admin", label: "Owner Panel", icon: Home }]
      : [
          { href: "/dashboard", label: "Dashboard", icon: Home },
          { href: "/dashboard/link-builder", label: "Build Link", icon: Link2 },
          {
            href: "/dashboard/videos",
            label: "Upload Video",
            icon: Film,
            matchPrefix: "/dashboard/videos",
          },
          { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
          { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
          { href: "/dashboard/profile", label: "Profile", icon: UserRound },
        ];

  const settingsNavItems: NavItem[] =
    mode === "admin"
      ? []
      : [
          {
            href: "/dashboard/settings",
            label: "Settings",
            icon: Settings2,
          },
        ];

  const helpNavItem: NavItem = {
    href: "/customer-service",
    label: "Help Center",
    icon: LifeBuoy,
  };

  const isNavItemActive = (item: NavItem) => {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    if (item.href === "/dashboard" || item.href === "/admin") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

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

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const authProfileHref = useMemo(
    () => `/creator/${user.username || "creator"}`,
    [user.username]
  );

  const breadcrumbLabel =
    routeLabels[pathname] ||
    routeLabels[Object.keys(routeLabels).find((route) => pathname.startsWith(`${route}/`)) || ""] ||
    "Dashboard";

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    window.location.replace("/");
  };

  const renderNavItem = (item: NavItem, mobile = false) => {
    const Icon = item.icon;
    const active = isNavItemActive(item);

    return (
      <Link
        key={`${mobile ? "mobile" : "desktop"}-${item.href}`}
        href={item.href}
        onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-blue-50/80 text-blue-600"
            : "text-slate-500 hover:bg-blue-50/50 hover:text-blue-600"
        )}
      >
        <Icon className={cn("h-4 w-4", active ? "text-blue-600" : "text-slate-400")} />
        <span>{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <AppLogo />
        <span className="rounded-full border border-slate-200 bg-blue-50/50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
          {planLabel}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Creator Mode
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{planLabel}: aktif</p>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Main Menu
        </p>
        <nav className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {primaryNavItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Settings
          </p>
          <div className="mt-2 space-y-1">
            {settingsNavItems.map((item) => renderNavItem(item))}
            {renderNavItem(helpNavItem)}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start rounded-xl border-slate-200 bg-white text-slate-500 hover:bg-blue-50/50 hover:text-blue-600"
            onClick={handleSignOut}
            aria-label={dictionary.logout}
          >
            <LogOut className="h-4 w-4" />
            {dictionary.logout}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebarContent}
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open dashboard menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <p className="text-xs font-medium text-slate-500">Dashboard / {breadcrumbLabel}</p>
              <h1 className="text-base font-semibold text-slate-800">Dashboard Kreator</h1>
            </div>
            <span className="lg:hidden">
              <AppLogo />
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href={authProfileHref}
              target="_blank"
              className="hidden rounded-full border border-slate-200 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 md:inline-flex"
            >
              {displayUsername}
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm md:px-3">
              <AvatarBadge
                name={user.name || "Creator"}
                avatarUrl={user.image || ""}
                crop={{
                  x: user.avatarCropX,
                  y: user.avatarCropY,
                  zoom: user.avatarCropZoom,
                }}
                size="sm"
              />
              <p className="hidden max-w-[180px] truncate text-sm font-semibold text-slate-800 sm:block">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/35 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          <div className="absolute left-0 top-0 h-full w-[84vw] max-w-[360px] border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <AppLogo />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100%-73px)] overflow-y-auto">{sidebarContent}</div>
          </div>
        </div>
      ) : null}

      <div className="min-h-screen pt-16 lg:pl-64">
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
