"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bell,
  Box,
  CreditCard,
  Film,
  HelpCircle,
  Home,
  LayoutGrid,
  LifeBuoy,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Truck,
  UserRound,
  X,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";
import { PrefetchLink } from "@/components/prefetch-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { CACHE_KEYS } from "@/lib/swr-config";
import { signOut } from "next-auth/react";
import { usePreferences } from "@/hooks/use-preferences";
import type { DbUser } from "@/db/schema";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  matchPrefix?: string;
  children?: { href: string; label: string; icon: typeof Home }[];
};

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/link-builder": "Link Bio",
  "/dashboard/videos": "Portofolio",
  "/dashboard/analytics": "Analytics",
  "/dashboard/billing": "Billing",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/notifications": "Notifications",
};

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
  mode?: "creator" | "admin";
  hideChrome?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = searchParams.get("auth");
  const searchParamsValue = searchParams.toString();
  const { dictionary } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trackDeliveriesOpen, setTrackDeliveriesOpen] = useState(false);

  const trackDeliveriesChildren = [
    { href: "/dashboard/analytics?status=on-progress", label: "On Progress", icon: Circle },
    { href: "/dashboard/analytics?status=delivered", label: "Delivered", icon: CheckCircle2 },
    { href: "/dashboard/analytics?status=canceled", label: "Canceled", icon: XCircle },
    { href: "/dashboard/analytics?status=pending", label: "Pending", icon: Clock },
  ];

  const primaryNavItems: NavItem[] =
    mode === "admin"
      ? [{ href: "/admin", label: "Owner Panel", icon: Home }]
      : [
          { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
          { href: "/dashboard/link-builder", label: "Orders", icon: Package },
          {
            href: "/dashboard/analytics",
            label: "Track Deliveries",
            icon: Truck,
            matchPrefix: "/dashboard/analytics",
            children: trackDeliveriesChildren,
          },
          { href: "/dashboard/billing", label: "Payment", icon: CreditCard },
          { href: "/dashboard/videos", label: "Portofolio", icon: Film, matchPrefix: "/dashboard/videos" },
          { href: "/dashboard/profile", label: "Profile", icon: UserRound },
          { href: "/dashboard/notifications", label: "Notifikasi", icon: Bell },
        ];

  const settingsNavItems: NavItem[] =
    mode === "admin"
      ? []
      : [
          { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
          { href: "/customer-service", label: "Support & Help", icon: HelpCircle },
          { href: "/dashboard/notifications?tab=feedback", label: "Feedback", icon: MessageSquare },
        ];

  const isNavItemActive = (item: NavItem) => {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    if (item.href === "/dashboard" || item.href === "/admin") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  useEffect(() => {
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

  const breadcrumbLabel =
    routeLabels[pathname] ||
    routeLabels[
      Object.keys(routeLabels).find((route) => pathname.startsWith(`${route}/`)) || ""
    ] ||
    "Dashboard";

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.replace("/");
  };

  const prefetchDataMap: Record<string, string | string[]> = {
    "/dashboard": CACHE_KEYS.DASHBOARD_SUMMARY,
    "/dashboard/videos": CACHE_KEYS.VIDEOS,
    "/dashboard/analytics": CACHE_KEYS.ANALYTICS_SUMMARY("7d"),
    "/dashboard/billing": CACHE_KEYS.BILLING_PLAN,
    "/dashboard/profile": CACHE_KEYS.PROFILE,
    "/dashboard/notifications": CACHE_KEYS.NOTIFICATIONS,
    "/dashboard/settings": CACHE_KEYS.SETTINGS_LINK_PROFILE,
    "/dashboard/link-builder": CACHE_KEYS.LINKS,
  };

  const renderNavItem = (item: NavItem, mobile = false, expanded = sidebarOpen) => {
    const Icon = item.icon;
    const active = isNavItemActive(item);
    const prefetchData = prefetchDataMap[item.href];
    const hasChildren = item.children && item.children.length > 0;
    const isTrackDeliveries = item.label === "Track Deliveries";

    if (hasChildren && expanded) {
      const isOpen = isTrackDeliveries ? trackDeliveriesOpen : false;
      return (
        <div key={`group-${item.href}`}>
          <button
            type="button"
            onClick={() => isTrackDeliveries && setTrackDeliveriesOpen((v) => !v)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-slate-700" : "text-slate-400")} />
            <span className="flex-1 text-left">{item.label}</span>
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
          {isOpen && (
            <div className="relative ml-3.5 mt-0.5 pl-4">
              <div className="absolute left-0 top-1 bottom-1 w-px bg-slate-200" />
              <div className="space-y-0.5">
                {item.children!.map((child) => {
                  const ChildIcon = child.icon;
                  const childActive = pathname === child.href || pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        childActive
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <PrefetchLink
        key={`${mobile ? "mobile" : "desktop"}-${item.href}`}
        href={item.href}
        prefetchData={prefetchData}
        prefetchDelay={50}
        disablePrefetch={active}
        onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
          active
            ? "bg-zinc-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          !expanded && !mobile && "justify-center"
        )}
        title={!expanded && !mobile ? item.label : undefined}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")} />
        {(expanded || mobile) && (
          <span className={cn("flex-1", active && "text-white")}>{item.label}</span>
        )}
      </PrefetchLink>
    );
  };

  const userInitials = (user.name || "DC")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderSidebarContent = (expanded = sidebarOpen, mobile = false) => (
    <div className="flex h-full flex-col bg-white px-3 py-4">
      {/* Logo header */}
      <div className={cn("flex items-center gap-2.5", !expanded && !mobile && "justify-center")}>
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900">
          <Box className="h-4.5 w-4.5 text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
        </div>
        {(expanded || mobile) && (
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold tracking-tight text-slate-900">showreels.id</p>
          </div>
        )}
        {(expanded || mobile) && !mobile && (
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!expanded && !mobile && (
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="mt-3 flex h-8 w-full items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Main menu group */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        {(expanded || mobile) && (
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Main Menu
          </p>
        )}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {primaryNavItems
            .filter((item) =>
              ["Dashboard", "Orders", "Track Deliveries", "Payment", "Owner Panel"].includes(item.label)
            )
            .map((item) => renderNavItem(item, mobile, expanded))}
        </nav>

        {/* Settings group */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          {(expanded || mobile) && (
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Settings
            </p>
          )}
          <div className="space-y-0.5">
            {settingsNavItems.map((item) => renderNavItem(item, mobile, expanded))}
          </div>
        </div>

        {/* User footer */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className={cn("flex items-center gap-2.5", !expanded && !mobile && "justify-center")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-bold text-white">
              {userInitials}
            </div>
            {(expanded || mobile) && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.name || "Creator"}
                </p>
                <p className="truncate text-xs text-slate-400">{user.email || ""}</p>
              </div>
            )}
            {(expanded || mobile) && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label={dictionary.logout}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const sidebarContent = renderSidebarContent();
  const mobileSidebarContent = renderSidebarContent(true, true);

  if (hideChrome) {
    return <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900">{children}</div>;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F9FAFB] font-sans text-slate-900">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all duration-300 ease-in-out md:block",
          sidebarOpen ? "w-64" : "w-[72px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Top header */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:left-64" : "md:left-[72px]"
        )}
      >
        <div className="flex h-14 min-w-0 items-center justify-between gap-3 px-4 md:px-6">
          {/* Left: hamburger (mobile) + breadcrumb */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open dashboard menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 truncate text-sm text-slate-400">
              <Link
                href="/dashboard"
                className="hidden transition hover:text-slate-700 min-[380px]:inline"
              >
                Main Menu
              </Link>
              <span className="mx-1.5 hidden text-slate-300 min-[380px]:inline">/</span>
              <Link
                href={pathname}
                className="truncate font-semibold text-slate-900 transition hover:text-slate-700"
              >
                {breadcrumbLabel}
              </Link>
            </div>
          </div>

          {/* Right: search + calendar icon + avatar */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="relative hidden items-center md:flex">
              <span className="pointer-events-none absolute left-3 flex h-full items-center">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search anything..."
                className="h-9 w-56 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100"
                aria-label="Search"
              />
            </div>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Calendar"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-0.5 pl-0.5 shadow-sm md:pr-3">
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
              <p className="hidden max-w-[140px] truncate text-sm font-semibold text-slate-800 md:block">
                {user.name || "Creator"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/30 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          <div className="absolute left-0 top-0 h-full w-[82vw] max-w-[320px] overflow-hidden border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 p-4">
              <AppLogo className="min-w-0" />
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100%-65px)] overflow-y-auto">{mobileSidebarContent}</div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "min-h-screen pt-14 transition-[padding] duration-300 ease-in-out",
          sidebarOpen ? "md:pl-64" : "md:pl-[72px]"
        )}
      >
        <main key={pathname} className="min-w-0 overflow-x-hidden p-3 pb-24 sm:p-4 md:p-6 md:pb-8">
          {children}
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
