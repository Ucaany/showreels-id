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
import { getAdminAnalyticsOverview, type AdminAnalyticsOverview } from "@/server/admin-analytics";
import { getAdminEmailList } from "@/server/admin-access";
import { getSiteSettings } from "@/server/site-settings";
import { getDailyQuota } from "@/lib/email";
import {
  getPreviousWibDateString,
  getWibDateString,
  getWibDayStartUtc,
} from "@/lib/visitor-time";
import { getDatabaseStorageInfo } from "@/server/database-storage";
import { getLatestAuditSummary } from "@/server/audit-reporter";
import { auditApiChecks, auditRouteChecks, auditScans } from "@/db/schema";

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

function normalizeAdminVideoVisibility(value: string): AdminVideoItem["visibility"] {
  return value === "public" || value === "semi_private" || value === "draft" || value === "private"
    ? value
    : "private";
}

function normalizeAdminVideoAspectRatio(value: string): AdminVideoItem["aspectRatio"] {
  return value === "portrait" ? "portrait" : "landscape";
}

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
        audit={{ latestScan: null, counts: { critical: 0, high: 0, medium: 0, low: 0 }, score: 100, statusLabel: "Demo Audit", findings: [], routes: [], apis: [], scans: [] }}
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
        emailQuota={{ used: 12, limit: 100, remaining: 88, percentage: 12 }}
        analytics={{
          revenue: { totalPaid: 750000, monthlyPaid: 250000, paidTransactions: 5 },
          subscriptions: { active: 8, trial: 4, last30Days: 3 },
          engagement: { clicks: 320, shares: 45, likes: 128, videoViews: 1560 },
          geography: [
            { country: "Indonesia", city: "Jakarta", visitors: 89 },
            { country: "Indonesia", city: "Yogyakarta", visitors: 42 },
          ],
          chart: [],
          topClicks: [],
          contentPerformance: [],
          transactions: [],
          notifications: [],
          unreadNotifications: 0,
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
        filters={{ search: "", platform: "all", status: "all", sort: "newest", page: 1 }}
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

  let totalUsersRow: { value: number }[] = [{ value: 0 }];
  let totalVideosRow: { value: number }[] = [{ value: 0 }];
  let publicVideosRow: { value: number }[] = [{ value: 0 }];
  let semiPrivateVideosRow: { value: number }[] = [{ value: 0 }];
  let draftVideosRow: { value: number }[] = [{ value: 0 }];
  let privateVideosRow: { value: number }[] = [{ value: 0 }];
  let visitorTodayRow: { value: number }[] = [{ value: 0 }];
  let visitorYesterdayRow: { value: number }[] = [{ value: 0 }];
  let visitorLast7DaysRow: { value: number }[] = [{ value: 0 }];
  let userRows: Array<typeof users.$inferSelect & { videos: { id: string }[] }> = [];
  let videoRows: Array<{
    id: string; title: string; description: string; visibility: string;
    source: string; sourceUrl: string; thumbnailUrl: string; outputType: string;
    durationLabel: string; aspectRatio: string; publicSlug: string; createdAt: Date;
    authorName: string | null; authorUsername: string | null; authorEmail: string;
  }> = [];
  type ScheduleRow = typeof adminNotificationSchedules.$inferSelect & {
    targetUser: Pick<typeof users.$inferSelect, "name" | "email" | "username"> | null;
  };
  let filteredVideosRow: { value: number }[] = [{ value: 0 }];
  let scheduledNotificationsRow: { value: number }[] = [{ value: 0 }];
  let activeCampaignsRow: { value: number }[] = [{ value: 0 }];
  let scheduleRows: ScheduleRow[] = [];
  let settings = { maintenanceEnabled: false, pauseEnabled: false, maintenanceMessage: "", billingEnabled: true };
  let dbHealth = { ok: false, message: "Data belum dimuat", latencyMs: 0, storage: null as unknown as Awaited<ReturnType<typeof getDatabaseStorageInfo>> };
  const emailQuota = await getDailyQuota().catch(() => ({ used: 0, limit: 100, remaining: 100, percentage: 0 }));
  const adminAnalytics = await getAdminAnalyticsOverview().catch(() => ({
    revenue: { totalPaid: 0, monthlyPaid: 0, paidTransactions: 0 },
    subscriptions: { active: 0, trial: 0, last30Days: 0 },
    engagement: { clicks: 0, shares: 0, likes: 0, videoViews: 0 },
    geography: [] as Array<{ country: string; city: string; visitors: number }>,
    chart: [] as Array<{ day: string; views: number; visitors: number; income: number }>,
    topClicks: [] as Array<{ label: string; path: string; clicks: number; targetUrl: string }>,
    contentPerformance: [] as Array<{ id: string; title: string; slug: string; author: string; views: number; clicks: number; shares: number; likes: number }>,
    transactions: [] as Array<{ invoiceId: string; userEmail: string; planName: string; amount: number; status: string; paidAt: string | null; createdAt: string }>,
    notifications: [] as Array<{ id: string; type: string; severity: string; title: string; message: string; isRead: boolean; createdAt: string }>,
    unreadNotifications: 0,
  }));
  const auditDashboard = await getLatestAuditSummary()
    .then(async (summary) => {
      const latest = summary.latestScan;
      const [routes, apis, scans] = latest
        ? await Promise.all([
            db.query.auditRouteChecks.findMany({ where: eq(auditRouteChecks.scanId, latest.id), orderBy: desc(auditRouteChecks.createdAt), limit: 80 }),
            db.query.auditApiChecks.findMany({ where: eq(auditApiChecks.scanId, latest.id), orderBy: desc(auditApiChecks.createdAt), limit: 80 }),
            db.query.auditScans.findMany({ orderBy: desc(auditScans.createdAt), limit: 10 }),
          ])
        : [[], [], []];
      return { ...summary, routes, apis, scans };
    })
    .catch(() => ({ latestScan: null, counts: { critical: 0, high: 0, medium: 0, low: 0 }, score: 100, statusLabel: "Audit belum siap", findings: [], routes: [], apis: [], scans: [] }));

  try {
    const results = await Promise.all([
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
    ]);

    totalUsersRow = results[0];
    totalVideosRow = results[1];
    publicVideosRow = results[2];
    semiPrivateVideosRow = results[3];
    draftVideosRow = results[4];
    privateVideosRow = results[5];
    visitorTodayRow = results[6];
    visitorYesterdayRow = results[7];
    visitorLast7DaysRow = results[8];
    userRows = results[9] as typeof userRows;
    videoRows = results[10] as typeof videoRows;
    filteredVideosRow = results[11];
    scheduledNotificationsRow = results[12];
    activeCampaignsRow = results[13];
    scheduleRows = results[14] as ScheduleRow[];
    settings = results[15] as typeof settings;
    dbHealth = results[16] as typeof dbHealth;
  } catch (error) {
    console.error("[AdminPanelPage] Database queries failed:", error);
    // Continue with fallback values already set above
  }

  const adminUsers: AdminUserItem[] = (Array.isArray(userRows) ? userRows : []).map((user) => ({
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

  const adminVideos: AdminVideoItem[] = (Array.isArray(videoRows) ? videoRows : []).map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    visibility: normalizeAdminVideoVisibility(video.visibility),
    source: video.source,
    sourceUrl: video.sourceUrl,
    thumbnailUrl: video.thumbnailUrl,
    outputType: video.outputType,
    durationLabel: video.durationLabel,
    aspectRatio: normalizeAdminVideoAspectRatio(video.aspectRatio),
    publicSlug: video.publicSlug,
    createdAt: video.createdAt instanceof Date ? video.createdAt.toISOString() : String(video.createdAt),
    authorName: video.authorName || "Creator",
    authorUsername: video.authorUsername || "",
    authorEmail: video.authorEmail,
  }));

  const flatScheduleRows: ScheduleRow[] = Array.isArray(scheduleRows) ? scheduleRows.flat() : [];
  const schedules: AdminNotificationScheduleItem[] = flatScheduleRows.map((item) => ({
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
    startsAt: item.startsAt instanceof Date ? item.startsAt.toISOString() : String(item.startsAt),
    endsAt: item.endsAt instanceof Date ? item.endsAt.toISOString() : (item.endsAt ?? null),
    nextRunAt: item.nextRunAt instanceof Date ? item.nextRunAt.toISOString() : (item.nextRunAt ?? null),
    lastSentAt: item.lastSentAt instanceof Date ? item.lastSentAt.toISOString() : (item.lastSentAt ?? null),
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
      emailQuota={emailQuota}
      analytics={adminAnalytics as AdminAnalyticsOverview}
      audit={auditDashboard}
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
