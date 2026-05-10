import { NextResponse } from "next/server";
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
import {
  rateLimiters,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";
import { queueEmail } from "@/lib/email";

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIp(request);
  const rateLimit = rateLimiters.bootstrap(ip);
  if (!rateLimit.success) {
    return rateLimitExceededResponse(rateLimit);
  }

  const { searchParams } = new URL(request.url);
  const next = getSafeNextPath(searchParams.get("next"));
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await syncUserProfile(user);

    if (profile.isBlocked) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          code: "account_blocked",
          error: "Akun ini sedang diblokir dan belum bisa digunakan.",
        },
        { status: 403 }
      );
    }

    // Detect new user signup: createdAt within last 60 seconds = new user
    const isNewUser =
      profile.createdAt &&
      Date.now() - new Date(profile.createdAt).getTime() < 60_000;

    // Fire-and-forget welcome email for new users
    if (isNewUser && profile.email) {
      const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://showreels.id";
      void queueEmail({
        userId: profile.id,
        recipientEmail: profile.email,
        template: {
          type: "welcome",
          data: {
            userName: profile.name || "Creator",
            dashboardUrl: `${appOrigin}/dashboard`,
          },
        },
      });
    }

    // Owner gets fast redirect - no onboarding check needed
    if (profile.role === "owner") {
      return NextResponse.json({
        ok: true,
        redirectTo: "/admin",
      });
    }

    // Non-blocking onboarding check - run in background if possible
    // but we need the result for redirect decision
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

    const redirectTo =
      onboarding.onboardingCompleted || onboarding.onboardingSkipped
        ? next
        : "/dashboard";

    return NextResponse.json({
      ok: true,
      redirectTo,
    });
  } catch (syncError) {
    const mismatch =
      isCustomLinksSchemaError(syncError) || isUsersSchemaMismatchError(syncError);
    console.error("account_sync_failed", {
      context: mismatch ? "db_schema_mismatch" : "unexpected_error",
      ...summarizeError(syncError),
      userId: user.id,
    });
    const fallbackOwner = isAdminEmail(user.email);
    const fallbackRedirect = fallbackOwner ? "/admin" : "/dashboard";

    return NextResponse.json({
      ok: true,
      redirectTo: fallbackRedirect,
      degradedSync: true,
      warning: mismatch
        ? "Sinkronisasi schema akun belum lengkap, diarahkan ke dashboard aman."
        : "Profil sedang disiapkan, diarahkan ke dashboard aman.",
    });
  }
}
