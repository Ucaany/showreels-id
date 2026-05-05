import { NextResponse } from "next/server";
import { and, count, eq, ne, sql } from "drizzle-orm";
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

  const trimmedTitle = parsed.data.title.trim();
  const description =
    parsed.data.description?.trim() ||
    buildAiDescription({
      title: trimmedTitle,
      tags: parsed.data.tags,
      source,
    });

  const insertedVideo = await db.execute<{
    id: string;
    publicSlug: string;
    title: string;
    visibility: string;
  }>(sql`
    insert into "videos" (
      "id",
      "user_id",
      "title",
      "description",
      "tags",
      "visibility",
      "thumbnail_url",
      "extra_video_urls",
      "image_urls",
      "source_url",
      "source",
      "aspect_ratio",
      "output_type",
      "duration_label",
      "public_slug"
    ) values (
      ${crypto.randomUUID()},
      ${currentUser.id},
      ${trimmedTitle},
      ${description},
      ${JSON.stringify(parsed.data.tags)}::jsonb,
      ${parsed.data.visibility},
      ${normalizedThumbnailUrl},
      ${JSON.stringify(parsed.data.extraVideoUrls)}::jsonb,
      ${JSON.stringify(parsed.data.imageUrls)}::jsonb,
      ${sourceValidation.canonicalUrl},
      ${source},
      ${parsed.data.aspectRatio},
      ${parsed.data.outputType.trim()},
      ${parsed.data.durationLabel.trim()},
      ${publicSlug}
    ) returning
      "id",
      "public_slug" as "publicSlug",
      "title",
      "visibility"
  `);

  const video = insertedVideo.rows[0];

  await markFirstVideoUploaded(currentUser.id).catch(() => null);

  return NextResponse.json({ video });
}
