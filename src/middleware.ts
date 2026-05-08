import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRODUCTION_HOST = "showreels.id";
const LEGACY_HOSTS = new Set([
  "video-port-id.vercel.app",
  "videoport-id.vercel.app",
  "showreels-id.vercel.app",
]);

/**
 * Routes yang merupakan webhook/callback dari pihak ketiga.
 * Route ini harus di-skip dari middleware (tidak perlu session, tidak boleh redirect).
 */
const WEBHOOK_ROUTES = new Set([
  "/api/billing/tripay/callback",
  "/api/billing/midtrans/webhook",
]);

export default auth((req) => {
  const url = req.nextUrl.clone();

  // Skip middleware sepenuhnya untuk webhook/callback routes
  if (WEBHOOK_ROUTES.has(url.pathname)) {
    return NextResponse.next();
  }

  // Forward headers for downstream usage
  const response = NextResponse.next();
  response.headers.set("x-pathname", req.nextUrl.pathname);
  response.headers.set("x-search", req.nextUrl.search);

  // Legacy host redirect
  if (LEGACY_HOSTS.has(url.hostname)) {
    url.hostname = PRODUCTION_HOST;
    return NextResponse.redirect(url);
  }

  // Protected route check - redirect to login if not authenticated
  const isAuthenticated = !!req.auth?.user;
  const protectedPrefixes = ["/dashboard", "/admin", "/onboarding"];
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    url.pathname.startsWith(prefix)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("next", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/billing/tripay/callback|api/billing/midtrans/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
