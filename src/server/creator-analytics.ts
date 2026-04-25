import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { visitorDailyStats, visitorEvents, videos } from "@/db/schema";
import { getWibDateString, getWibDayStartUtc } from "@/lib/visitor-time";

export type AnalyticsPeriod = "today" | "7d" | "30d" | "custom";

export interface AnalyticsPeriodRange {
  period: AnalyticsPeriod;
  startDay: string;
  endDay: string;
  startAtUtc: Date;
}

export interface CreatorTrafficSummary {
  totalViews: number;
  uniqueVisitors: number;
  topPage: string | null;
  topPageViews: number;
}

export interface CreatorTrafficPoint {
  day: string;
  views: number;
  uniqueVisitors: number;
}

export interface CreatorTopPage {
  path: string;
  label: string;
  views: number;
}

export interface CreatorRecentActivity {
  id: string;
  path: string;
  label: string;
  createdAt: string;
}

const MAX_CUSTOM_RANGE_DAYS = 90;

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fromYmd(value: string) {
  const parsed = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function subtractWibDays(base: Date, days: number) {
  const copy = new Date(base.getTime());
  copy.setUTCDate(copy.getUTCDate() - days);
  return copy;
}

export function resolveAnalyticsPeriod(input: {
  period?: string | null;
  start?: string | null;
  end?: string | null;
}): AnalyticsPeriodRange {
  const now = new Date();
  const currentWibDay = getWibDateString(now);
  const currentWibDate = fromYmd(currentWibDay) || now;
  const periodRaw = (input.period || "7d").toLowerCase();

  if (periodRaw === "today") {
    return {
      period: "today",
      startDay: currentWibDay,
      endDay: currentWibDay,
      startAtUtc: getWibDayStartUtc(now),
    };
  }

  if (periodRaw === "30d") {
    const startDate = subtractWibDays(currentWibDate, 29);
    const startDay = toYmd(startDate);
    return {
      period: "30d",
      startDay,
      endDay: currentWibDay,
      startAtUtc: getWibDayStartUtc(new Date(`${startDay}T00:00:00+07:00`)),
    };
  }

  if (periodRaw === "custom" && input.start && input.end) {
    const startDate = fromYmd(input.start);
    const endDate = fromYmd(input.end);
    if (startDate && endDate && startDate.getTime() <= endDate.getTime()) {
      const diffDays = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (diffDays <= MAX_CUSTOM_RANGE_DAYS) {
        const startDay = toYmd(startDate);
        const endDay = toYmd(endDate);
        return {
          period: "custom",
          startDay,
          endDay,
          startAtUtc: getWibDayStartUtc(new Date(`${startDay}T00:00:00+07:00`)),
        };
      }
    }
  }

  const startDate = subtractWibDays(currentWibDate, 6);
  const startDay = toYmd(startDate);
  return {
    period: "7d",
    startDay,
    endDay: currentWibDay,
    startAtUtc: getWibDayStartUtc(new Date(`${startDay}T00:00:00+07:00`)),
  };
}

function enumerateDays(startDay: string, endDay: string) {
  const startDate = fromYmd(startDay);
  const endDate = fromYmd(endDay);
  if (!startDate || !endDate) return [] as string[];
  const output: string[] = [];
  const cursor = new Date(startDate.getTime());
  while (cursor.getTime() <= endDate.getTime()) {
    output.push(toYmd(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return output;
}

function buildPathLabel(input: {
  path: string;
  creatorPath: string;
  videoLabels: Map<string, string>;
}) {
  const { path, creatorPath, videoLabels } = input;
  if (path === creatorPath) {
    return "Profil Utama";
  }
  if (path.startsWith(`${creatorPath}/`)) {
    const suffix = path.slice(creatorPath.length + 1).replaceAll("-", " ");
    return suffix
      ? `Profil - ${suffix[0].toUpperCase()}${suffix.slice(1)}`
      : "Profil";
  }
  if (videoLabels.has(path)) {
    return videoLabels.get(path) || "Video";
  }
  return path;
}

export async function getCreatorTrafficAnalytics(input: {
  userId: string;
  username: string;
  range: AnalyticsPeriodRange;
}) {
  const { userId, username, range } = input;
  if (!isDatabaseConfigured) {
    const emptyDays = enumerateDays(range.startDay, range.endDay).map((day) => ({
      day,
      views: 0,
      uniqueVisitors: 0,
    }));
    return {
      summary: {
        totalViews: 0,
        uniqueVisitors: 0,
        topPage: null,
        topPageViews: 0,
      } as CreatorTrafficSummary,
      points: emptyDays,
      topPages: [] as CreatorTopPage[],
      recent: [] as CreatorRecentActivity[],
    };
  }

  const creatorPath = `/creator/${username || "creator"}`;
  const ownedVideos = await db.query.videos.findMany({
    where: eq(videos.userId, userId),
    columns: {
      publicSlug: true,
      title: true,
    },
  });
  const videoPaths = ownedVideos.map((video) => `/v/${video.publicSlug}`);
  const videoLabels = new Map(
    ownedVideos.map((video) => [`/v/${video.publicSlug}`, `Video - ${video.title}`])
  );

  const dailyPathFilter =
    videoPaths.length > 0
      ? or(
          sql`${visitorDailyStats.path} LIKE ${`${creatorPath}%`}`,
          inArray(visitorDailyStats.path, videoPaths)
        )
      : sql`${visitorDailyStats.path} LIKE ${`${creatorPath}%`}`;

  const eventPathFilter =
    videoPaths.length > 0
      ? or(
          sql`${visitorEvents.path} LIKE ${`${creatorPath}%`}`,
          inArray(visitorEvents.path, videoPaths)
        )
      : sql`${visitorEvents.path} LIKE ${`${creatorPath}%`}`;

  const [dailyByDayRows, eventByDayRows, dailyByPathRows, eventByPathRows, recentRows] =
    await Promise.all([
      db
        .select({
          day: visitorDailyStats.day,
          views: sql<number>`coalesce(sum(${visitorDailyStats.totalEvents}), 0)`.mapWith(Number),
          uniqueVisitors: sql<number>`coalesce(sum(${visitorDailyStats.uniqueVisitors}), 0)`.mapWith(
            Number
          ),
        })
        .from(visitorDailyStats)
        .where(
          and(
            gte(visitorDailyStats.day, range.startDay),
            lte(visitorDailyStats.day, range.endDay),
            dailyPathFilter
          )
        )
        .groupBy(visitorDailyStats.day),
      db
        .select({
          day: sql<string>`to_char((timezone('Asia/Jakarta', ${visitorEvents.createdAt}))::date, 'YYYY-MM-DD')`,
          views: sql<number>`count(*)`.mapWith(Number),
          uniqueVisitors: sql<number>`count(distinct ${visitorEvents.visitorId})`.mapWith(Number),
        })
        .from(visitorEvents)
        .where(
          and(gte(visitorEvents.createdAt, range.startAtUtc), eventPathFilter)
        )
        .groupBy(
          sql`(timezone('Asia/Jakarta', ${visitorEvents.createdAt}))::date`
        ),
      db
        .select({
          path: visitorDailyStats.path,
          views: sql<number>`coalesce(sum(${visitorDailyStats.totalEvents}), 0)`.mapWith(Number),
        })
        .from(visitorDailyStats)
        .where(
          and(
            gte(visitorDailyStats.day, range.startDay),
            lte(visitorDailyStats.day, range.endDay),
            dailyPathFilter
          )
        )
        .groupBy(visitorDailyStats.path),
      db
        .select({
          path: visitorEvents.path,
          views: sql<number>`count(*)`.mapWith(Number),
        })
        .from(visitorEvents)
        .where(and(gte(visitorEvents.createdAt, range.startAtUtc), eventPathFilter))
        .groupBy(visitorEvents.path),
      db.query.visitorEvents.findMany({
        where: and(gte(visitorEvents.createdAt, range.startAtUtc), eventPathFilter),
        columns: {
          id: true,
          path: true,
          createdAt: true,
        },
        orderBy: desc(visitorEvents.createdAt),
        limit: 20,
      }),
    ]);

  const dayAccumulator = new Map<string, { views: number; uniqueVisitors: number }>();
  for (const row of dailyByDayRows) {
    dayAccumulator.set(row.day, {
      views: row.views,
      uniqueVisitors: row.uniqueVisitors,
    });
  }
  for (const row of eventByDayRows) {
    const current = dayAccumulator.get(row.day) || { views: 0, uniqueVisitors: 0 };
    dayAccumulator.set(row.day, {
      views: current.views + row.views,
      uniqueVisitors: current.uniqueVisitors + row.uniqueVisitors,
    });
  }

  const points = enumerateDays(range.startDay, range.endDay).map((day) => {
    const data = dayAccumulator.get(day) || { views: 0, uniqueVisitors: 0 };
    return {
      day,
      views: data.views,
      uniqueVisitors: data.uniqueVisitors,
    };
  });

  const pathAccumulator = new Map<string, number>();
  for (const row of dailyByPathRows) {
    pathAccumulator.set(row.path, (pathAccumulator.get(row.path) || 0) + row.views);
  }
  for (const row of eventByPathRows) {
    pathAccumulator.set(row.path, (pathAccumulator.get(row.path) || 0) + row.views);
  }

  const topPages = Array.from(pathAccumulator.entries())
    .map(([path, views]) => ({
      path,
      views,
      label: buildPathLabel({ path, creatorPath, videoLabels }),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const summary = points.reduce(
    (acc, item) => {
      acc.totalViews += item.views;
      acc.uniqueVisitors += item.uniqueVisitors;
      return acc;
    },
    {
      totalViews: 0,
      uniqueVisitors: 0,
      topPage: topPages[0]?.label || null,
      topPageViews: topPages[0]?.views || 0,
    } as CreatorTrafficSummary
  );

  const recent = recentRows.map((row) => ({
    id: row.id,
    path: row.path,
    createdAt: row.createdAt.toISOString(),
    label: buildPathLabel({ path: row.path, creatorPath, videoLabels }),
  }));

  return {
    summary,
    points,
    topPages,
    recent,
  };
}
