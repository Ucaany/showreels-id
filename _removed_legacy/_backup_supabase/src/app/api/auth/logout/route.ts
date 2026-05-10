import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/demo-mode";
import { clearDemoSession } from "@/lib/demo-session";

export async function POST() {
  if (DEMO_MODE) {
    await clearDemoSession();
    return NextResponse.json({ ok: true });
  }

  // Fire-and-forget: respond immediately, sign out in background
  // Client clears local state instantly, server-side signout happens async
  const supabase = await createClient();

  // Don't await - let it run in background
  void supabase.auth.signOut().catch((err) => {
    console.error("Background signOut error (non-blocking):", err);
  });

  return NextResponse.json({ ok: true });
}
