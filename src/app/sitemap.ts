import type { MetadataRoute } from "next";
import { and, eq, ne } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { users, videos } from "@/db/schema";
import {
  getCreatorBioHref,
  getCreatorPortfolioHref,
  getVideoDetailHref,
  isReservedPublicSlug,
} from "@/lib/public-route-utils";

export const revalidate = 3600;

const BASE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://showreels.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
  ];

  if (!isDatabaseConfigured || !db) {
    return staticRoutes;
  }

  try {
    const publicUsers = await db.query.users.findMany({
      where: and(eq(users.profileVisibility, "public"), ne(users.role, "owner")),
      columns: { username: true, updatedAt: true },
      limit: 8000,
    });

    const creatorEntries: MetadataRoute.Sitemap = [];
    for (const u of publicUsers) {
      const raw = u.username?.trim();
      if (!raw || isReservedPublicSlug(raw)) continue;
      creatorEntries.push(
        {
          url: `${BASE}${getCreatorBioHref(raw)}`,
          lastModified: u.updatedAt ?? now,
          changeFrequency: "weekly",
          priority: 0.85,
        },
        {
          url: `${BASE}${getCreatorPortfolioHref(raw)}`,
          lastModified: u.updatedAt ?? now,
          changeFrequency: "weekly",
          priority: 0.85,
        }
      );
    }

    const publicVideos = await db.query.videos.findMany({
      where: eq(videos.visibility, "public"),
      columns: { publicSlug: true, updatedAt: true },
      limit: 12000,
    });

    const videoEntries: MetadataRoute.Sitemap = publicVideos
      .filter((v) => v.publicSlug?.trim() && !isReservedPublicSlug(v.publicSlug))
      .map((v) => ({
        url: `${BASE}${getVideoDetailHref(v.publicSlug)}`,
        lastModified: v.updatedAt ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }));

    return [...staticRoutes, ...creatorEntries, ...videoEntries];
  } catch {
    return staticRoutes;
  }
}
