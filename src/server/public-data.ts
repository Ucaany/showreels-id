import { and, count, desc, eq, ne, notInArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, isDatabaseConfigured } from "@/db";
import { creatorSettings, users, videos } from "@/db/schema";
import { normalizeCustomLinks } from "@/lib/profile-utils";
import { isLinkedinSchemaError, isVideoPinSchemaError, summarizeError } from "@/lib/db-schema-mismatch";
import { getAdminEmails, isAdminEmail } from "@/server/admin-access";
import { isMissingBillingSchemaError } from "@/server/database-errors";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";
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

async function isBusinessPlanActiveForUser(userId: string) {
  try {
    const entitlementState = await getCreatorEntitlementsForUser(userId);
    return entitlementState.effectivePlan.planName === "business";
  } catch (error) {
    console.error("[isBusinessPlanActiveForUser] Failed, defaulting to false:", error);
    return false;
  }
}

async function isWhitelabelActiveForUser(userId: string) {
  try {
    const [settings, entitlementState] = await Promise.all([
      db.query.creatorSettings.findFirst({
        where: eq(creatorSettings.userId, userId),
        columns: {
          whitelabelEnabled: true,
        },
      }),
      getCreatorEntitlementsForUser(userId),
    ]);

    return Boolean(
      settings?.whitelabelEnabled && entitlementState.entitlements.whitelabelEnabled
    );
  } catch (error) {
    console.error("[isWhitelabelActiveForUser] Failed, defaulting to false:", error);
    return false;
  }
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

const publicProfileUserColumns = {
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
} as const;

const publicVideoAuthorColumns = {
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
} as const;

async function findPublicUserByUsernameRaw(username: string) {
  try {
    return await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: {
        ...publicProfileUserColumns,
        linkedinUrl: true,
      },
    });
  } catch (error) {
    if (!isLinkedinSchemaError(error)) {
      console.error("[findPublicUserByUsernameRaw] Query failed:", error);
      return undefined;
    }

    console.warn("db_schema_mismatch public profile without linkedin_url", {
      username,
      ...summarizeError(error),
    });

    try {
      const fallback = await db.query.users.findFirst({
        where: eq(users.username, username),
        columns: publicProfileUserColumns,
      });

      if (!fallback) {
        return fallback;
      }

      return {
        ...fallback,
        linkedinUrl: "",
      };
    } catch (fallbackError) {
      console.error("[findPublicUserByUsernameRaw] Fallback query also failed:", fallbackError);
      return undefined;
    }
  }
}

/**
 * Cached version of findPublicUserByUsername
 * Revalidate setiap 60 detik — menghemat DB reads untuk profil populer
 */
const findPublicUserByUsername = unstable_cache(
  findPublicUserByUsernameRaw,
  ["public-user-by-username"],
  { revalidate: 60 }
);

async function findPublicVideoBySlug(slug: string) {
  try {
    return await db.query.videos.findFirst({
      where: eq(videos.publicSlug, slug),
      columns: {
        id: true,
        userId: true,
        title: true,
        description: true,
        tags: true,
        visibility: true,
        thumbnailUrl: true,
        previewImage: true,
        previewType: true,
        mediaType: true,
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
            ...publicVideoAuthorColumns,
            linkedinUrl: true,
          },
        },
      },
    });
  } catch (error) {
    if (!isLinkedinSchemaError(error)) {
      console.error("[findPublicVideoBySlug] Query failed:", error);
      return undefined;
    }

    console.warn("db_schema_mismatch public video without linkedin_url", {
      slug,
      ...summarizeError(error),
    });

    try {
      const fallback = await db.query.videos.findFirst({
        where: eq(videos.publicSlug, slug),
        columns: {
          id: true,
          userId: true,
          title: true,
          description: true,
          tags: true,
          visibility: true,
          thumbnailUrl: true,
          previewImage: true,
          previewType: true,
          mediaType: true,
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
            columns: publicVideoAuthorColumns,
          },
        },
      });

      if (!fallback?.author) {
        return fallback;
      }

      return {
        ...fallback,
        author: {
          ...fallback.author,
          linkedinUrl: "",
        },
      };
    } catch (fallbackError) {
      console.error("[findPublicVideoBySlug] Fallback query also failed:", fallbackError);
      return undefined;
    }
  }
}

async function fetchCompletePublicVideos(
  adminEmailsCsv: string,
  limit: number
): Promise<PublicShowcaseVideo[]> {
  const safeLimit = Math.max(1, limit);
  const queryLimit = Math.min(Math.max(safeLimit * 4, 40), 220);

  try {
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
  } catch (error) {
    console.error("[fetchCompletePublicVideos] DB query failed:", error);
    return [];
  }
}

const landingStatsCache = unstable_cache(
  async (adminEmailsCsv: string) => {
    try {
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

      return {
        creatorCount: creatorCount?.value ?? 0,
        videoCount: videoCount?.value ?? 0,
        featuredCreators: featuredCreators.map((creator) => ({
          ...creator,
          image: sanitizeMediaUrl(creator.image) || null,
        })),
      };
    } catch (error) {
      console.error("[landingStatsCache] DB query failed:", error);
      return { creatorCount: 0, videoCount: 0, featuredCreators: [] as Array<{ id: string; name: string | null; username: string | null; image: string | null; bio: string | null; city: string | null; createdAt: Date }> };
    }
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
    };
  } catch (error) {
    console.error("Failed to load landing stats", error);
    return {
      creatorCount: 0,
      videoCount: 0,
      featuredCreators: [],
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
  viewerUserId?: string | null,
  options?: {
    page?: number;
    pageSize?: number;
  }
) {
  if (!isDatabaseConfigured) {
    return null;
  }

  try {
    const user = await findPublicUserByUsername(username);

    if (!user || user.role === "owner" || isAdminEmail(user.email)) {
      return null;
    }

    const isOwner = Boolean(viewerUserId && viewerUserId === user.id);
    if (user.profileVisibility === "private" && !isOwner) {
      return null;
    }

    const videoColumns = {
      id: true,
      title: true,
      description: true,
      visibility: true,
      pinnedToProfile: true,
      pinnedOrder: true,
      thumbnailUrl: true,
      previewImage: true,
      previewType: true,
      mediaType: true,
      extraVideoUrls: true,
      imageUrls: true,
      sourceUrl: true,
      source: true,
      aspectRatio: true,
      outputType: true,
      durationLabel: true,
      publicSlug: true,
      createdAt: true,
    } as const;

    const videoWhere = and(eq(videos.userId, user.id), eq(videos.visibility, "public"));
    const safePageSize = Math.min(24, Math.max(6, options?.pageSize ?? 12));
    const safePage = Math.max(1, options?.page ?? 1);
    const offset = (safePage - 1) * safePageSize;

    const totalVideosRows = await db
      .select({ value: count() })
      .from(videos)
      .where(videoWhere);
    const totalVideos = totalVideosRows[0]?.value ?? 0;

    const profileVideos = await db.query.videos
      .findMany({
        where: videoWhere,
        orderBy: desc(videos.createdAt),
        columns: videoColumns,
        limit: safePageSize,
        offset,
      })
      .catch(async (error) => {
        if (!isVideoPinSchemaError(error)) {
          console.error("[getPublicProfile] Video query failed:", error);
          return [];
        }

        console.warn("db_schema_mismatch public profile without video pin columns", {
          username,
          ...summarizeError(error),
        });

        try {
          const fallbackVideos = await db.query.videos.findMany({
            where: videoWhere,
            orderBy: desc(videos.createdAt),
            columns: {
              ...videoColumns,
              pinnedToProfile: false,
              pinnedOrder: false,
            },
          });

          return fallbackVideos.map((video) => ({
            ...video,
            pinnedToProfile: false,
            pinnedOrder: 0,
          }));
        } catch (fallbackError) {
          console.error("[getPublicProfile] Fallback video query also failed:", fallbackError);
          return [];
        }
      });

    const pinnedVideos = await db.query.videos
      .findMany({
        where: and(videoWhere, eq(videos.pinnedToProfile, true)),
        orderBy: desc(videos.createdAt),
        columns: videoColumns,
        limit: 20,
      })
      .then((items) =>
        items
          .filter((video) => video.pinnedToProfile)
          .sort((a, b) => (a.pinnedOrder || 999) - (b.pinnedOrder || 999))
          .slice(0, 3)
      )
      .catch(() => []);

    const [whitelabelEnabled, businessPlanActive] = await Promise.all([
      isWhitelabelActiveForUser(user.id),
      isBusinessPlanActiveForUser(user.id),
    ]);

    return {
      user: {
        ...user,
        customLinks: normalizeCustomLinks(user.customLinks),
      },
      videos: profileVideos,
      pinnedVideos,
      totalVideos,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(totalVideos / safePageSize)),
      hasNextPage: safePage * safePageSize < totalVideos,
      hasPreviousPage: safePage > 1,
      whitelabelEnabled,
      businessPlanActive,
      isOwner,
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
    const video = await findPublicVideoBySlug(slug);
    const normalizedVideo =
      video && video.author
        ? {
            ...video,
            author: {
              ...video.author,
              linkedinUrl:
                "linkedinUrl" in video.author &&
                typeof video.author.linkedinUrl === "string"
                  ? video.author.linkedinUrl
                  : "",
            },
          }
        : video;

    if (
      !normalizedVideo ||
      normalizedVideo.author?.role === "owner" ||
      isAdminEmail(normalizedVideo.author?.email)
    ) {
      return null;
    }

    const isOwner = Boolean(
      viewerUserId && viewerUserId === normalizedVideo.author.id
    );
    if (normalizedVideo.author.profileVisibility === "private" && !isOwner) {
      return null;
    }

    const isPrivateLikeVisibility =
      normalizedVideo.visibility === "draft" ||
      normalizedVideo.visibility === "private" ||
      normalizedVideo.visibility === "semi_private";

    if (isPrivateLikeVisibility && !isOwner) {
      return null;
    }

    const siblingVideos = await db.query.videos.findMany({
      where: and(
        eq(videos.userId, normalizedVideo.author.id),
        eq(videos.visibility, "public")
      ),
      orderBy: desc(videos.createdAt),
      columns: {
        publicSlug: true,
      },
      limit: 500,
    });

    const slugList = siblingVideos
      .map((item) => item.publicSlug)
      .filter(Boolean);
    const currentIndex = slugList.findIndex((item) => item === normalizedVideo.publicSlug);
    const previousSlug = currentIndex >= 0 ? slugList[currentIndex + 1] || null : null;
    const nextSlug = currentIndex > 0 ? slugList[currentIndex - 1] || null : null;

    return {
      ...normalizedVideo,
      author: {
        ...normalizedVideo.author,
        customLinks: normalizeCustomLinks(normalizedVideo.author.customLinks),
      },
      whitelabelEnabled: await isWhitelabelActiveForUser(normalizedVideo.author.id),
      previousSlug,
      nextSlug,
      hasPreviousVideo: Boolean(previousSlug),
      hasNextVideo: Boolean(nextSlug),
      totalCreatorVideos: slugList.length,
      page: currentIndex >= 0 ? currentIndex + 1 : 1,
    };
  } catch (error) {
    console.error("Failed to load public video", error);
    return null;
  }
}
