"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, LogOut, Menu, UserRound, Video, X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { SitePreferences } from "@/components/site-preferences";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
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
  const { dictionary } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        ];

  return (
    <div className="min-h-screen bg-canvas text-slate-950">
      <header className="sticky top-0 z-30 border-b border-border bg-surface backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo />
          <div className="hidden items-center gap-3 lg:flex">
            <SitePreferences />
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  {user.name}
                </p>
                <p className="text-xs text-slate-600">
                  @{user.username}
                </p>
              </div>
              <AvatarBadge name={user.name || "Creator"} avatarUrl={user.image || ""} size="sm" />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
              {dictionary.logout}
            </Button>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 lg:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open dashboard menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-[340px] border-r border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <AppLogo />
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <SitePreferences />
            </div>
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-600">@{user.username}</p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`) ||
                  (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false);

                return (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-brand-600 text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
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
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
              {dictionary.logout}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden rounded-2xl border border-border bg-surface p-3 shadow-card lg:block lg:h-fit">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand-600 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
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

