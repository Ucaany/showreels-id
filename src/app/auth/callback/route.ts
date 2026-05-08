import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy Supabase OAuth callback route.
 * With Auth.js, OAuth callbacks are handled by /api/auth/[...nextauth].
 * This route now simply redirects to the login page.
 */
export async function GET(request: NextRequest) {
  const url = new URL("/auth/login", request.url);
  return NextResponse.redirect(url);
}
