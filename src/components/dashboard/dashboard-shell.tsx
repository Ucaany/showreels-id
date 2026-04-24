"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home, LogOut, Menu, Settings2, UserRound, Video, X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { createClient } from "@/lib/supabase/client";
import { usePreferences } from "@/hooks/use-preferences";
import type { DbUser } from "@/db/schema";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();
  const displayUsername = user.username ? `@${user.username}` : "@creator";
  type NavItem = {
    href: string;
    label: string;
    icon: typeof Home;
    matchPrefix?: string;
  };

  const navItems: NavItem[] =
    mode === "admin"
      ? [{ href: "/admin", label: "Owner Panel", icon: Home }]
      : [
          { href: "/dashboard", label: dictionary.dashboard, icon: Home },
          { href: "/dashboard/profile", label: dictionary.profile, icon: UserRound },
          {
            href: "/dashboard/videos/new",
            label: dictionary.submitVideo,
            icon: Video,
            matchPrefix: "/dashboard/videos",
          },
          {
            href: "/dashboard/settings",
            label: "Settings",
            icon: Settings2,
          },
        ];
  const mobileNavItems: NavItem[] =
    mode === "admin"
      ? navItems
      : [
          ...navItems,
        ];

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

  return (
    <div className="min-h-screen bg-canvas text-[#201b18]">
      <header className="sticky top-0 z-30 border-b border-[#e2d9d3] bg-[#f7f4f1]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo />
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-[#ded3cd] bg-white px-3 py-2 shadow-sm">
              <p className="max-w-[180px] truncate whitespace-nowrap text-sm font-semibold text-[#201b18]">
                {displayUsername}
              </p>
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
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await supabase?.auth.signOut();
                window.location.replace("/");
              }}
            >
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
            </div>
            <nav className="space-y-1">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item);

                return (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-[#1a1412] text-white"
                        : "text-[#4f433d] hover:bg-white hover:text-[#201b18]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full"
              onClick={async () => {
                await supabase?.auth.signOut();
                window.location.replace("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              {dictionary.logout}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-5 sm:px-6 sm:py-6 md:grid-cols-[72px_1fr]">
        <aside
          className="hidden rounded-2xl border border-[#ddd3cd] bg-white/90 p-2 shadow-card md:block md:h-fit"
        >
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className={cn(
                    "flex h-12 w-full items-center justify-center rounded-xl transition",
                    active
                      ? "bg-[#1a1412] text-white"
                      : "text-[#4f433d] hover:bg-[#f1ebe6] hover:text-[#201b18]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}

