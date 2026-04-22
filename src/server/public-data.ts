import { and, count, desc, eq, ne, notInArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, isDatabaseConfigured } from "@/db";
import { users, videos } from "@/db/schema";
import { getAdminEmails, isAdminEmail } from "@/server/admin-access";
import { getThumbnailCandidates } from "@/lib/video-utils";

export interface PublicShowcaseVideo {
  id: string;
  title: string;
  publicSlug: string;
  description: string;
  createdAt: Date;
  sourceUrl: string;
  thumbnailUrl: string;
  outputType: string;
  durationLabel: string;
  author: {
    username: string | null;
    name: string | null;
    image: string | null;
  };
}

function sanitizeMediaUrl(url: string | null) {
  return url && url.startsWith("data:") ? "" : url;
}

function parseAdminEmails(adminEmailsCsv: string) {
  return adminEmailsCsv
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function buildCreatorFilter(adminEmails: string[]) {
  return adminEmails.length
    ? and(notInArray(users.email, adminEmails), ne(users.role, "owner"))
    : ne(users.role, "owner");
}

async function fetchCompletePublicVideos(
  adminEmailsCsv: string,
  limit: number
): Promise<PublicShowcaseVideo[]> {
  const safeLimit = Math.max(1, limit);
  const queryLimit = Math.min(Math.max(safeLimit * 4, 40), 220);

  const latestVideos = await db.query.videos.findMany({
    where: eq(videos.visibility, "public"),
    orderBy: desc(videos.createdAt),
    limit: queryLimit,
    columns: {
      id: true,
      title: true,
      publicSlug: true,
      description: true,
      createdAt: true,
      sourceUrl: true,
      thumbnailUrl: true,
      outputType: true,
      durationLabel: true,
    },
    with: {
      author: {
        columns: {
          username: true,
          name: true,
          image: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return latestVideos
    .filter((video) => {
      if (!video.author) {
        return false;
      }

      if (video.author.role === "owner" || isAdminEmail(video.author.email)) {
        return false;
      }

      const hasTitle = Boolean(video.title.trim());
      const hasDescription = Boolean(video.description.trim());
      const hasSlug = Boolean(video.publicSlug.trim());
      const hasSourceUrl = Boolean(video.sourceUrl.trim());
      const hasAuthorIdentity = Boolean(
        (video.author.name || "").trim() || (video.author.username || "").trim()
      );
      const hasThumbnailCandidate = getThumbnailCandidates(
        video.sourceUrl,
        video.thumbnailUrl
      ).length > 0;

      return (
        hasTitle &&
        hasDescription &&
        hasSlug &&
        hasSourceUrl &&
        hasAuthorIdentity &&
        hasThumbnailCandidate
      );
    })
    .slice(0, safeLimit)
    .map((video) => ({
      id: video.id,
      title: video.title,
      publicSlug: video.publicSlug,
      description: video.description,
      createdAt: video.createdAt,
      sourceUrl: video.sourceUrl,
      thumbnailUrl: sanitizeMediaUrl(video.thumbnailUrl) || "",
      outputType: video.outputType,
      durationLabel: video.durationLabel,
      author: {
        username: video.author?.username || null,
        name: video.author?.name || null,
        image: sanitizeMediaUrl(video.author?.image || null) || null,
      },
    }));
}

const landingStatsCache = unstable_cache(
  async (adminEmailsCsv: string) => {
    const adminEmails = parseAdminEmails(adminEmailsCsv);
    const creatorFilter = buildCreatorFilter(adminEmails);

    const [creatorCount] = await db
      .select({ value: count() })
      .from(users)
      .where(creatorFilter);
    const [videoCount] = await db
      .select({ value: count() })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(
        and(eq(videos.visibility, "public"), creatorFilter)
      );

    const featuredCreators = await db.query.users.findMany({
      where: creatorFilter,
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

    const featuredVideos = (await fetchCompletePublicVideos(adminEmailsCsv, 12)).slice(
      0,
      6
    );

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
  ["landing-stats-v3"],
  { revalidate: 60 }
);

const showcaseVideosCache = unstable_cache(
  async (adminEmailsCsv: string, limit: number) =>
    fetchCompletePublicVideos(adminEmailsCsv, limit),
  ["public-showcase-videos-v1"],
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

  try {
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
  } catch (error) {
    console.error("Failed to load landing stats", error);
    return {
      creatorCount: 0,
      videoCount: 0,
      featuredCreators: [],
      featuredVideos: [],
    };
  }
}

export async function getPublicShowcaseVideos(limit = 30) {
  if (!isDatabaseConfigured) {
    return [] as PublicShowcaseVideo[];
  }

  try {
    const adminEmailsCsv = Array.from(getAdminEmails()).sort().join(",");
    const cached = await showcaseVideosCache(adminEmailsCsv, limit);
    return cached.map((video) => ({
      ...video,
      createdAt: new Date(video.createdAt),
    }));
  } catch (error) {
    console.error("Failed to load public showcase videos", error);
    return [];
  }
}

export async function getPublicProfile(username: string) {
  if (!isDatabaseConfigured) {
    return null;
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user || user.role === "owner" || isAdminEmail(user.email)) {
      return null;
    }

    const profileVideos = await db.query.videos.findMany({
      where: and(eq(videos.userId, user.id), eq(videos.visibility, "public")),
      orderBy: desc(videos.createdAt),
    });

    return { user, videos: profileVideos };
  } catch (error) {
    console.error("Failed to load public profile", error);
    return null;
  }
}

export async function getPublicVideo(slug: string) {
  if (!isDatabaseConfigured) {
    return null;
  }

  try {
    const video = await db.query.videos.findFirst({
      where: and(eq(videos.publicSlug, slug), eq(videos.visibility, "public")),
      with: {
        author: true,
      },
    });

    if (
      !video ||
      video.author?.role === "owner" ||
      isAdminEmail(video.author?.email)
    ) {
      return null;
    }

    return video;
  } catch (error) {
    console.error("Failed to load public video", error);
    return null;
  }
}
