import { desc, eq } from "drizzle-orm";
import { VideosPageClient } from "@/components/dashboard/videos-page-client";
import { isVideoPinSchemaError, summarizeError } from "@/lib/db-schema-mismatch";
import { db, isDatabaseConfigured } from "@/db";
import { videos } from "@/db/schema";
import { requireCurrentUser } from "@/server/current-user";

/** Maximum videos to load per page to reduce DB cost */
const VIDEOS_PAGE_LIMIT = 50;

export default async function DashboardVideosPage() {
  const user = await requireCurrentUser();

  const videoColumns = {
    id: true,
    title: true,
    source: true,
    sourceUrl: true,
    thumbnailUrl: true,
    visibility: true,
    pinnedToProfile: true,
    pinnedOrder: true,
    publicSlug: true,
    createdAt: true,
  } as const;

  const myVideos = isDatabaseConfigured
    ? await db.query.videos
        .findMany({
          where: eq(videos.userId, user.id),
          orderBy: desc(videos.createdAt),
          columns: videoColumns,
          limit: VIDEOS_PAGE_LIMIT,
        })
        .catch(async (error) => {
          if (!isVideoPinSchemaError(error)) {
            throw error;
          }

          console.warn("db_schema_mismatch dashboard videos without video pin columns", {
            userId: user.id,
            ...summarizeError(error),
          });

          const fallbackVideos = await db.query.videos.findMany({
            where: eq(videos.userId, user.id),
            orderBy: desc(videos.createdAt),
            columns: {
              ...videoColumns,
              pinnedToProfile: false,
              pinnedOrder: false,
            },
            limit: VIDEOS_PAGE_LIMIT,
          });

          return fallbackVideos.map((video) => ({
            ...video,
            pinnedToProfile: false,
            pinnedOrder: 0,
          }));
        })
    : [];

  return (
    <VideosPageClient
      initialVideos={myVideos.map((video) => ({
        id: video.id,
        title: video.title,
        source: video.source,
        sourceUrl: video.sourceUrl,
        thumbnailUrl: video.thumbnailUrl,
        visibility: video.visibility,
        pinnedToProfile: video.pinnedToProfile,
        pinnedOrder: video.pinnedOrder,
        publicSlug: video.publicSlug,
        createdAt: video.createdAt.toISOString(),
      }))}
    />
  );
}
