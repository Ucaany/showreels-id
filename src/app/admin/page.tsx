import {
  and,
  asc,
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
  type AdminNotificationScheduleItem,
  type AdminUserItem,
  type AdminVideoItem,
} from "@/components/admin/admin-panel-client";
import { db } from "@/db";
import {
  adminNotificationSchedules,
  users,
  videos,
  visitorDailyStats,
  visitorEvents,
} from "@/db/schema";
import { getAdminAnalyticsOverview } from "@/server/admin-analytics";
import { getAdminEmailList } from "@/server/admin-access";
import { getSiteSettings } from "@/server/site-settings";
import {
  getPreviousWibDateString,
  getWibDateString,
  getWibDayStartUtc,
} from "@/lib/visitor-time";
import { getDatabaseStorageInfo } from "@/server/database-storage";

type AdminSearchParams = {
  search?: string;
  platform?: string;
  status?: string;
  sort?: string;
  page?: string;
  userSearch?: string;
  videoSearch?: string;
};

const PAGE_SIZE = 9;
const PLATFORM_VALUES = ["instagram", "facebook", "youtube"];
const STATUS_VALUES = ["public", "private"];

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
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  // Demo mode: return static dummy data without database queries
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return (
      <AdminPanelClient
        stats={{
          totalUsers: 12,
          totalVideos: 48,
          publicVideos: 32,
          semiPrivateVideos: 8,
          draftVideos: 5,
          privateVideos: 3,
          visitorToday: 156,
          visitorYesterday: 203,
          visitorLast7Days: 1247,
          scheduledNotifications: 2,
          activeCampaigns: 1,
        }}
        dbHealth={{
          ok: true,
          message: "Demo mode — database tidak terhubung",
          latencyMs: 0,
          storage: null,
        }}
        settings={{
          maintenanceEnabled: false,
          pauseEnabled: false,
          maintenanceMessage: "",
          billingEnabled: true,
        }}
        analytics={{
          totalRevenue: 750000,
          activeSubscriptions: 8,
          trialUsers: 4,
          churnRate: 5.2,
        }}
        users={[
          {
            id: "demo-user-001",
            name: "Raka Mahendra",
            email: "creator@showreels.id",
            username: "raka_creator",
            role: "Video Editor",
            bio: "Editor konten edukasi dan teknologi.",
            city: "Yogyakarta",
            contactEmail: "creator@showreels.id",
            phoneNumber: "+628120000001",
            websiteUrl: "https://rakacreator.com",
            isBlocked: false,
            blockedReason: "",
            createdAt: "2026-01-15T10:00:00.000Z",
            videoCount: 4,
          },
          {
            id: "demo-user-002",
            name: "Nadia Pratiwi",
            email: "nadia@dummy.showreels.id",
            username: "nadia",
            role: "Videografer",
            bio: "Videografer wedding dan event.",
            city: "Bandung",
            contactEmail: "nadia@dummy.showreels.id",
            phoneNumber: "+628120000002",
            websiteUrl: "",
            isBlocked: false,
            blockedReason: "",
            createdAt: "2026-02-01T08:30:00.000Z",
            videoCount: 3,
          },
          {
            id: "demo-user-003",
            name: "Dimas Pratama",
            email: "dimas@dummy.showreels.id",
            username: "dimas",
            role: "Content Creator",
            bio: "Creator travel dan lifestyle.",
            city: "Jakarta",
            contactEmail: "dimas@dummy.showreels.id",
            phoneNumber: "+628120000003",
            websiteUrl: "",
            isBlocked: true,
            blockedReason: "Konten melanggar ToS",
            createdAt: "2026-03-10T14:00:00.000Z",
            videoCount: 2,
          },
        ]}
        videos={[
          {
            id: "vid-001",
            title: "Showreel Brand Campaign 2026",
            description: "Kompilasi project campaign terbaru.",
            visibility: "public",
            source: "youtube",
            sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            outputType: "Showreel",
            durationLabel: "01:25",
            aspectRatio: "landscape",
            publicSlug: "raka-showreel-2026",
            createdAt: "2026-03-04T10:15:00.000Z",
            authorName: "Raka Mahendra",
            authorUsername: "raka_creator",
            authorEmail: "creator@showreels.id",
          },
          {
            id: "vid-002",
            title: "Wedding Highlight Nadia",
            description: "Highlight video wedding cinematic.",
            visibility: "public",
            source: "vimeo",
            sourceUrl: "https://vimeo.com/76979871",
            thumbnailUrl: "https://vumbnail.com/76979871.jpg",
            outputType: "Wedding",
            durationLabel: "03:45",
            aspectRatio: "landscape",
            publicSlug: "nadia-wedding-highlight",
            createdAt: "2026-02-20T09:00:00.000Z",
            authorName: "Nadia Pratiwi",
            authorUsername: "nadia",
            authorEmail: "nadia@dummy.showreels.id",
          },
        ]}
        schedules={[]}
        filters={{ search: "", platform: "all", status: "all", sort: "newest", page: "1" }}
        pagination={{ page: 1, pageSize: 9, totalItems: 2, totalPages: 1 }}
        ownerProfile={{ username: "admin_showreels", email: "admin@showreels.id" }}
      />
    );
  }
  const search = (params.search || params.videoSearch || params.userSearch || "").trim();
  const platform = PLATFORM_VALUES.includes((params.platform || "").toLowerCase())
    ? (params.platform || "").toLowerCase()
    : "all";
  const status = STATUS_VALUES.includes((params.status || "").toLowerCase())
    ? ((params.status || "").toLowerCase() as "public" | "private")
    : "all";
  const sort = ["newest", "oldest", "az", "za"].includes(params.sort || "")
    ? params.sort || "newest"
    : "newest";
  const page = Math.max(Number.parseInt(params.page || "1", 10) || 1, 1);
  const offset = (page - 1) * PAGE_SIZE;
  const adminEmails = getAdminEmailList();

  const userBaseFilter = adminEmails.length
    ? and(ne(users.role, "owner"), notInArray(users.email, adminEmails))
    : ne(users.role, "owner");
  const videoBaseFilter = adminEmails.length
    ? and(ne(users.role, "owner"), notInArray(users.email, adminEmails))
    : ne(users.role, "owner");

  const unifiedVideoFilters = [videoBaseFilter];
  if (search) {
    unifiedVideoFilters.push(
      or(
        ilike(videos.title, `%${search}%`),
        ilike(videos.publicSlug, `%${search}%`),
        ilike(videos.source, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(users.username, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    );
  }
  if (platform !== "all") unifiedVideoFilters.push(eq(videos.source, platform));
  if (status !== "all") unifiedVideoFilters.push(eq(videos.visibility, status));
  const videoWhere = and(...unifiedVideoFilters);

  const videoOrderBy =
    sort === "oldest"
      ? asc(videos.createdAt)
      : sort === "az"
        ? asc(videos.title)
        : sort === "za"
          ? desc(videos.title)
          : desc(videos.createdAt);

  const currentWibDay = getWibDateString();
  const yesterdayWibDay = getPreviousWibDateString();
  const sevenDaysAgoWibDay = getPreviousWibDateString(7);

  const [
    totalUsersRow,
    totalVideosRow,
    publicVideosRow,
    semiPrivateVideosRow,
    draftVideosRow,
    privateVideosRow,
    visitorTodayRow,
    visitorYesterdayRow,
    visitorLast7DaysRow,
    userRows,
    videoRows,
    filteredVideosRow,
    scheduledNotificationsRow,
    activeCampaignsRow,
    scheduleRows,
    settings,
    dbHealth,
    adminAnalytics,
  ] = await Promise.all([
    db.select({ value: count() }).from(users).where(userBaseFilter),
    db.select({ value: count(videos.id) }).from(videos).innerJoin(users, eq(videos.userId, users.id)).where(videoBaseFilter),
    db.select({ value: count(videos.id) }).from(videos).innerJoin(users, eq(videos.userId, users.id)).where(and(videoBaseFilter, eq(videos.visibility, "public"))),
    db.select({ value: count(videos.id) }).from(videos).innerJoin(users, eq(videos.userId, users.id)).where(and(videoBaseFilter, eq(videos.visibility, "semi_private"))),
    db.select({ value: count(videos.id) }).from(videos).innerJoin(users, eq(videos.userId, users.id)).where(and(videoBaseFilter, eq(videos.visibility, "draft"))),
    db.select({ value: count(videos.id) }).from(videos).innerJoin(users, eq(videos.userId, users.id)).where(and(videoBaseFilter, eq(videos.visibility, "private"))),
    db.select({ value: sql<number>`count(distinct ${visitorEvents.visitorId})`.mapWith(Number) }).from(visitorEvents).where(gte(visitorEvents.createdAt, getWibDayStartUtc())),
    db.select({ value: sql<number>`coalesce(sum(${visitorDailyStats.uniqueVisitors}), 0)`.mapWith(Number) }).from(visitorDailyStats).where(eq(visitorDailyStats.day, yesterdayWibDay)),
    db.select({ value: sql<number>`coalesce(sum(${visitorDailyStats.uniqueVisitors}), 0)`.mapWith(Number) }).from(visitorDailyStats).where(and(gte(visitorDailyStats.day, sevenDaysAgoWibDay), lt(visitorDailyStats.day, currentWibDay))),
    db.query.users.findMany({
      where: userBaseFilter,
      orderBy: desc(users.createdAt),
      limit: 40,
      with: { videos: { columns: { id: true } } },
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
      .orderBy(videoOrderBy)
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ value: count(videos.id) }).from(videos).innerJoin(users, eq(videos.userId, users.id)).where(videoWhere),
    db.select({ value: count() }).from(adminNotificationSchedules).where(eq(adminNotificationSchedules.status, "scheduled")),
    db.select({ value: count() }).from(adminNotificationSchedules).where(or(eq(adminNotificationSchedules.status, "scheduled"), eq(adminNotificationSchedules.status, "sent"))),
    db.query.adminNotificationSchedules.findMany({
      orderBy: desc(adminNotificationSchedules.createdAt),
      limit: 6,
      with: { targetUser: { columns: { name: true, email: true, username: true } } },
    }),
    getSiteSettings(),
    getDatabaseHealth(),
    getAdminAnalyticsOverview(),
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

  const schedules: AdminNotificationScheduleItem[] = scheduleRows.map((item) => ({
    id: item.id,
    targetType: item.targetType,
    targetUser: item.targetUser
      ? {
          name: item.targetUser.name || "Creator",
          email: item.targetUser.email,
          username: item.targetUser.username || "",
        }
      : null,
    title: item.title,
    message: item.message,
    status: item.status,
    sendMode: item.sendMode,
    recurrence: item.recurrence,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt?.toISOString() ?? null,
    nextRunAt: item.nextRunAt?.toISOString() ?? null,
    lastSentAt: item.lastSentAt?.toISOString() ?? null,
    activeDurationDays: item.activeDurationDays,
  }));

  const totalFilteredVideos = filteredVideosRow[0]?.value ?? 0;

  return (
    <AdminPanelClient
      stats={{
        totalUsers: totalUsersRow[0]?.value ?? 0,
        totalVideos: totalVideosRow[0]?.value ?? 0,
        publicVideos: publicVideosRow[0]?.value ?? 0,
        semiPrivateVideos: semiPrivateVideosRow[0]?.value ?? 0,
        draftVideos: draftVideosRow[0]?.value ?? 0,
        privateVideos: privateVideosRow[0]?.value ?? 0,
        visitorToday: visitorTodayRow[0]?.value ?? 0,
        visitorYesterday: visitorYesterdayRow[0]?.value ?? 0,
        visitorLast7Days: visitorLast7DaysRow[0]?.value ?? 0,
        scheduledNotifications: scheduledNotificationsRow[0]?.value ?? 0,
        activeCampaigns: activeCampaignsRow[0]?.value ?? 0,
      }}
      dbHealth={dbHealth}
      settings={{
        maintenanceEnabled: settings.maintenanceEnabled,
        pauseEnabled: settings.pauseEnabled,
        maintenanceMessage: settings.maintenanceMessage,
        billingEnabled: settings.billingEnabled,
      }}
      analytics={adminAnalytics}
      users={adminUsers}
      videos={adminVideos}
      schedules={schedules}
      filters={{ search, platform, status, sort, page }}
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        totalItems: totalFilteredVideos,
        totalPages: Math.max(Math.ceil(totalFilteredVideos / PAGE_SIZE), 1),
      }}
      ownerProfile={{ username: "owner_videoport", email: "hello@ucan.com" }}
    />
  );
}
