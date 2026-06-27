import type { ReactNode } from "react";
import {
  LayoutGridIcon,
  BarChart3Icon,
  FilmIcon,
  Link2Icon,
  UserRoundIcon,
  CreditCardIcon,
  Settings2Icon,
  HelpCircleIcon,
  UsersIcon,
  VideoIcon,
  RadarIcon,
  MegaphoneIcon,
  ShieldIcon,
} from "lucide-react";

export type AppMode = "creator" | "admin";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const creatorNavGroups: SidebarNavGroup[] = [
  {
    label: "Menu Utama",
    items: [
      { title: "Overview", path: "/dashboard", icon: <LayoutGridIcon /> },
      { title: "Portfolio", path: "/dashboard/videos", icon: <FilmIcon /> },
      { title: "Link Bio", path: "/dashboard/link-builder", icon: <Link2Icon /> },
      { title: "Analytics", path: "/dashboard/analytics", icon: <BarChart3Icon /> },
    ],
  },
  {
    label: "Akun",
    items: [
      { title: "Profile", path: "/dashboard/profile", icon: <UserRoundIcon /> },
      { title: "Billing", path: "/dashboard/billing", icon: <CreditCardIcon /> },
      { title: "Account", path: "/dashboard/account", icon: <Settings2Icon /> },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { title: "Settings", path: "/dashboard/settings", icon: <Settings2Icon /> },
    ],
  },
];

export const creatorFooterNavLinks: SidebarNavItem[] = [
  { title: "Bantuan", path: "/customer-service", icon: <HelpCircleIcon /> },
];

export const adminNavGroups: SidebarNavGroup[] = [
  {
    label: "Admin",
    items: [
      { title: "Overview", path: "/admin", icon: <LayoutGridIcon /> },
      { title: "Users", path: "/admin?section=users", icon: <UsersIcon /> },
      { title: "Videos", path: "/admin?section=videos", icon: <VideoIcon /> },
      { title: "Audit", path: "/admin?section=audit", icon: <RadarIcon /> },
    ],
  },
  {
    label: "Sistem",
    items: [
      { title: "Notifikasi", path: "/admin?section=notifications", icon: <MegaphoneIcon /> },
      { title: "Maintenance", path: "/admin?section=maintenance", icon: <ShieldIcon /> },
      { title: "Settings", path: "/admin?section=settings", icon: <Settings2Icon /> },
    ],
  },
];

export const adminFooterNavLinks: SidebarNavItem[] = [
  { title: "Kembali ke Dashboard", path: "/dashboard", icon: <LayoutGridIcon /> },
];

export const navGroups = creatorNavGroups;
export const footerNavLinks = creatorFooterNavLinks;
export const navLinks: SidebarNavItem[] = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item]
    )
  ),
  ...footerNavLinks,
];
