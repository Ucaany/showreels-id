"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Film,
  Home,
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

const SIDEBAR_STORAGE_KEY = "showreels.sidebar.collapsed";

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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const primaryNavItems: NavItem[] =
    mode === "admin"
      ? [{ href: "/admin", label: "Owner Panel", icon: Home }]
      : [
          { href: "/dashboard", label: dictionary.dashboard, icon: Home },
          { href: "/dashboard/link-builder", label: "Link Builder", icon: Link2 },
          { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
          { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
          { href: "/dashboard/profile", label: dictionary.profile, icon: UserRound },
          {
            href: "/dashboard/videos",
            label: "Kelola Video",
            icon: Film,
            matchPrefix: "/dashboard/videos",
          },
        ];

  const secondaryNavItems: NavItem[] =
    mode === "admin"
      ? []
      : [
          {
            href: "/dashboard/settings",
            label: "Settings",
            icon: Settings2,
          },
        ];

  const sidebarWidthClass = collapsed
    ? "lg:w-[var(--dashboard-sidebar-collapsed-width)]"
    : "lg:w-[var(--dashboard-sidebar-width)]";

  const isNavItemActive = (item: NavItem) => {
    if (item.matchPrefix) {
      return pathname.startsWith(item.matchPrefix);
    }

    if (item.href === "/dashboard" || item.href === "/admin") {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // Ignore storage write errors.
    }
  }, [collapsed]);

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

  const authProfileHref = useMemo(
    () => `/creator/${user.username || "creator"}`,
    [user.username]
  );

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    window.location.replace("/");
  };

  return (
    <div className="dashboard-surface min-h-screen text-[#1d2333]">
      <header className="sticky top-0 z-30 border-b border-[#dbe4f6] bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1420px] items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="dashboard-tap-target hidden items-center justify-center rounded-xl border border-[#d3ddf2] bg-white text-[#2c4a80] shadow-sm lg:inline-flex"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <AppLogo />
          </div>

          <div className="hidden items-center gap-2.5 md:flex">
            <Link
              href={authProfileHref}
              target="_blank"
              className="rounded-full border border-[#d5e0f5] bg-white px-3 py-2 text-xs font-semibold text-[#47679b] shadow-sm transition hover:border-[#a8c2f3] hover:text-[#1f58e3]"
            >
              {displayUsername}
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-[#d5e0f5] bg-white px-3 py-2 shadow-sm">
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
              <p className="max-w-[200px] truncate whitespace-nowrap text-sm font-semibold text-[#201b18]">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-tap-target inline-flex items-center justify-center rounded-xl border border-[#d3ddf2] bg-white text-[#2c4a80] shadow-sm md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open dashboard menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-[#1c2438]/42 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          <div className="absolute left-0 top-0 flex h-full w-[88%] max-w-[340px] flex-col border-r border-[#cfdbf2] bg-[#f4f8ff] p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <AppLogo />
              <button
                type="button"
                className="dashboard-tap-target inline-flex items-center justify-center rounded-xl border border-[#d3ddf2] bg-white text-[#2c4a80]"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 rounded-2xl border border-[#d2ddf3] bg-white p-3">
              <div className="flex items-center gap-2">
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
                <p className="min-w-0 truncate whitespace-nowrap text-sm font-semibold text-[#201b18]">
                  {displayUsername}
                </p>
              </div>
              <p className="mt-1 truncate text-xs text-[#6e6058]">{user.email}</p>
            </div>
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {[...primaryNavItems, ...secondaryNavItems].map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item);

                return (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-[#edf3ff] text-[#1f58e3] ring-1 ring-[#bdd2ff]"
                        : "text-[#506890] hover:bg-white hover:text-[#1f3f6f]"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-[#e0e7f5] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-4">
              <Button
                variant="secondary"
                size="sm"
                className="min-h-11 w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                {dictionary.logout}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dashboard-shell-container flex gap-4 lg:items-start">
        <aside
          className={cn(
            "dashboard-panel hidden shrink-0 overflow-hidden p-3 transition-all duration-200 lg:sticky lg:top-[90px] lg:block lg:h-[calc(100vh-108px)]",
            sidebarWidthClass
          )}
        >
          <div className={cn("mb-4 rounded-xl border border-[#d5e0f5] bg-[#edf4ff] p-3", collapsed ? "text-center" : "")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#57709b]">
              Plan
            </p>
            <p className="mt-1 text-sm font-semibold text-[#1f3f6f]">
              {collapsed ? planLabel : `${planLabel} Creator`}
            </p>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={cn(
                    "group relative flex items-center rounded-xl transition",
                    collapsed
                      ? "h-11 justify-center"
                      : "h-11 justify-between px-3",
                    active
                      ? "bg-[#eaf2ff] text-[#1f58e3] ring-1 ring-[#bfd6ff]"
                      : "text-[#4f658f] hover:bg-[#eff4ff] hover:text-[#1f3f6f]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {!collapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
                  </span>
                  {collapsed ? (
                    <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#dfd3cc] bg-white px-2.5 py-1 text-xs font-medium text-[#2a221f] shadow-md group-hover:block">
                      {item.label}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            </div>
            <div className="space-y-3 border-t border-[#e0e8f5] pt-4">
              <div className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-label={item.label}
                      className={cn(
                        "group relative flex items-center rounded-xl transition",
                        collapsed
                          ? "h-11 justify-center"
                          : "h-11 justify-between px-3",
                        active
                          ? "bg-[#eaf2ff] text-[#1f58e3] ring-1 ring-[#bfd6ff]"
                          : "text-[#4f658f] hover:bg-[#eff4ff] hover:text-[#1f3f6f]"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {!collapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
                      </span>
                      {collapsed ? (
                        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#dfd3cc] bg-white px-2.5 py-1 text-xs font-medium text-[#2a221f] shadow-md group-hover:block">
                          {item.label}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
              {!collapsed ? (
                <div className="rounded-2xl border border-[#d5e1f4] bg-[#f4f8ff] p-3">
                  <p className="text-xs font-semibold text-[#57709b]">Akun</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#201b18]">{user.email}</p>
                </div>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                className={cn("dashboard-tap-target w-full", collapsed ? "px-0" : "")}
                onClick={handleSignOut}
                aria-label={dictionary.logout}
                title={collapsed ? dictionary.logout : undefined}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed ? dictionary.logout : null}
              </Button>
            </div>
          </nav>
        </aside>

        <main className="dashboard-stack dashboard-compact-mobile min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
