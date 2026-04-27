import { NextResponse } from "next/server";
import { normalizeStoredLinks } from "@/lib/link-builder";
import { getCurrentUser } from "@/server/current-user";
import { getOrCreateUserOnboarding } from "@/server/onboarding";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [onboarding, entitlementState] = await Promise.all([
    getOrCreateUserOnboarding({
      userId: currentUser.id,
      customLinks: currentUser.customLinks,
      createdAt: currentUser.createdAt,
    }),
    getCreatorEntitlementsForUser(currentUser.id),
  ]);

  const links =
    typeof entitlementState.entitlements.linkBuilderMax === "number"
      ? normalizeStoredLinks(
          currentUser.customLinks,
          entitlementState.entitlements.linkBuilderMax
        )
      : normalizeStoredLinks(currentUser.customLinks);

  return NextResponse.json({
    status: onboarding,
    user: {
      id: currentUser.id,
      fullName: currentUser.name || "",
      username: currentUser.username || "",
      role: currentUser.role || "",
      bio: currentUser.bio || "",
      image: currentUser.image || "",
      coverImageUrl: currentUser.coverImageUrl || "",
    },
    links,
    linkBuilderMax: entitlementState.entitlements.linkBuilderMax,
    planName: entitlementState.effectivePlan.planName,
  });
}
