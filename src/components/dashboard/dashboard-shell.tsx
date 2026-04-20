"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, LogOut, UserRound, Video } from "lucide-react";
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
}: {
  children: React.ReactNode;
  user: DbUser;
}) {
  const pathname = usePathname();
  const { dictionary } = usePreferences();

  const navItems = [
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
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo />
          <div className="flex flex-wrap items-center gap-3">
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
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-border bg-surface p-3 shadow-card lg:h-fit">
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

