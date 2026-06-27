"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoIcon } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { NavGroup } from "@/components/nav-group";
import type { DbUser } from "@/db/schema";

function isItemActive(item: SidebarNavItem, pathname: string): boolean {
  if (!item.path) return false;
  if (item.path === "/dashboard" || item.path === "/admin") {
    return pathname === item.path;
  }
  if (item.path.includes("?")) return false;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
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

  const navGroupsWithActive: SidebarNavGroup[] = groups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      isActive: isItemActive(item, pathname),
    })),
  }));

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-14 justify-center border-b px-2">
        <SidebarMenuButton render={<Link href={mode === "admin" ? "/admin" : "/dashboard"} />}>
          <LogoIcon />
          <span className="font-semibold text-foreground">showreels.id</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        {navGroupsWithActive.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-0 p-0">
        <SidebarMenu className="border-t p-2">
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
        <div className="px-2 pb-2">
          <NavUser user={user} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
