import { and, count, desc, eq, ne, notInArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, isDatabaseConfigured } from "@/db";
import { billingSubscriptions, creatorSettings, users, videos } from "@/db/schema";
import { normalizeCustomLinks } from "@/lib/profile-utils";
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

function isEntitledSubscriptionStatus(status: string | null | undefined) {
  return status === "active" || status === "trial";
}

async function isWhitelabelActiveForUser(userId: string) {
  const [settings, subscription] = await Promise.all([
    db.query.creatorSettings.findFirst({
      where: eq(creatorSettings.userId, userId),
      columns: {
        whitelabelEnabled: true,
      },
    }),
    db.query.billingSubscriptions.findFirst({
      where: eq(billingSubscriptions.userId, userId),
      columns: {
        planName: true,
        status: true,
      },
    }),
  ]);

  return Boolean(
    settings?.whitelabelEnabled &&
      subscription?.planName === "business" &&
      isEntitledSubscriptionStatus(subscription?.status)
  );
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
  const visibilityFilter = eq(users.profileVisibility, "public");
  return adminEmails.length
    ? and(
        notInArray(users.email, adminEmails),
        ne(users.role, "owner"),
        visibilityFilter
      )
    : and(ne(users.role, "owner"), visibilityFilter);
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
          profileVisibility: true,
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
      if (video.author.profileVisibility !== "public") {
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

export async function getPublicProfile(
  username: string,
  viewerUserId?: string | null
) {
  if (!isDatabaseConfigured) {
    return null;
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatarCropX: true,
        avatarCropY: true,
        avatarCropZoom: true,
        coverImageUrl: true,
        coverCropX: true,
        coverCropY: true,
        coverCropZoom: true,
        username: true,
        role: true,
        bio: true,
        experience: true,
        city: true,
        contactEmail: true,
        phoneNumber: true,
        websiteUrl: true,
        instagramUrl: true,
        youtubeUrl: true,
        facebookUrl: true,
        threadsUrl: true,
        customLinks: true,
        profileVisibility: true,
        skills: true,
        createdAt: true,
      },
    });

    if (!user || user.role === "owner" || isAdminEmail(user.email)) {
      return null;
    }

    const isOwner = Boolean(viewerUserId && viewerUserId === user.id);
    if (user.profileVisibility === "private" && !isOwner) {
      return null;
    }

    const profileVideos = await db.query.videos.findMany({
      where: and(eq(videos.userId, user.id), eq(videos.visibility, "public")),
      orderBy: desc(videos.createdAt),
      columns: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        thumbnailUrl: true,
        extraVideoUrls: true,
        imageUrls: true,
        sourceUrl: true,
        source: true,
        aspectRatio: true,
        outputType: true,
        durationLabel: true,
        publicSlug: true,
        createdAt: true,
      },
    });

    return {
      user: {
        ...user,
        customLinks: normalizeCustomLinks(user.customLinks),
      },
      videos: profileVideos,
      whitelabelEnabled: await isWhitelabelActiveForUser(user.id),
    };
  } catch (error) {
    console.error("Failed to load public profile", error);
    return null;
  }
}

export async function getPublicVideo(slug: string, viewerUserId?: string | null) {
  if (!isDatabaseConfigured) {
    return null;
  }

  try {
    const video = await db.query.videos.findFirst({
      where: eq(videos.publicSlug, slug),
      columns: {
        id: true,
        userId: true,
        title: true,
        description: true,
        tags: true,
        visibility: true,
        thumbnailUrl: true,
        extraVideoUrls: true,
        imageUrls: true,
        sourceUrl: true,
        source: true,
        aspectRatio: true,
        outputType: true,
        durationLabel: true,
        publicSlug: true,
        createdAt: true,
      },
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatarCropX: true,
            avatarCropY: true,
            avatarCropZoom: true,
            username: true,
            role: true,
            bio: true,
            city: true,
            contactEmail: true,
            phoneNumber: true,
            websiteUrl: true,
            instagramUrl: true,
            youtubeUrl: true,
            facebookUrl: true,
            threadsUrl: true,
            customLinks: true,
            profileVisibility: true,
          },
        },
      },
    });

    if (
      !video ||
      video.author?.role === "owner" ||
      isAdminEmail(video.author?.email)
    ) {
      return null;
    }

    const isOwner = Boolean(viewerUserId && viewerUserId === video.author.id);
    if (video.author.profileVisibility === "private" && !isOwner) {
      return null;
    }

    if (video.visibility === "draft" || video.visibility === "private") {
      return isOwner ? video : null;
    }

    return {
      ...video,
      author: {
        ...video.author,
        customLinks: normalizeCustomLinks(video.author.customLinks),
      },
      whitelabelEnabled: await isWhitelabelActiveForUser(video.author.id),
    };
  } catch (error) {
    console.error("Failed to load public video", error);
    return null;
  }
}
