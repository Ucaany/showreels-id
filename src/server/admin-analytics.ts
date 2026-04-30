import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import {
  adminNotifications,
  analyticsEvents,
  billingSubscriptions,
  billingTransactions,
  users,
  videoEngagementStats,
  videos,
  visitorDailyStats,
} from "@/db/schema";
import { getWibDateString } from "@/lib/visitor-time";

export type AdminChartPoint = {
  day: string;
  views: number;
  visitors: number;
  income: number;
};

export type AdminTopClick = {
  label: string;
  path: string;
  clicks: number;
  targetUrl: string;
};

export type AdminContentPerformance = {
  id: string;
  title: string;
  slug: string;
  author: string;
  views: number;
  clicks: number;
  shares: number;
  likes: number;
};

export type AdminTransactionItem = {
  invoiceId: string;
  userEmail: string;
  planName: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

export type AdminNotificationItem = {
  id: string;
  type: string;
  severity: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type AdminAnalyticsOverview = {
  revenue: {
    totalPaid: number;
    monthlyPaid: number;
    paidTransactions: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    last30Days: number;
  };
  engagement: {
    clicks: number;
    shares: number;
    likes: number;
    videoViews: number;
  };
  geography: Array<{ country: string; city: string; visitors: number }>;
  chart: AdminChartPoint[];
  topClicks: AdminTopClick[];
  contentPerformance: AdminContentPerformance[];
  transactions: AdminTransactionItem[];
  notifications: AdminNotificationItem[];
  unreadNotifications: number;
};

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function wibDateFromOffset(daysAgo: number) {
  const currentDay = getWibDateString();
  const date = new Date(`${currentDay}T00:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return toYmd(date);
}

function enumerateLastDays(days: number) {
  return Array.from({ length: days }, (_, index) => wibDateFromOffset(days - index - 1));
}

export async function getAdminAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
  const emptyChart = enumerateLastDays(30).map((day) => ({
    day,
    views: 0,
    visitors: 0,
    income: 0,
  }));

  if (!isDatabaseConfigured) {
    return {
      revenue: { totalPaid: 0, monthlyPaid: 0, paidTransactions: 0 },
      subscriptions: { active: 0, trial: 0, last30Days: 0 },
      engagement: { clicks: 0, shares: 0, likes: 0, videoViews: 0 },
      geography: [],
      chart: emptyChart,
      topClicks: [],
      contentPerformance: [],
      transactions: [],
      notifications: [],
      unreadNotifications: 0,
    };
  }

  const startDay = wibDateFromOffset(29);
  const startAt = new Date(`${startDay}T00:00:00+07:00`);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [
    revenueRows,
    monthlyRevenueRows,
    subscriptionRows,
    subscriptionLast30Rows,
    engagementRows,
    dailyVisitorRows,
    dailyIncomeRows,
    topClickRows,
    geoRows,
    contentRows,
    transactionRows,
    notificationRows,
    unreadRows,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${billingTransactions.amount}), 0)`.mapWith(Number),
        count: count(),
      })
      .from(billingTransactions)
      .where(eq(billingTransactions.status, "paid")),
    db
      .select({ total: sql<number>`coalesce(sum(${billingTransactions.amount}), 0)`.mapWith(Number) })
      .from(billingTransactions)
      .where(and(eq(billingTransactions.status, "paid"), gte(billingTransactions.createdAt, monthStart))),
    db
      .select({ status: billingSubscriptions.status, value: count() })
      .from(billingSubscriptions)
      .groupBy(billingSubscriptions.status),
    db
      .select({ value: count() })
      .from(billingSubscriptions)
      .where(gte(billingSubscriptions.createdAt, startAt)),
    db
      .select({ eventType: analyticsEvents.eventType, value: count() })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, startAt))
      .groupBy(analyticsEvents.eventType),
    db
      .select({
        day: visitorDailyStats.day,
        views: sql<number>`coalesce(sum(${visitorDailyStats.totalEvents}), 0)`.mapWith(Number),
        visitors: sql<number>`coalesce(sum(${visitorDailyStats.uniqueVisitors}), 0)`.mapWith(Number),
      })
      .from(visitorDailyStats)
      .where(gte(visitorDailyStats.day, startDay))
      .groupBy(visitorDailyStats.day),
    db
      .select({
        day: sql<string>`to_char((timezone('Asia/Jakarta', ${billingTransactions.createdAt}))::date, 'YYYY-MM-DD')`,
        income: sql<number>`coalesce(sum(${billingTransactions.amount}), 0)`.mapWith(Number),
      })
      .from(billingTransactions)
      .where(and(eq(billingTransactions.status, "paid"), gte(billingTransactions.createdAt, startAt)))
      .groupBy(sql`(timezone('Asia/Jakarta', ${billingTransactions.createdAt}))::date`),
    db
      .select({
        path: analyticsEvents.path,
        targetUrl: analyticsEvents.targetUrl,
        clicks: count(),
      })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.eventType, "link_click"), gte(analyticsEvents.createdAt, startAt)))
      .groupBy(analyticsEvents.path, analyticsEvents.targetUrl)
      .orderBy(desc(count()))
      .limit(8),
    db
      .select({
        country: analyticsEvents.country,
        city: analyticsEvents.city,
        visitors: sql<number>`count(distinct ${analyticsEvents.visitorId})`.mapWith(Number),
      })
      .from(analyticsEvents)
      .where(and(gte(analyticsEvents.createdAt, startAt), lte(analyticsEvents.createdAt, new Date())))
      .groupBy(analyticsEvents.country, analyticsEvents.city)
      .orderBy(desc(sql`count(distinct ${analyticsEvents.visitorId})`))
      .limit(6),
    db
      .select({
        id: videos.id,
        title: videos.title,
        slug: videos.publicSlug,
        author: users.name,
        username: users.username,
        views: videoEngagementStats.views,
        clicks: videoEngagementStats.clicks,
        shares: videoEngagementStats.shares,
        likes: videoEngagementStats.likes,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .leftJoin(videoEngagementStats, eq(videoEngagementStats.videoId, videos.id))
      .orderBy(desc(sql`coalesce(${videoEngagementStats.views}, 0) + coalesce(${videoEngagementStats.clicks}, 0) + coalesce(${videoEngagementStats.shares}, 0) + coalesce(${videoEngagementStats.likes}, 0)`))
      .limit(8),
    db
      .select({
        invoiceId: billingTransactions.invoiceId,
        userEmail: users.email,
        planName: billingTransactions.planName,
        amount: billingTransactions.amount,
        status: billingTransactions.status,
        paidAt: billingTransactions.paidAt,
        createdAt: billingTransactions.createdAt,
      })
      .from(billingTransactions)
      .innerJoin(users, eq(billingTransactions.userId, users.id))
      .orderBy(desc(billingTransactions.createdAt))
      .limit(10),
    db.query.adminNotifications.findMany({
      orderBy: desc(adminNotifications.createdAt),
      limit: 8,
    }),
    db.select({ value: count() }).from(adminNotifications).where(eq(adminNotifications.isRead, false)),
  ]);

  const chartMap = new Map(emptyChart.map((item) => [item.day, { ...item }]));
  for (const row of dailyVisitorRows) {
    const item = chartMap.get(row.day) || { day: row.day, views: 0, visitors: 0, income: 0 };
    item.views = row.views;
    item.visitors = row.visitors;
    chartMap.set(row.day, item);
  }
  for (const row of dailyIncomeRows) {
    const item = chartMap.get(row.day) || { day: row.day, views: 0, visitors: 0, income: 0 };
    item.income = row.income;
    chartMap.set(row.day, item);
  }

  const subscriptionMap = new Map(subscriptionRows.map((row) => [row.status, row.value]));
  const engagementMap = new Map(engagementRows.map((row) => [row.eventType, row.value]));

  return {
    revenue: {
      totalPaid: revenueRows[0]?.total ?? 0,
      monthlyPaid: monthlyRevenueRows[0]?.total ?? 0,
      paidTransactions: revenueRows[0]?.count ?? 0,
    },
    subscriptions: {
      active: subscriptionMap.get("active") ?? 0,
      trial: subscriptionMap.get("trial") ?? 0,
      last30Days: subscriptionLast30Rows[0]?.value ?? 0,
    },
    engagement: {
      clicks: engagementMap.get("link_click") ?? 0,
      shares: engagementMap.get("share") ?? 0,
      likes: engagementMap.get("like") ?? 0,
      videoViews: engagementMap.get("video_view") ?? 0,
    },
    geography: geoRows.map((row) => ({
      country: row.country || "Unknown",
      city: row.city || "Unknown",
      visitors: row.visitors,
    })),
    chart: Array.from(chartMap.values()).sort((a, b) => a.day.localeCompare(b.day)),
    topClicks: topClickRows.map((row) => ({
      label: row.targetUrl || row.path,
      path: row.path,
      clicks: row.clicks,
      targetUrl: row.targetUrl,
    })),
    contentPerformance: contentRows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      author: row.author || row.username || "Creator",
      views: row.views || 0,
      clicks: row.clicks || 0,
      shares: row.shares || 0,
      likes: row.likes || 0,
    })),
    transactions: transactionRows.map((row) => ({
      invoiceId: row.invoiceId,
      userEmail: row.userEmail,
      planName: row.planName,
      amount: row.amount,
      status: row.status,
      paidAt: row.paidAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    notifications: notificationRows.map((row) => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    })),
    unreadNotifications: unreadRows[0]?.value ?? 0,
  };
}
