import { NextResponse } from "next/server";
import { onboardingSkipSchema } from "@/lib/onboarding";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getOrCreateUserOnboarding, skipUserOnboarding } from "@/server/onboarding";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan onboarding creator." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = onboardingSkipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Payload skip tidak valid." },
      { status: 400 }
    );
  }

  const onboarding = await getOrCreateUserOnboarding({
    userId: currentUser.id,
    customLinks: currentUser.customLinks,
    createdAt: currentUser.createdAt,
    profile: {
      fullName: currentUser.name,
      username: currentUser.username,
      role: currentUser.role,
      bio: currentUser.bio,
    },
  });

  const payload =
    onboarding.progressPayload && typeof onboarding.progressPayload === "object"
      ? onboarding.progressPayload
      : {};

  const status = await skipUserOnboarding(currentUser.id, {
    ...payload,
    skipReason: parsed.data.reason,
    skippedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    status,
    redirectTo: "/dashboard",
  });
}
