import { NextRequest, NextResponse } from "next/server";
import { isCustomLinksSchemaError, summarizeError } from "@/lib/db-schema-mismatch";
import { createClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/server/auth-profile";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function getAuthSuccessUrl(destination: string, requestUrl: string) {
  const url = new URL(destination, requestUrl);
  url.searchParams.set("auth", "login");
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
          new URL("/auth/login?error=callback", request.url)
        );
      }

      try {
        const profile = await syncUserProfile(user);
        const destination = profile.role === "owner" ? "/admin" : next;

        return NextResponse.redirect(
          getAuthSuccessUrl(destination, request.url)
        );
      } catch (syncError) {
        const mismatch = isCustomLinksSchemaError(syncError);
        console.error("account_sync_failed", {
          context: mismatch ? "db_schema_mismatch" : "callback_unexpected_error",
          ...summarizeError(syncError),
          userId: user.id,
        });
        await supabase.auth.signOut();

        return NextResponse.redirect(
          new URL("/auth/login?error=account_sync", request.url)
        );
      }
    }
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=callback", request.url)
  );
}
