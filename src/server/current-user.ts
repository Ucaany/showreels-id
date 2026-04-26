import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createFallbackAuthProfile, syncUserProfile } from "@/server/auth-profile";

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

export async function getCurrentUser() {
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
