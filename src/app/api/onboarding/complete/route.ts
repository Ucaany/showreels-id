import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { onboardingCompleteSchema } from "@/lib/onboarding";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import {
  completeUserOnboarding,
  getOrCreateUserOnboarding,
  updateUserOnboardingProgress,
} from "@/server/onboarding";

function hasMinimalPublicProfile(input: {
  fullName?: string;
  username?: string;
  role?: string;
  bio?: string;
}) {
  const fullName = (input.fullName || "").trim();
  const username = (input.username || "").trim();
  const role = (input.role || "").trim();
  const bio = (input.bio || "").trim();

  return Boolean(fullName && username && (role || bio));
}

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
  const parsed = onboardingCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Payload complete tidak valid." },
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

  const linksCount = Array.isArray(currentUser.customLinks)
    ? currentUser.customLinks.length
    : 0;
  const videoRows = await db
    .select({ value: count() })
    .from(videos)
    .where(eq(videos.userId, currentUser.id));
  const videoCount = Number(videoRows[0]?.value ?? 0);

  const status = await completeUserOnboarding(currentUser.id, {
    ...(onboarding.progressPayload && typeof onboarding.progressPayload === "object"
      ? onboarding.progressPayload
      : {}),
    completedAt: new Date().toISOString(),
  });

  await updateUserOnboardingProgress({
    userId: currentUser.id,
    onboardingSkipped: false,
    firstLinkCreated: linksCount > 0 || onboarding.firstLinkCreated,
    firstVideoUploaded:
      parsed.data.firstVideoUploaded ||
      onboarding.firstVideoUploaded ||
      videoCount > 0,
    hasPublicProfile: hasMinimalPublicProfile({
      fullName: currentUser.name || "",
      username: currentUser.username || "",
      role: currentUser.role || "",
      bio: currentUser.bio || "",
    }),
  });

  return NextResponse.json({
    ok: true,
    status,
    redirectTo:
      parsed.data.goTo === "build-link"
        ? "/dashboard/link-builder"
        : "/dashboard",
  });
}
