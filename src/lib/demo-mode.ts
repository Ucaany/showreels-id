/**
 * Demo Mode Configuration
 * 
 * When NEXT_PUBLIC_DEMO_MODE=true, the app uses local cookie-based sessions
 * with predefined test accounts instead of production Auth.js flows.
 * 
 * Test Accounts:
 * - Admin: admin@showreels.id / admin123
 * - User:  creator@showreels.id / creator123
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_COOKIE_NAME = "showreels-demo-session";

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  username: string;
  role: string;
  isAdmin: boolean;
  bio: string;
  city: string;
  skills: string[];
  avatarUrl: string;
  coverImageUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo-admin-001",
    email: "admin@showreels.id",
    password: "admin123",
    name: "Admin Showreels",
    username: "admin_showreels",
    role: "owner",
    isAdmin: true,
    bio: "Platform administrator untuk showreels.id. Mengelola creator, konten, dan pengaturan sistem.",
    city: "Jakarta",
    skills: ["Platform Management", "Content Moderation", "Analytics"],
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    instagramUrl: "https://instagram.com/showreels.id",
    youtubeUrl: "https://youtube.com/@showreelsid",
    websiteUrl: "https://showreels.id",
  },
  {
    id: "demo-user-001",
    email: "creator@showreels.id",
    password: "creator123",
    name: "Raka Mahendra",
    username: "raka_creator",
    role: "Video Editor",
    isAdmin: false,
    bio: "Editor konten edukasi dan teknologi dengan style clean dan cepat. Fokus pada storytelling visual yang engaging.",
    city: "Yogyakarta",
    skills: ["Video Editing", "Color Grading", "Sound Design", "Motion Graphics"],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    coverImageUrl: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1600&q=80",
    instagramUrl: "https://instagram.com/raka.creator",
    youtubeUrl: "https://youtube.com/@rakacreator",
    websiteUrl: "https://rakacreator.com",
  },
];

export function findDemoAccount(email: string, password: string): DemoAccount | null {
  const normalizedEmail = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find(
    (account) => account.email === normalizedEmail && account.password === password
  ) || null;
}

export function findDemoAccountByEmail(email: string): DemoAccount | null {
  const normalizedEmail = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((account) => account.email === normalizedEmail) || null;
}

export function findDemoAccountById(id: string): DemoAccount | null {
  return DEMO_ACCOUNTS.find((account) => account.id === id) || null;
}

export function isDemoAdmin(email?: string | null): boolean {
  if (!email) return false;
  const account = findDemoAccountByEmail(email);
  return account?.isAdmin ?? false;
}
