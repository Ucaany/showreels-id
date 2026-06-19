import { NextResponse } from "next/server";
import { DEMO_MODE } from "@/lib/demo-mode";
import { clearDemoSession } from "@/lib/demo-session";

export async function POST() {
  if (DEMO_MODE) {
    await clearDemoSession();
    return NextResponse.json({ ok: true });
  }

  // With Auth.js, the client calls signOut() from next-auth/react which
  // handles session invalidation via the [...nextauth] route handler.
  // This endpoint exists for backward compatibility and demo mode support.
  return NextResponse.json({ ok: true });
}
