import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/current-user";
import { isAdminEmail } from "@/server/admin-access";

/**
 * GET /api/dashboard/profile
 * Returns the current user's profile data for the zero-loading dashboard.
 */
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan dashboard creator." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    id: currentUser.id,
    username: currentUser.username ?? "",
    fullName: currentUser.name ?? "",
    bio: currentUser.bio ?? "",
    avatarUrl: currentUser.image ?? "",
    profileVisibility: currentUser.profileVisibility ?? "public",
    email: currentUser.email ?? "",
    contactEmail: currentUser.contactEmail ?? "",
    instagramUrl: currentUser.instagramUrl ?? "",
    youtubeUrl: currentUser.youtubeUrl ?? "",
    facebookUrl: currentUser.facebookUrl ?? "",
    threadsUrl: currentUser.threadsUrl ?? "",
    linkedinUrl: currentUser.linkedinUrl ?? "",
    websiteUrl: currentUser.websiteUrl ?? "",
  });
}
