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
  soon?: boolean;
};

const SIDEBAR_STORAGE_KEY = "showreels.sidebar.collapsed";

export function DashboardShell({
  children,
  user,
  mode = "creator",
}: {
  children: React.ReactNode;
  user: DbUser;
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

  const navItems: NavItem[] =
    mode === "admin"
      ? [{ href: "/admin", label: "Owner Panel", icon: Home }]
      : [
          { href: "/dashboard", label: dictionary.dashboard, icon: Home },
          { href: "/dashboard/link-builder", label: "Link Builder", icon: Link2 },
          { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, soon: true },
          { href: "/dashboard/billing", label: "Billing", icon: CreditCard, soon: true },
          { href: "/dashboard/profile", label: dictionary.profile, icon: UserRound },
          { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
          {
            href: "/dashboard/videos/new",
            label: "Video Karya",
            icon: Film,
            matchPrefix: "/dashboard/videos",
          },
        ];

  const sidebarWidthClass = collapsed ? "lg:w-[90px]" : "lg:w-[288px]";

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
    <div className="min-h-screen bg-canvas text-[#201b18]">
      <header className="sticky top-0 z-30 border-b border-[#e2d9d3] bg-[#f7f4f1]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#ded3cd] bg-white text-[#201b18] lg:inline-flex"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <AppLogo />
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={authProfileHref}
              target="_blank"
              className="rounded-full border border-[#ded3cd] bg-white px-3 py-2 text-xs font-semibold text-[#4f433d] shadow-sm transition hover:border-[#b9aca5] hover:text-[#201b18]"
            >
              {displayUsername}
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-[#ded3cd] bg-white px-3 py-2 shadow-sm">
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
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {dictionary.logout}
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded3cd] bg-white text-[#201b18] md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open dashboard menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-[#201b18]/35 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-[340px] border-r border-[#ded3cd] bg-[#f8f5f2] p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <AppLogo />
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ded3cd] bg-white text-[#201b18]"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 rounded-2xl border border-[#ded3cd] bg-white p-3">
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
            <nav className="space-y-1">
              {navItems.map((item) => {
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
                        ? "bg-[#1a1412] text-white"
                        : "text-[#4f433d] hover:bg-white hover:text-[#201b18]"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.soon ? (
                      <span className="rounded-full bg-[#fff2ee] px-2 py-0.5 text-[10px] font-semibold text-[#c24e3f]">
                        Soon
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {dictionary.logout}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1400px] gap-4 px-3 py-5 sm:px-6 sm:py-6">
        <aside
          className={cn(
            "hidden shrink-0 rounded-2xl border border-[#ddd3cd] bg-white/90 p-3 shadow-card transition-all duration-200 lg:block",
            sidebarWidthClass
          )}
        >
          <div className={cn("mb-4 rounded-xl bg-[#f5efea] p-3", collapsed ? "text-center" : "")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a6a61]">
              Plan
            </p>
            <p className="mt-1 text-sm font-semibold text-[#231d19]">{collapsed ? "Free" : "Free Creator"}</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={cn(
                    "group flex items-center rounded-xl transition",
                    collapsed
                      ? "h-11 justify-center"
                      : "h-11 justify-between px-3",
                    active
                      ? "bg-[#1a1412] text-white"
                      : "text-[#4f433d] hover:bg-[#f1ebe6] hover:text-[#201b18]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {!collapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
                  </span>
                  {!collapsed && item.soon ? (
                    <span className="rounded-full bg-[#fff2ee] px-2 py-0.5 text-[10px] font-semibold text-[#c24e3f]">
                      Soon
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
