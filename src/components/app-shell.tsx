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
      <SidebarInset className="min-w-0 flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="w-full min-w-0 space-y-6 p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
