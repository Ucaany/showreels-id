import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/server/auth-profile";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await syncUserProfile(user);

    if (profile.isBlocked) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          code: "account_blocked",
          error: "Akun ini sedang diblokir dan belum bisa digunakan.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      redirectTo: profile.role === "owner" ? "/admin" : "/dashboard",
    });
  } catch (syncError) {
    console.error("Failed to sync signed-in user profile", syncError);
    await supabase.auth.signOut();

    return NextResponse.json(
      {
        code: "account_sync_failed",
        error:
          "Login berhasil, tetapi profil akun belum bisa disiapkan. Coba lagi beberapa saat.",
      },
      { status: 503 }
    );
  }
}
