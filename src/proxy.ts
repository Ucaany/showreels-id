import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PRODUCTION_HOST = "video-port-id.vercel.app";
const LEGACY_HOSTS = new Set(["videoport-id.vercel.app"]);

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hasOauthCode = url.searchParams.has("code");

  if (LEGACY_HOSTS.has(url.hostname)) {
    url.hostname = PRODUCTION_HOST;

    if (url.pathname === "/" && hasOauthCode) {
      url.pathname = "/auth/callback";
    }

    return NextResponse.redirect(url);
  }

  if (url.pathname === "/" && hasOauthCode) {
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
