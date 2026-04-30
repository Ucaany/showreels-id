import { NextResponse } from "next/server";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { videoSchema } from "@/lib/auth-schemas";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { markFirstVideoUploaded } from "@/server/onboarding";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";
import {
  buildAiDescription,
  createPublicSlug,
  normalizeAssetUrl,
  validateEmbedReadyVideoUrl,
} from "@/lib/video-utils";
import type { VideoSource } from "@/lib/types";

async function countPublicVideosBySource(input: {
  userId: string;
  source: VideoSource;
  excludeVideoId?: string;
}) {
  const filters = [
    eq(videos.userId, input.userId),
    eq(videos.source, input.source),
    eq(videos.visibility, "public"),
  ];
  if (input.excludeVideoId) {
    filters.push(ne(videos.id, input.excludeVideoId));
  }

  const rows = await db
    .select({ value: count() })
    .from(videos)
    .where(and(...filters));

  return rows[0]?.value ?? 0;
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner hanya untuk admin panel, tidak untuk submit video." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = videoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data video tidak valid." },
      { status: 400 }
    );
  }

  const sourceValidation = validateEmbedReadyVideoUrl(parsed.data.sourceUrl);
  if (!sourceValidation.ok || !sourceValidation.source || !sourceValidation.canonicalUrl) {
    return NextResponse.json(
      { error: sourceValidation.error || "URL video belum embed-ready." },
      { status: 400 }
    );
  }
  const source = sourceValidation.source;
  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
  const normalizedThumbnailUrl = normalizeAssetUrl(parsed.data.thumbnailUrl || "");

  if (!entitlementState.entitlements.customThumbnailEnabled && normalizedThumbnailUrl) {
    return NextResponse.json(
      {
        error: "Custom thumbnail hanya tersedia untuk plan Creator/Business.",
        code: "feature_not_available_for_plan",
      },
      { status: 403 }
    );
  }

  if (parsed.data.visibility === "public") {
    const sourceQuota = entitlementState.entitlements.sourceQuotaPerPlatform[source];
    if (typeof sourceQuota === "number") {
      const publicSourceCount = await countPublicVideosBySource({
        userId: currentUser.id,
        source,
      });
      if (publicSourceCount >= sourceQuota) {
        return NextResponse.json(
          {
            error: `Kuota video public untuk ${source} pada plan ${entitlementState.effectivePlan.planName.toUpperCase()} sudah habis (${sourceQuota} video/source).`,
            code: "source_quota_exceeded",
          },
          { status: 403 }
        );
      }
    }
  }

  const existingVideos = await db.query.videos.findMany({
    columns: { publicSlug: true },
  });

  const publicSlug = createPublicSlug(
    parsed.data.title,
    existingVideos.map((item) => item.publicSlug)
  );

  const [video] = await db
    .insert(videos)
    .values({
      userId: currentUser.id,
      title: parsed.data.title.trim(),
      description:
        parsed.data.description?.trim() ||
        buildAiDescription({
          title: parsed.data.title.trim(),
          tags: parsed.data.tags,
          source,
        }),
      tags: parsed.data.tags,
      visibility: parsed.data.visibility,
      thumbnailUrl: normalizedThumbnailUrl,
      extraVideoUrls: parsed.data.extraVideoUrls,
      imageUrls: parsed.data.imageUrls,
      sourceUrl: sourceValidation.canonicalUrl,
      source,
      aspectRatio: parsed.data.aspectRatio,
      outputType: parsed.data.outputType.trim(),
      durationLabel: parsed.data.durationLabel.trim(),
      publicSlug,
    })
    .returning({
      id: videos.id,
      publicSlug: videos.publicSlug,
      title: videos.title,
      visibility: videos.visibility,
    });

  await markFirstVideoUploaded(currentUser.id).catch(() => null);

  return NextResponse.json({ video });
}
