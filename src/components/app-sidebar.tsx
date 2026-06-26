"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoIcon } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  creatorNavGroups,
  creatorFooterNavLinks,
  adminNavGroups,
  adminFooterNavLinks,
  type SidebarNavGroup,
  type SidebarNavItem,
  type AppMode,
} from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";
import type { DbUser } from "@/db/schema";

function isItemActive(item: SidebarNavItem, pathname: string): boolean {
  if (!item.path) return false;
  // Exact match for root paths
  if (item.path === "/dashboard" || item.path === "/admin") {
    return pathname === item.path;
  }
  // Query-based admin sections
  if (item.path.includes("?")) {
    return false; // handled by admin panel's own tab state
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

function SidebarNavGroups({
  groups,
  pathname,
}: {
  groups: SidebarNavGroup[];
  pathname: string;
}) {
  return (
    <>
      {groups.map((group, index) => (
        <SidebarGroup key={`sidebar-group-${index}`}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarMenu>
            {group.items.map((item) => {
              const active = isItemActive(item, pathname);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.title}
                    render={<Link href={item.path || "#"} />}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}

export function AppSidebar({
  user,
  mode = "creator",
}: {
  user: DbUser;
  mode?: AppMode;
}) {
  const pathname = usePathname();
  const groups = mode === "admin" ? adminNavGroups : creatorNavGroups;
  const footerLinks = mode === "admin" ? adminFooterNavLinks : creatorFooterNavLinks;

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="h-14 justify-center">
        <SidebarMenuButton render={<Link href={mode === "admin" ? "/admin" : "/dashboard"} />}>
          <LogoIcon />
          <span className="font-medium">showreels.id</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavGroups groups={groups} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {footerLinks.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="text-muted-foreground"
                size="sm"
                render={<Link href={item.path || "#"} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
