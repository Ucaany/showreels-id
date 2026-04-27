import { and, count, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { visitorEvents, videos } from "@/db/schema";
import { normalizeStoredLinks } from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan dashboard creator." },
      { status: 403 }
    );
  }

  const links = normalizeStoredLinks(currentUser.customLinks);
  const activeLinks = links.filter((item) => item.enabled !== false);

  if (!isDatabaseConfigured) {
    return NextResponse.json({
      totalViews: 0,
      totalLinks: activeLinks.length,
      totalClicks: 0,
      ctr: 0,
      products: 0,
      revenue: 0,
      topLink: activeLinks[0]?.title || null,
    });
  }

  const creatorPath = `/creator/${currentUser.username || "creator"}`;
  const videoPathPrefix = "/v/";

  const [viewsResult] = await db
    .select({ value: count() })
    .from(visitorEvents)
    .where(sql`${visitorEvents.path} LIKE ${`${creatorPath}%`}`);

  const [clicksResult] = await db
    .select({ value: count() })
    .from(visitorEvents)
    .where(sql`${visitorEvents.path} LIKE ${`${videoPathPrefix}%`}`);

  const [productsResult] = await db
    .select({ value: count() })
    .from(videos)
    .where(and(eq(videos.userId, currentUser.id), eq(videos.visibility, "public")));

  const totalViews = viewsResult?.value ?? 0;
  const totalClicks = clicksResult?.value ?? 0;
  const ctr = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(2)) : 0;

  return NextResponse.json({
    totalViews,
    totalLinks: activeLinks.length,
    totalClicks,
    ctr,
    products: productsResult?.value ?? 0,
    revenue: 0,
    topLink: activeLinks[0]?.title || null,
  });
}
