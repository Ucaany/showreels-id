import { cookies } from "next/headers";
import {
  DEMO_COOKIE_NAME,
  DEMO_MODE,
  findDemoAccountById,
  type DemoAccount,
} from "@/lib/demo-mode";

/**
 * Get the current demo session user from cookies.
 * Returns null if no demo session exists.
 */
export async function getDemoSessionUser(): Promise<DemoAccount | null> {
  if (!DEMO_MODE) return null;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(DEMO_COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  try {
    const parsed = JSON.parse(sessionCookie.value) as { userId?: string };
    if (!parsed.userId) return null;
    return findDemoAccountById(parsed.userId);
  } catch {
    return null;
  }
}

/**
 * Set demo session cookie after successful login.
 */
export async function setDemoSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE_NAME, JSON.stringify({ userId }), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear demo session cookie (logout).
 */
export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE_NAME);
}
