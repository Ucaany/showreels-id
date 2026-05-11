import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_HTML_CACHE_CONTROL =
  "public, max-age=60, s-maxage=60, stale-while-revalidate=86400";
const RESERVED_PUBLIC_SEGMENTS = new Set([
  "dashboard",
  "login",
  "register",
  "pricing",
  "settings",
  "admin",
  "api",
  "show",
  "help",
  "terms",
  "privacy",
  "billing",
  "creator",
  "profile",
  "auth",
  "about",
  "legal",
  "videos",
  "v",
  "customer-service",
  "onboarding",
  "payment",
]);

function withPublicHtmlCache(response: NextResponse) {
  response.headers.set("Cache-Control", PUBLIC_HTML_CACHE_CONTROL);
  return response;
}

const authMiddleware = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;

  const isAuthPage = nextUrl.pathname.startsWith("/auth/login");
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", nextUrl.origin);
    const callbackUrl = `${nextUrl.pathname}${nextUrl.search}` || "/dashboard";
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
}) as unknown as (req: NextRequest) => ReturnType<typeof NextResponse.next>;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const isReservedSlug = RESERVED_PUBLIC_SEGMENTS.has(firstSegment);

  if (
    pathname.startsWith("/v/") ||
    pathname.startsWith("/creator/") ||
    (!isReservedSlug && /^\/[^/]+(?:\/show)?$/.test(pathname))
  ) {
    return withPublicHtmlCache(NextResponse.next());
  }

  return authMiddleware(req);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/v/:path*",
    "/creator/:username/portfolio",
    "/:slug((?!dashboard|login|register|pricing|settings|admin|api|show|help|terms|privacy|billing|creator|profile|auth|about|legal|videos|v|customer-service|onboarding|payment|favicon\\.ico|robots\\.txt|sitemap\\.xml|site\\.webmanifest|favicon\\.svg|favicon-96x96\\.png|apple-touch-icon\\.png|_next$)[^/]+)",
    "/:slug((?!dashboard|login|register|pricing|settings|admin|api|show|help|terms|privacy|billing|creator|profile|auth|about|legal|videos|v|customer-service|onboarding|payment|favicon\\.ico|robots\\.txt|sitemap\\.xml|site\\.webmanifest|favicon\\.svg|favicon-96x96\\.png|apple-touch-icon\\.png|_next$)[^/]+)/show",
  ],
};
