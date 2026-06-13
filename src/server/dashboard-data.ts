import { count, desc, eq, inArray, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, isDatabaseConfigured } from "@/db";
import { videos, visitorEvents } from "@/db/schema";

/**
 * Cached dashboard data functions
 * Mengurangi beban database dengan caching query yang sering dipanggil
 */

export interface DashboardVideoSummary {
  id: string;
  title: string;
  visibility: string;
  publicSlug: string | null;
}

export interface DashboardMetrics {
  totalVideos: number;
  publicVideos: number;
  totalViews: number;
  videoSummaries: DashboardVideoSummary[];
}

/**
 * Fetch user videos dengan limit untuk dashboard overview
 * Di-cache selama 30 detik per user
 */
const getCachedUserVideos = unstable_cache(
  async (userId: string) => {
    try {
      if (!isDatabaseConfigured) return [];

      const result = await db.query.videos.findMany({
        where: eq(videos.userId, userId),
        orderBy: desc(videos.createdAt),
        limit: 50, // Limit untuk dashboard — tidak perlu semua video
        columns: {
          id: true,
          title: true,
          visibility: true,
          publicSlug: true,
        },
      });

      return result.map((v) => ({
        id: v.id,
        title: v.title,
        visibility: v.visibility,
        publicSlug: v.publicSlug,
      }));
    } catch (error) {
      console.error("[getCachedUserVideos] unstable_cache callback error:", error);
      return [];
    }
  },
  ["dashboard-user-videos"],
  { revalidate: 30 }
);

/**
 * Fetch total visitor views untuk creator
 * Di-cache selama 60 detik per user (analytics tidak perlu real-time di dashboard)
 */
const getCachedVisitorCount = unstable_cache(
  async (profilePath: string, publicVideoPaths: string[]) => {
    try {
      if (!isDatabaseConfigured) return 0;

      const creatorPathPattern = `${profilePath}%`;

      const [row] = await db
        .select({ value: count() })
        .from(visitorEvents)
        .where(
          publicVideoPaths.length > 0
            ? or(
                sql`${visitorEvents.path} LIKE ${creatorPathPattern}`,
                inArray(visitorEvents.path, publicVideoPaths)
              )
            : sql`${visitorEvents.path} LIKE ${creatorPathPattern}`
        );

      return Number(row?.value || 0);
    } catch (error) {
      console.error("[getCachedVisitorCount] unstable_cache callback error:", error);
      return 0;
    }
  },
  ["dashboard-visitor-count"],
  { revalidate: 60 }
);

/**
 * Get all dashboard metrics in one call
 * Combines cached video list + cached visitor count
 */
export async function getDashboardMetrics(input: {
  userId: string;
  username: string;
}): Promise<DashboardMetrics> {
  try {
    const profilePath = `/creator/${input.username || "creator"}`;

    // Fetch videos (cached 30s)
    const videoSummaries = await getCachedUserVideos(input.userId);

    const publicVideos = videoSummaries.filter((v) => v.visibility === "public");
    const publicVideoPaths = publicVideos
      .map((video) => video.publicSlug?.trim())
      .filter((value): value is string => Boolean(value))
      .map((slug) => `/v/${slug}`);

    // Fetch visitor count (cached 60s)
    const totalViews = await getCachedVisitorCount(profilePath, publicVideoPaths);

    return {
      totalVideos: videoSummaries.length,
      publicVideos: publicVideos.length,
      totalViews,
      videoSummaries,
    };
  } catch (error) {
    console.error("[getDashboardMetrics] Failed, returning empty metrics:", error);
    return {
      totalVideos: 0,
      publicVideos: 0,
      totalViews: 0,
      videoSummaries: [],
    };
  }
}
