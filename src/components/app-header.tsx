"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { navLinks, adminNavGroups } from "@/components/app-shared";
import { BellIcon } from "lucide-react";
import type { DbUser } from "@/db/schema";

function resolveLabel(pathname: string): string {
  const allLinks = [
    ...navLinks,
    ...adminNavGroups.flatMap((g) => g.items),
  ];
  const exact = allLinks.find((item) => item.path === pathname);
  if (exact) return exact.title;
  const prefix = allLinks.find(
    (item) => item.path && !item.path.includes("?") && pathname.startsWith(`${item.path}/`)
  );
  return prefix?.title ?? "Dashboard";
}

export function AppHeader({ user }: { user?: DbUser }) {
  const pathname = usePathname();
  const label = resolveLabel(pathname);

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:px-6">
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs page={{ title: label }} />
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/notifications"
          aria-label="Notifikasi"
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <BellIcon className="size-4" />
        </Link>
      </div>
    </header>
  );
}
