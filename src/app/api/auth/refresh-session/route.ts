import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  // With Auth.js JWT strategy, sessions don't need manual refresh.
  // The JWT is automatically refreshed on each request by the Auth.js middleware.
  // This endpoint validates the current session is still active.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    expiresAt: session.expires ? new Date(session.expires).getTime() / 1000 : null,
  });
}
