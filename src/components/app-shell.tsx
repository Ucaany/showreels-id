"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import type { DbUser } from "@/db/schema";
import type { AppMode } from "@/components/app-shared";

export function AppShell({
  children,
  user,
  mode = "creator",
}: {
  children: React.ReactNode;
  user: DbUser;
  mode?: AppMode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} mode={mode} />
      <SidebarInset className="p-4 md:p-6">
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
