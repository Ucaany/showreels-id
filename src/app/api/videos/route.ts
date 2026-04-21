import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { videoSchema } from "@/lib/auth-schemas";
import { isAdminEmail } from "@/server/admin-access";
import {
  buildAiDescription,
  createPublicSlug,
  detectVideoSource,
  normalizeAssetUrl,
} from "@/lib/video-utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(session.user.email)) {
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

  const source = detectVideoSource(parsed.data.sourceUrl);
  if (!source) {
    return NextResponse.json(
      { error: "Gunakan URL YouTube, Google Drive, Instagram, atau Vimeo." },
      { status: 400 }
    );
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
      userId: session.user.id,
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
      thumbnailUrl: normalizeAssetUrl(parsed.data.thumbnailUrl || ""),
      extraVideoUrls: parsed.data.extraVideoUrls,
      imageUrls: parsed.data.imageUrls,
      sourceUrl: parsed.data.sourceUrl.trim(),
      source,
      publicSlug,
    })
    .returning();

  return NextResponse.json({ video });
}
