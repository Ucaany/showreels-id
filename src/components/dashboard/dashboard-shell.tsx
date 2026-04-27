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

  const sidebarWidthClass = collapsed
    ? "lg:w-[var(--dashboard-sidebar-collapsed-width)] lg:min-w-[var(--dashboard-sidebar-collapsed-width)] lg:max-w-[var(--dashboard-sidebar-collapsed-width)]"
    : "lg:w-[var(--dashboard-sidebar-width)] lg:min-w-[var(--dashboard-sidebar-width)] lg:max-w-[var(--dashboard-sidebar-width)]";

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

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const authProfileHref = useMemo(
    () => `/creator/${user.username || "creator"}`,
    [user.username]
  );

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    window.location.replace("/");
  };

  const renderDesktopNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isNavItemActive(item);

    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        aria-label={item.label}
        className={cn(
          "group relative flex items-center rounded-xl transition-colors",
          collapsed ? "h-10 justify-center" : "h-10 gap-2.5 px-3",
          active
            ? "bg-[#2f73ff] text-white shadow-[0_12px_24px_rgba(47,115,255,0.28)]"
            : "text-[#4f658f] hover:bg-[#eef4ff] hover:text-[#1f3f6f]"
        )}
      >
        <Icon className={cn("h-4 w-4", active ? "text-white" : "text-[#4f73a8]")} />
        {!collapsed ? <span className="truncate text-sm font-medium">{item.label}</span> : null}
        {collapsed ? (
          <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#d8e4f8] bg-white px-2.5 py-1 text-xs font-medium text-[#2a3f64] shadow-md group-hover:block">
            {item.label}
          </span>
        ) : null}
      </Link>
    );
  };

  const renderMobileNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isNavItemActive(item);

    return (
      <Link
        key={`mobile-${item.href}`}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          active
            ? "bg-[#2f73ff] text-white"
            : "text-[#4f658f] hover:bg-[#eef4ff] hover:text-[#1f3f6f]"
        )}
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="dashboard-shell dashboard-surface min-h-screen w-full overflow-x-hidden text-[#1d2333]">
      <div className="flex min-h-screen w-full">
        <aside className={cn("dashboard-sidebar hidden lg:flex lg:flex-col", sidebarWidthClass)}>
          <div className="sidebar-content flex h-full flex-col px-3 py-4">
            <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-3")}> 
              <AppLogo />
              {!collapsed ? (
                <span className="rounded-full border border-[#d9e4f8] bg-[#f4f8ff] px-2.5 py-1 text-[11px] font-semibold text-[#486896]">
                  {planLabel}
                </span>
              ) : null}
            </div>

            <div
              className={cn(
                "mt-4 rounded-xl border border-[#dce6f8] bg-[#f8fbff]",
                collapsed ? "px-2 py-2 text-center" : "p-3"
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#627da6]">
                Creator Mode
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1f3f6f]">
                {collapsed ? planLabel : `${planLabel} plan aktif`}
              </p>
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <p
                className={cn(
                  "px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6a84ad]",
                  collapsed ? "sr-only" : ""
                )}
              >
                Main Menu
              </p>
              <nav className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                {primaryNavItems.map((item) => renderDesktopNavItem(item))}

                {settingsNavItems.length > 0 ? (
                  <div className="mt-4 border-t border-[#e1e9f8] pt-4">
                    <p
                      className={cn(
                        "px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6a84ad]",
                        collapsed ? "sr-only" : ""
                      )}
                    >
                      Settings
                    </p>
                    <div className="mt-2 space-y-1">
                      {settingsNavItems.map((item) => renderDesktopNavItem(item))}
                    </div>
                  </div>
                ) : null}
              </nav>

              <div className="sidebar-footer mt-4 space-y-2 border-t border-[#e1e9f8] pt-4">
                {renderDesktopNavItem(helpNavItem)}
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn("dashboard-tap-target w-full", collapsed ? "px-0" : "justify-start px-3")}
                  onClick={handleSignOut}
                  aria-label={dictionary.logout}
                  title={collapsed ? dictionary.logout : undefined}
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed ? dictionary.logout : null}
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <header className="sticky top-0 z-30 border-b border-[#dbe4f6]/85 bg-white/92 backdrop-blur-xl">
            <div className="flex w-full items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  className="dashboard-tap-target hidden items-center justify-center rounded-xl border border-[#d3ddf2] bg-white text-[#2c4a80] shadow-sm lg:inline-flex"
                  onClick={() => setCollapsed((prev) => !prev)}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  className="dashboard-tap-target inline-flex items-center justify-center rounded-xl border border-[#d3ddf2] bg-white text-[#2c4a80] shadow-sm lg:hidden"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-label="Open dashboard menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <span className="lg:hidden">
                  <AppLogo />
                </span>
              </div>

              <div className="hidden min-w-0 items-center gap-2.5 md:flex">
                <Link
                  href={authProfileHref}
                  target="_blank"
                  className="rounded-full border border-[#d5e0f5] bg-[#f8fbff] px-3 py-2 text-xs font-semibold text-[#2f73ff] shadow-sm transition hover:border-[#a8c2f3] hover:bg-white"
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

              <Link
                href={authProfileHref}
                target="_blank"
                className="rounded-full border border-[#d5e0f5] bg-[#f8fbff] px-3 py-2 text-xs font-semibold text-[#2f73ff] shadow-sm md:hidden"
              >
                {displayUsername}
              </Link>
            </div>
          </header>

          {mobileMenuOpen ? (
            <div className="fixed inset-0 z-40 bg-[#1c2438]/42 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 h-full w-full cursor-default"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu backdrop"
              />
              <div className="absolute left-0 top-0 flex h-full w-[84vw] max-w-[360px] flex-col border-r border-[#cfdbf2] bg-white p-4 shadow-2xl">
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

                <div className="mb-4 rounded-2xl border border-[#d2ddf3] bg-[#f8fbff] p-3">
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
                  <p className="mt-1 truncate text-xs text-[#6a84ad]">{user.email}</p>
                </div>

                <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                  <div>
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6a84ad]">
                      Main Menu
                    </p>
                    <div className="space-y-1">
                      {primaryNavItems.map((item) => renderMobileNavItem(item))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6a84ad]">
                      Settings
                    </p>
                    <div className="space-y-1">
                      {settingsNavItems.map((item) => renderMobileNavItem(item))}
                      {renderMobileNavItem(helpNavItem)}
                    </div>
                  </div>
                </nav>

                <div className="mt-4 border-t border-[#e0e7f5] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-h-11 w-full justify-start"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {dictionary.logout}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="dashboard-shell-layout">
            <main className="dashboard-main dashboard-stack dashboard-compact-mobile flex-1">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
