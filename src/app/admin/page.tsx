import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lt,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import {
  AdminPanelClient,
  type AdminUserItem,
  type AdminVideoItem,
} from "@/components/admin/admin-panel-client";
import { db } from "@/db";
import { users, videos, visitorDailyStats, visitorEvents } from "@/db/schema";
import { getAdminEmailList } from "@/server/admin-access";
import { getSiteSettings } from "@/server/site-settings";
import {
  getPreviousWibDateString,
  getWibDateString,
  getWibDayStartUtc,
} from "@/lib/visitor-time";
import { getDatabaseStorageInfo } from "@/server/database-storage";

async function getDatabaseHealth() {
  const startedAt = Date.now();

  try {
    const [, storage] = await Promise.all([
      db.execute(sql`select 1`),
      getDatabaseStorageInfo(),
    ]);
    const latencyMs = Date.now() - startedAt;
    return {
      ok: true,
      message: `Database sehat (${latencyMs}ms)`,
      latencyMs,
      storage,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Database tidak merespons.",
      latencyMs: 0,
      storage: null,
    };
  }
}

export default async function AdminPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ userSearch?: string; videoSearch?: string }>;
}) {
  const params = await searchParams;
  const userSearch = (params.userSearch || "").trim();
  const videoSearch = (params.videoSearch || "").trim();
  const adminEmails = getAdminEmailList();

  const userBaseFilter = adminEmails.length
    ? and(ne(users.role, "owner"), notInArray(users.email, adminEmails))
    : ne(users.role, "owner");
  const videoBaseFilter = adminEmails.length
    ? and(ne(users.role, "owner"), notInArray(users.email, adminEmails))
    : ne(users.role, "owner");

  const userWhere = userSearch
    ? and(
        userBaseFilter,
        or(
          ilike(users.name, `%${userSearch}%`),
          ilike(users.username, `%${userSearch}%`),
          ilike(users.email, `%${userSearch}%`),
          ilike(users.city, `%${userSearch}%`)
        )
      )
    : userBaseFilter;

  const videoWhere = videoSearch
    ? and(
        videoBaseFilter,
        or(
          ilike(videos.title, `%${videoSearch}%`),
          ilike(videos.publicSlug, `%${videoSearch}%`),
          ilike(videos.source, `%${videoSearch}%`),
          ilike(users.name, `%${videoSearch}%`),
          ilike(users.username, `%${videoSearch}%`),
          ilike(users.email, `%${videoSearch}%`)
        )
      )
    : videoBaseFilter;
  const currentWibDay = getWibDateString();
  const yesterdayWibDay = getPreviousWibDateString();
  const sevenDaysAgoWibDay = getPreviousWibDateString(7);

  const [
    totalUsersRow,
    totalVideosRow,
    publicVideosRow,
    draftVideosRow,
    privateVideosRow,
    visitorTodayRow,
    visitorYesterdayRow,
    visitorLast7DaysRow,
    userRows,
    videoRows,
    settings,
    dbHealth,
  ] = await Promise.all([
    db.select({ value: count() }).from(users).where(userBaseFilter),
    db
      .select({ value: count(videos.id) })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(videoBaseFilter),
    db
      .select({ value: count(videos.id) })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(and(videoBaseFilter, eq(videos.visibility, "public"))),
    db
      .select({ value: count(videos.id) })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(and(videoBaseFilter, eq(videos.visibility, "draft"))),
    db
      .select({ value: count(videos.id) })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(and(videoBaseFilter, eq(videos.visibility, "private"))),
    db
      .select({
        value: sql<number>`count(distinct ${visitorEvents.visitorId})`.mapWith(Number),
      })
      .from(visitorEvents)
      .where(gte(visitorEvents.createdAt, getWibDayStartUtc())),
    db
      .select({
        value: sql<number>`coalesce(sum(${visitorDailyStats.uniqueVisitors}), 0)`.mapWith(
          Number
        ),
      })
      .from(visitorDailyStats)
      .where(eq(visitorDailyStats.day, yesterdayWibDay)),
    db
      .select({
        value: sql<number>`coalesce(sum(${visitorDailyStats.uniqueVisitors}), 0)`.mapWith(
          Number
        ),
      })
      .from(visitorDailyStats)
      .where(
        and(
          gte(visitorDailyStats.day, sevenDaysAgoWibDay),
          lt(visitorDailyStats.day, currentWibDay)
        )
      ),
    db.query.users.findMany({
      where: userWhere,
      orderBy: desc(users.createdAt),
      limit: 30,
      with: {
        videos: {
          columns: { id: true },
        },
      },
    }),
    db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        visibility: videos.visibility,
        source: videos.source,
        sourceUrl: videos.sourceUrl,
        thumbnailUrl: videos.thumbnailUrl,
        outputType: videos.outputType,
        durationLabel: videos.durationLabel,
        aspectRatio: videos.aspectRatio,
        publicSlug: videos.publicSlug,
        createdAt: videos.createdAt,
        authorName: users.name,
        authorUsername: users.username,
        authorEmail: users.email,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(videoWhere)
      .orderBy(desc(videos.createdAt))
      .limit(30),
    getSiteSettings(),
    getDatabaseHealth(),
  ]);

  const adminUsers: AdminUserItem[] = userRows.map((user) => ({
    id: user.id,
    name: user.name || "",
    email: user.email,
    username: user.username || "",
    role: user.role,
    bio: user.bio,
    city: user.city,
    contactEmail: user.contactEmail,
    phoneNumber: user.phoneNumber,
    websiteUrl: user.websiteUrl,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason,
    createdAt: user.createdAt.toISOString(),
    videoCount: user.videos.length,
  }));

  const adminVideos: AdminVideoItem[] = videoRows.map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    visibility: video.visibility,
    source: video.source,
    sourceUrl: video.sourceUrl,
    thumbnailUrl: video.thumbnailUrl,
    outputType: video.outputType,
    durationLabel: video.durationLabel,
    aspectRatio: video.aspectRatio,
    publicSlug: video.publicSlug,
    createdAt: video.createdAt.toISOString(),
    authorName: video.authorName || "Creator",
    authorUsername: video.authorUsername || "",
    authorEmail: video.authorEmail,
  }));

  return (
    <AdminPanelClient
      stats={{
        totalUsers: totalUsersRow[0]?.value ?? 0,
        totalVideos: totalVideosRow[0]?.value ?? 0,
        publicVideos: publicVideosRow[0]?.value ?? 0,
        draftVideos: draftVideosRow[0]?.value ?? 0,
        privateVideos: privateVideosRow[0]?.value ?? 0,
        visitorToday: visitorTodayRow[0]?.value ?? 0,
        visitorYesterday: visitorYesterdayRow[0]?.value ?? 0,
        visitorLast7Days: visitorLast7DaysRow[0]?.value ?? 0,
      }}
      dbHealth={dbHealth}
      settings={{
        maintenanceEnabled: settings.maintenanceEnabled,
        pauseEnabled: settings.pauseEnabled,
        maintenanceMessage: settings.maintenanceMessage,
      }}
      users={adminUsers}
      videos={adminVideos}
      userSearch={userSearch}
      videoSearch={videoSearch}
    />
  );
}
