import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { syncUserProfile } from "@/server/auth-profile";

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
    console.error("Failed to load authenticated Supabase user", error);
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
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}
