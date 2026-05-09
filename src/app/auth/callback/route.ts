import { NextRequest, NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/safe-next-path";

/**
 * Backward-compatible OAuth callback bridge.
 *
 * Some legacy integrations still point Google OAuth redirect URI to /auth/callback.
 * Auth.js expects /api/auth/callback/google, so we forward OAuth query params there.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next") ?? "/dashboard");

  const hasOAuthParams =
    requestUrl.searchParams.has("code") || requestUrl.searchParams.has("state");

  if (hasOAuthParams) {
    const authCallbackUrl = new URL("/api/auth/callback/google", requestUrl.origin);

    requestUrl.searchParams.forEach((value, key) => {
      if (key === "next") return;
      authCallbackUrl.searchParams.set(key, value);
    });

    if (!authCallbackUrl.searchParams.has("callbackUrl")) {
      authCallbackUrl.searchParams.set("callbackUrl", nextPath);
    }

    return NextResponse.redirect(authCallbackUrl);
  }

  const loginUrl = new URL("/auth/login", requestUrl.origin);
  if (nextPath !== "/dashboard") {
    loginUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(loginUrl);
}
