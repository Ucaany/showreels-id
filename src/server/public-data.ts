import { and, count, desc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { users, videos } from "@/db/schema";

export async function getLandingStats() {
  if (!isDatabaseConfigured) {
    return {
      creatorCount: 0,
      videoCount: 0,
      featuredCreators: [],
      featuredVideos: [],
    };
  }

  const [creatorCount] = await db.select({ value: count() }).from(users);
  const [videoCount] = await db
    .select({ value: count() })
    .from(videos)
    .where(eq(videos.visibility, "public"));

  const featuredCreators = await db.query.users.findMany({
    where: undefined,
    orderBy: desc(users.createdAt),
    limit: 3,
  });

  const featuredVideos = await db.query.videos.findMany({
    where: eq(videos.visibility, "public"),
    orderBy: desc(videos.createdAt),
    limit: 3,
    with: {
      author: true,
    },
  });

  return {
    creatorCount: creatorCount?.value ?? 0,
    videoCount: videoCount?.value ?? 0,
    featuredCreators,
    featuredVideos,
  };
}

export async function getPublicProfile(username: string) {
  if (!isDatabaseConfigured) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return null;
  }

  const profileVideos = await db.query.videos.findMany({
    where: and(eq(videos.userId, user.id), eq(videos.visibility, "public")),
    orderBy: desc(videos.createdAt),
  });

  return { user, videos: profileVideos };
}

export async function getPublicVideo(slug: string) {
  if (!isDatabaseConfigured) {
    return null;
  }

  const video = await db.query.videos.findFirst({
    where: and(eq(videos.publicSlug, slug), eq(videos.visibility, "public")),
    with: {
      author: true,
    },
  });

  return video ?? null;
}
