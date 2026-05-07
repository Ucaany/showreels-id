import { NextResponse } from "next/server";
import { DEMO_MODE } from "@/lib/demo-mode";
import { clearDemoSession } from "@/lib/demo-session";

export async function POST() {
  if (!DEMO_MODE) {
    return NextResponse.json(
      { error: "Demo mode is not enabled." },
      { status: 403 }
    );
  }

  await clearDemoSession();

  return NextResponse.json({ ok: true, redirectTo: "/auth/login" });
}
