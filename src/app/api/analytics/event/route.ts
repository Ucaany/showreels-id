import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { analyticsEvents, videoEngagementStats } from "@/db/schema";

const VISITOR_COOKIE = "showreels_visitor_id";

const analyticsEventSchema = z.object({
  eventType: z.enum(["page_view", "video_view", "link_click", "share", "like"]).default("page_view"),
  path: z.string().trim().max(300).default("/"),
  userId: z.uuid().optional().nullable(),
  videoId: z.string().trim().max(120).optional().nullable(),
  targetType: z.string().trim().max(80).default("page"),
  targetId: z.string().trim().max(160).default(""),
  targetUrl: z.string().trim().max(500).default(""),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

function getDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/.test(ua)) return "mobile";
  if (/ipad|tablet/.test(ua)) return "tablet";
  return "desktop";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = analyticsEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload analytics tidak valid." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const existingVisitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || crypto.randomUUID();

  if (isDatabaseConfigured) {
    const country = headerStore.get("x-vercel-ip-country") || "";
    const city = headerStore.get("x-vercel-ip-city") || "";
    const region = headerStore.get("x-vercel-ip-country-region") || "";
    const referrer = headerStore.get("referer") || "";
    const device = getDevice(headerStore.get("user-agent") || "");

    await db.insert(analyticsEvents).values({
      visitorId,
      eventType: parsed.data.eventType,
      path: parsed.data.path || "/",
      userId: parsed.data.userId || null,
      videoId: parsed.data.videoId || null,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      targetUrl: parsed.data.targetUrl,
      country,
      city,
      region,
      referrer,
      device,
      metadata: parsed.data.metadata,
    });

    if (parsed.data.videoId) {
      const existing = await db.query.videoEngagementStats.findFirst({
        where: eq(videoEngagementStats.videoId, parsed.data.videoId),
        columns: { videoId: true },
      });
      const increments = {
        views: parsed.data.eventType === "video_view" ? 1 : 0,
        clicks: parsed.data.eventType === "link_click" ? 1 : 0,
        shares: parsed.data.eventType === "share" ? 1 : 0,
        likes: parsed.data.eventType === "like" ? 1 : 0,
      };

      if (existing) {
        await db
          .update(videoEngagementStats)
          .set({
            views: sql`${videoEngagementStats.views} + ${increments.views}`,
            clicks: sql`${videoEngagementStats.clicks} + ${increments.clicks}`,
            shares: sql`${videoEngagementStats.shares} + ${increments.shares}`,
            likes: sql`${videoEngagementStats.likes} + ${increments.likes}`,
            lastEventAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(videoEngagementStats.videoId, parsed.data.videoId));
      } else {
        await db.insert(videoEngagementStats).values({
          videoId: parsed.data.videoId,
          views: increments.views,
          clicks: increments.clicks,
          shares: increments.shares,
          likes: increments.likes,
          uniqueVisitors: 1,
          lastEventAt: new Date(),
        });
      }
    }
  }

  const response = NextResponse.json({ ok: true });
  if (!existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}
