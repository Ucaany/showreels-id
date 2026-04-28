import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PRODUCTION_HOST = "showreels-id.vercel.app";
const LEGACY_HOSTS = new Set([
  "video-port-id.vercel.app",
  "videoport-id.vercel.app",
]);

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hasOauthCode = url.searchParams.has("code");
  const forwardedHeaders = new Headers(request.headers);

  forwardedHeaders.set("x-pathname", request.nextUrl.pathname);
  forwardedHeaders.set("x-search", request.nextUrl.search);

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

  return updateSession(request, forwardedHeaders);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
