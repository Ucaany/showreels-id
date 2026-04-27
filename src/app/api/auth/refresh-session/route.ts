import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    return NextResponse.json(
      { error: "Failed to refresh session" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    expiresAt: data.session?.expires_at || null,
  });
}
