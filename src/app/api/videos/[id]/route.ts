import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { videoSchema } from "@/lib/auth-schemas";
import {
  buildAiDescription,
  createPublicSlug,
  detectVideoSource,
} from "@/lib/video-utils";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existingVideo = await db.query.videos.findFirst({
    where: and(eq(videos.id, id), eq(videos.userId, session.user.id)),
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

  const source = detectVideoSource(parsed.data.sourceUrl);
  if (!source) {
    return NextResponse.json(
      { error: "Gunakan URL YouTube, Google Drive, Instagram, atau Vimeo." },
      { status: 400 }
    );
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
      sourceUrl: parsed.data.sourceUrl.trim(),
      source,
      publicSlug,
      updatedAt: new Date(),
    })
    .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)))
    .returning();

  return NextResponse.json({ video });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [deleted] = await db
    .delete(videos)
    .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)))
    .returning({ id: videos.id });

  if (!deleted) {
    return NextResponse.json(
      { error: "Video tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
