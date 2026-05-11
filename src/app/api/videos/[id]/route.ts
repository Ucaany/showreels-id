import { NextResponse } from "next/server";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { videoSchema } from "@/lib/auth-schemas";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";
import { invalidatePublicProfileCache } from "@/server/redis-public-cache";
import {
  revalidateCreatorPublicPaths,
  revalidatePublicVideoPages,
} from "@/server/revalidate-public-paths";
import {
  buildAiDescription,
  createPublicSlug,
  DEFAULT_THUMBNAIL_URL,
  detectMediaType,
  detectPreviewType,
  fetchTiktokThumbnail,
  getAutoThumbnailFromVideoUrl,
  normalizeAssetUrl,
  resolveThumbnailUrl,
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner hanya untuk admin panel, tidak untuk kelola video creator." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const existingVideo = await db.query.videos.findFirst({
    where: and(eq(videos.id, id), eq(videos.userId, currentUser.id)),
    columns: {
      id: true,
      title: true,
      publicSlug: true,
    },
  });

  if (!existingVideo) {
    return NextResponse.json(
      { error: "Video tidak ditemukan." },
      { status: 404 }
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
  const mediaType = detectMediaType({
    sourceUrl: sourceValidation.canonicalUrl,
    imageUrls: parsed.data.imageUrls,
  });
  const previewType = mediaType === "image" ? "image" : detectPreviewType(source);
  const platformThumbnailUrl = getAutoThumbnailFromVideoUrl(sourceValidation.canonicalUrl);
  const autoThumbnailUrl =
    source === "tiktok" ? await fetchTiktokThumbnail(sourceValidation.canonicalUrl) : "";
  const resolvedThumbnailUrl = resolveThumbnailUrl({
    customThumbnailUrl: normalizedThumbnailUrl,
    autoThumbnailUrl,
    platformThumbnailUrl,
    fallbackDefault: DEFAULT_THUMBNAIL_URL,
  });
  const previewImage = resolvedThumbnailUrl;

  if (!entitlementState.entitlements.customThumbnailEnabled && normalizedThumbnailUrl) {
    return NextResponse.json(
      {
        error: "Custom thumbnail hanya tersedia untuk plan Pro/Business.",
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
        excludeVideoId: existingVideo.id,
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

  const trimmedTitle = parsed.data.title.trim();
  const existingSlugs = await db.query.videos.findMany({
    where: ne(videos.id, id),
    columns: { publicSlug: true },
  });

  const publicSlug =
    trimmedTitle === existingVideo.title
      ? existingVideo.publicSlug
      : createPublicSlug(
          trimmedTitle,
          existingSlugs.map((item) => item.publicSlug)
        );

  const [video] = await db
    .update(videos)
    .set({
      title: trimmedTitle,
      description:
        parsed.data.description?.trim() ||
        buildAiDescription({
          title: trimmedTitle,
          tags: parsed.data.tags,
          source,
        }),
      tags: parsed.data.tags,
      visibility: parsed.data.visibility,
      thumbnailUrl: resolvedThumbnailUrl,
      previewImage,
      previewType,
      mediaType,
      extraVideoUrls: parsed.data.extraVideoUrls,
      imageUrls: parsed.data.imageUrls,
      sourceUrl: sourceValidation.canonicalUrl,
      source,
      aspectRatio: parsed.data.aspectRatio,
      outputType: parsed.data.outputType.trim(),
      durationLabel: parsed.data.durationLabel.trim(),
      publicSlug,
      updatedAt: new Date(),
    })
    .where(and(eq(videos.id, id), eq(videos.userId, currentUser.id)))
    .returning({
      id: videos.id,
      publicSlug: videos.publicSlug,
      title: videos.title,
      visibility: videos.visibility,
    });

  const uname = currentUser.username?.trim();
  if (uname) void invalidatePublicProfileCache(uname);
  if (uname) revalidateCreatorPublicPaths(uname);
  revalidatePublicVideoPages([existingVideo.publicSlug, video.publicSlug]);

  return NextResponse.json({ video });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner hanya untuk admin panel, tidak untuk kelola video creator." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const [deleted] = await db
    .delete(videos)
    .where(and(eq(videos.id, id), eq(videos.userId, currentUser.id)))
    .returning({ id: videos.id, publicSlug: videos.publicSlug });

  if (!deleted) {
    return NextResponse.json(
      { error: "Video tidak ditemukan." },
      { status: 404 }
    );
  }

  const uname = currentUser.username?.trim();
  if (uname) void invalidatePublicProfileCache(uname);
  if (uname) revalidateCreatorPublicPaths(uname);
  revalidatePublicVideoPages([deleted.publicSlug]);

  return NextResponse.json({ success: true });
}
