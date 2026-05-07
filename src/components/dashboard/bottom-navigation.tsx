"use client";

import { usePathname } from "next/navigation";
import { BarChart3, Film, Home, Link2 } from "lucide-react";
import { PrefetchLink } from "@/components/prefetch-link";
import { CACHE_KEYS } from "@/lib/swr-config";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Home, prefetchData: CACHE_KEYS.DASHBOARD_SUMMARY },
  { href: "/dashboard/link-builder", label: "Bio", icon: Link2, prefetchData: CACHE_KEYS.LINKS },
  { href: "/dashboard/videos", label: "Videos", icon: Film, matchPrefix: "/dashboard/videos", prefetchData: CACHE_KEYS.VIDEOS },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, prefetchData: CACHE_KEYS.ANALYTICS_SUMMARY("7d") },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-4 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.04)] md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchPrefix
            ? pathname.startsWith(item.matchPrefix)
            : item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <PrefetchLink
              key={item.href}
              href={item.href}
              prefetchData={item.prefetchData}
              prefetchDelay={80}
              disablePrefetch={isActive}
              className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-xs transition ${
                isActive ? "text-zinc-800" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 truncate">{item.label}</span>
            </PrefetchLink>
          );
        })}
      </div>
    </nav>
  );
}
