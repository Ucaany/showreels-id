import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { videos } from "@/db/schema";
import { getCurrentUser } from "@/server/current-user";
import { isAdminEmail } from "@/server/admin-access";

/**
 * GET /api/dashboard/videos
 * Returns the current user's videos for the zero-loading dashboard.
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

  if (!isDatabaseConfigured) {
    return NextResponse.json({ videos: [] });
  }

  const myVideos = await db.query.videos.findMany({
    where: eq(videos.userId, currentUser.id),
    orderBy: desc(videos.createdAt),
    columns: {
      id: true,
      title: true,
      sourceUrl: true,
      visibility: true,
      thumbnailUrl: true,
      createdAt: true,
      source: true,
      publicSlug: true,
      tags: true,
    },
    limit: 50,
  });

  return NextResponse.json({ videos: myVideos });
}
