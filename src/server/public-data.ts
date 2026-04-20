import { and, count, desc, eq, notInArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, isDatabaseConfigured } from "@/db";
import { users, videos } from "@/db/schema";
import { getAdminEmails, isAdminEmail } from "@/server/admin-access";

const landingStatsCache = unstable_cache(
  async (adminEmailsCsv: string) => {
    const sanitizeMediaUrl = (url: string | null) =>
      url && url.startsWith("data:") ? "" : url;
    const adminEmails = adminEmailsCsv
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const hideOwner = adminEmails.length > 0;

    const [creatorCount] = await db
      .select({ value: count() })
      .from(users)
      .where(hideOwner ? notInArray(users.email, adminEmails) : undefined);
    const [videoCount] = await db
      .select({ value: count() })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(
        hideOwner
          ? and(eq(videos.visibility, "public"), notInArray(users.email, adminEmails))
          : eq(videos.visibility, "public")
      );

    const featuredCreators = await db.query.users.findMany({
      where: hideOwner ? notInArray(users.email, adminEmails) : undefined,
      orderBy: desc(users.createdAt),
      limit: 3,
      columns: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        city: true,
        createdAt: true,
      },
    });

    const latestVideos = await db.query.videos.findMany({
      where: eq(videos.visibility, "public"),
      orderBy: desc(videos.createdAt),
      limit: 15,
      columns: {
        id: true,
        title: true,
        publicSlug: true,
        description: true,
        createdAt: true,
        sourceUrl: true,
        thumbnailUrl: true,
      },
      with: {
        author: {
          columns: {
            username: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });
    const featuredVideos = latestVideos
      .filter((video) => !isAdminEmail(video.author?.email))
      .slice(0, 3)
      .map((video) => ({
        ...video,
        thumbnailUrl: sanitizeMediaUrl(video.thumbnailUrl) || "",
        author: video.author
          ? {
              ...video.author,
              image: sanitizeMediaUrl(video.author.image) || null,
            }
          : video.author,
      }));

    return {
      creatorCount: creatorCount?.value ?? 0,
      videoCount: videoCount?.value ?? 0,
      featuredCreators: featuredCreators.map((creator) => ({
        ...creator,
        image: sanitizeMediaUrl(creator.image) || null,
      })),
      featuredVideos,
    };
  },
  ["landing-stats-v2"],
  { revalidate: 60 }
);

export async function getLandingStats() {
  if (!isDatabaseConfigured) {
    return {
      creatorCount: 0,
      videoCount: 0,
      featuredCreators: [],
      featuredVideos: [],
    };
  }

  const adminEmailsCsv = Array.from(getAdminEmails()).sort().join(",");
  const cached = await landingStatsCache(adminEmailsCsv);
  return {
    ...cached,
    featuredCreators: cached.featuredCreators.map((creator) => ({
      ...creator,
      createdAt: new Date(creator.createdAt),
    })),
    featuredVideos: cached.featuredVideos.map((video) => ({
      ...video,
      createdAt: new Date(video.createdAt),
    })),
  };
}

export async function getPublicProfile(username: string) {
  if (!isDatabaseConfigured) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user || isAdminEmail(user.email)) {
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

  if (!video || isAdminEmail(video.author?.email)) {
    return null;
  }

  return video;
}
