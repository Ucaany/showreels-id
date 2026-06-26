import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

const BAD_BOTS = [
  "ahrefsbot", "semrushbot", "dotbot", "mj12bot", "blexbot",
  "petalbot", "bytespider", "gptbot", "ccbot", "claudebot",
  "anthropic-ai", "cohere-ai", "scrapy", "python-requests",
  "curl/", "wget/", "libwww-perl", "go-http-client",
];

const CANONICAL_HOSTS = new Set([
  "showreels.id",
  "www.showreels.id",
]);

const PHISHING_UA_PATTERNS = [
  "zgrab", "masscan", "nikto", "nmap", "sqlmap", "dirbuster",
  "nuclei", "hydra", "metasploit", "burpsuite", "w3af",
];

function isBadBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BAD_BOTS.some((bot) => lower.includes(bot));
}

function isPhishingUA(ua: string): boolean {
  const lower = ua.toLowerCase();
  return PHISHING_UA_PATTERNS.some((p) => lower.includes(p));
}

function isHostSpoofing(req: NextRequest): boolean {
  const host = req.headers.get("host") || "";
  const normalizedHost = host.split(":")[0].toLowerCase();
  if (
    !CANONICAL_HOSTS.has(normalizedHost) &&
    !normalizedHost.endsWith(".vercel.app") &&
    normalizedHost !== "localhost"
  ) {
    return true;
  }
  return false;
}

function isSuspiciousReferer(req: NextRequest): boolean {
  const referer = req.headers.get("referer") || "";
  if (!referer) return false;
  try {
    const refUrl = new URL(referer);
    const refHost = refUrl.hostname.toLowerCase();
    if (
      refHost.includes("showreels") &&
      !CANONICAL_HOSTS.has(refHost) &&
      !refHost.endsWith(".vercel.app")
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function isRateLimited(ip: string): boolean {
  const result = checkRateLimit("middleware", ip, {
    maxRequests: 120,
    windowMs: 60_000,
  });
  return !result.success;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

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

const { auth } = NextAuth(authConfig);

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
  const ua = req.headers.get("user-agent") || "";
  const ip = getClientIp(req);

  if (isHostSpoofing(req)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  if (isSuspiciousReferer(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (isBadBot(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (isPhishingUA(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (isRateLimited(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const isReservedSlug = RESERVED_PUBLIC_SEGMENTS.has(firstSegment);

  if (
    pathname.startsWith("/v/") ||
    pathname.startsWith("/creator/") ||
    (!isReservedSlug && /^\/[^/]+(?:\/show)?$/.test(pathname))
  ) {
    return withPublicHtmlCache(addSecurityHeaders(NextResponse.next()));
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
