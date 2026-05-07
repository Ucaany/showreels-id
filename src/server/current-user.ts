import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createFallbackAuthProfile, syncUserProfile } from "@/server/auth-profile";
import { DEMO_MODE } from "@/lib/demo-mode";
import { getDemoSessionUser } from "@/lib/demo-session";
import type { DbUser } from "@/db/schema";

function isMissingAuthSessionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : "";
  const name =
    typeof (error as { name?: unknown }).name === "string"
      ? (error as { name: string }).name
      : "";

  return (
    name === "AuthSessionMissingError" ||
    message.toLowerCase().includes("auth session missing")
  );
}

export async function getCurrentAuthUser() {
  if (DEMO_MODE) {
    const demoAccount = await getDemoSessionUser();
    if (demoAccount) {
      return {
        id: demoAccount.id,
        email: demoAccount.email,
        user_metadata: {
          full_name: demoAccount.name,
          username: demoAccount.username,
        },
      };
    }
    return null;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (!isMissingAuthSessionError(error)) {
      console.error("Failed to load authenticated Supabase user", error);
    }
    return null;
  }

  return user ?? null;
}

function buildDemoDbUser(demoAccount: NonNullable<Awaited<ReturnType<typeof getDemoSessionUser>>>): DbUser {
  return {
    id: demoAccount.id,
    email: demoAccount.email,
    name: demoAccount.name,
    username: demoAccount.username,
    role: demoAccount.role,
    image: demoAccount.avatarUrl,
    coverImageUrl: demoAccount.coverImageUrl,
    avatarCropX: 0,
    avatarCropY: 0,
    avatarCropZoom: 100,
    coverCropX: 0,
    coverCropY: 0,
    coverCropZoom: 100,
    bio: demoAccount.bio,
    experience: "5+ tahun pengalaman di industri kreatif.",
    birthDate: "1995-06-15",
    city: demoAccount.city,
    address: `${demoAccount.city}, Indonesia`,
    contactEmail: demoAccount.email,
    phoneNumber: "+628120000001",
    websiteUrl: demoAccount.websiteUrl,
    instagramUrl: demoAccount.instagramUrl,
    youtubeUrl: demoAccount.youtubeUrl,
    facebookUrl: "",
    threadsUrl: "",
    linkedinUrl: "",
    customLinks: [],
    linkBuilderDraft: [],
    linkBuilderPublishedAt: null,
    profileVisibility: "public",
    skills: demoAccount.skills,
    isBlocked: false,
    blockedAt: null,
    blockedReason: "",
    usernameChangeCount: 0,
    usernameChangeWindowStart: null,
    locale: "id",
    prefersDarkMode: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date(),
  } as unknown as DbUser;
}

export async function getCurrentUser() {
  if (DEMO_MODE) {
    const demoAccount = await getDemoSessionUser();
    if (!demoAccount) return null;
    return buildDemoDbUser(demoAccount);
  }

  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return null;
  }

  try {
    const user = await syncUserProfile(authUser);
    return user.isBlocked ? null : user;
  } catch (error) {
    console.error("Failed to load current user", error);
    return createFallbackAuthProfile(authUser);
  }
}

async function getNextPathFromRequest() {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") || "";
  const search = requestHeaders.get("x-search") || "";

  return getSafeNextPath(`${pathname}${search}`, "/dashboard");
}

export async function requireCurrentUser(options?: { nextPath?: string }) {
  const user = await getCurrentUser();
  if (!user) {
    const nextPath = options?.nextPath
      ? getSafeNextPath(options.nextPath, "/dashboard")
      : await getNextPathFromRequest();
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
