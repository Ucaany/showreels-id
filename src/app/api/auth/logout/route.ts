import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/demo-mode";
import { clearDemoSession } from "@/lib/demo-session";

export async function POST() {
  if (DEMO_MODE) {
    await clearDemoSession();
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
