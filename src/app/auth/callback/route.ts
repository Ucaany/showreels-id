import { NextRequest, NextResponse } from "next/server";
import {
  isCustomLinksSchemaError,
  isUsersSchemaMismatchError,
  summarizeError,
} from "@/lib/db-schema-mismatch";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/server/admin-access";
import { syncUserProfile } from "@/server/auth-profile";
import { getOrCreateUserOnboarding } from "@/server/onboarding";

function getAuthSuccessUrl(destination: string, requestUrl: string) {
  const url = new URL(destination, requestUrl);
  url.searchParams.set("auth", "login");
  return url;
}

function makeLoginErrorUrl(
  requestUrl: string,
  errorCode: "callback" | "account_sync",
  next: string
) {
  const url = new URL("/auth/login", requestUrl);
  url.searchParams.set("error", errorCode);

  if (next !== "/dashboard") {
    url.searchParams.set("next", next);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = getSafeNextPath(request.nextUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(
          makeLoginErrorUrl(request.url, "callback", next)
        );
      }

      try {
        const profile = await syncUserProfile(user);
        let destination = profile.role === "owner" ? "/admin" : next;

        if (profile.role !== "owner") {
          const onboarding = await getOrCreateUserOnboarding({
            userId: profile.id,
            customLinks: profile.customLinks,
            createdAt: profile.createdAt,
            profile: {
              fullName: profile.name,
              username: profile.username,
              role: profile.role,
              bio: profile.bio,
            },
          });
          destination =
            onboarding.onboardingCompleted || onboarding.onboardingSkipped
              ? next
              : "/dashboard";
        }

        return NextResponse.redirect(
          getAuthSuccessUrl(destination, request.url)
        );
      } catch (syncError) {
        const mismatch =
          isCustomLinksSchemaError(syncError) || isUsersSchemaMismatchError(syncError);
        console.error("account_sync_failed", {
          context: mismatch ? "db_schema_mismatch" : "callback_unexpected_error",
          ...summarizeError(syncError),
          userId: user.id,
        });
        const fallbackDestination = isAdminEmail(user.email)
          ? "/admin"
          : "/dashboard";

        return NextResponse.redirect(
          getAuthSuccessUrl(fallbackDestination, request.url)
        );
      }
    }
  }

  return NextResponse.redirect(
    makeLoginErrorUrl(request.url, "callback", next)
  );
}
