"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { BellIcon } from "lucide-react";
import Link from "next/link";
import { navLinks, adminNavGroups } from "@/components/app-shared";

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

export function AppHeader() {
  const pathname = usePathname();
  const label = resolveLabel(pathname);

  return (
    <header className="mb-6 flex items-center justify-between gap-2 px-4 md:px-2">
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
