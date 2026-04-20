import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { videoSchema } from "@/lib/auth-schemas";
import {
  buildAiDescription,
  createPublicSlug,
  detectVideoSource,
} from "@/lib/video-utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      sourceUrl: parsed.data.sourceUrl.trim(),
      source,
      publicSlug,
    })
    .returning();

  return NextResponse.json({ video });
}
