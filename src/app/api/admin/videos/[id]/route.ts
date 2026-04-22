import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { videos } from "@/db/schema";
import {
  detectVideoSource,
  normalizeAssetUrl,
  normalizeHttpUrl,
} from "@/lib/video-utils";
import { isProtectedOwnerTarget } from "@/server/admin-access";
import { requireAdminSession } from "@/server/admin-guard";

const adminVideoUpdateSchema = z.object({
  title: z.string().trim().min(4, "Judul minimal 4 karakter.").max(180),
  description: z.string().trim().max(1500).default(""),
  visibility: z.enum(["public", "draft", "private"]),
  sourceUrl: z
    .url("URL sumber belum valid.")
    .transform((value) => normalizeHttpUrl(value)),
  thumbnailUrl: z
    .string()
    .trim()
    .max(1200)
    .transform((value) => normalizeAssetUrl(value))
    .default(""),
  outputType: z.string().trim().max(80).default(""),
  durationLabel: z.string().trim().max(30).default(""),
  aspectRatio: z.enum(["landscape", "portrait"]),
});

async function getEditableVideo(id: string) {
  const target = await db.query.videos.findFirst({
    where: eq(videos.id, id),
    with: { author: true },
  });

  if (!target) {
    return { error: "Video tidak ditemukan.", status: 404 as const };
  }

  if (!target.author || isProtectedOwnerTarget(target.author)) {
    return {
      error: "Video owner/admin tidak bisa diubah dari panel ini.",
      status: 403 as const,
    };
  }

  return { target };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const editable = await getEditableVideo(id);
  if ("error" in editable) {
    return NextResponse.json({ error: editable.error }, { status: editable.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminVideoUpdateSchema.safeParse(body);
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

  const [updated] = await db
    .update(videos)
    .set({
      title: parsed.data.title,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
      sourceUrl: parsed.data.sourceUrl,
      source,
      thumbnailUrl: parsed.data.thumbnailUrl,
      outputType: parsed.data.outputType,
      durationLabel: parsed.data.durationLabel,
      aspectRatio: parsed.data.aspectRatio,
      updatedAt: new Date(),
    })
    .where(eq(videos.id, id))
    .returning();

  return NextResponse.json({ video: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const editable = await getEditableVideo(id);
  if ("error" in editable) {
    return NextResponse.json({ error: editable.error }, { status: editable.status });
  }

  const [deleted] = await db
    .delete(videos)
    .where(eq(videos.id, id))
    .returning({ id: videos.id });

  if (!deleted) {
    return NextResponse.json({ error: "Video tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
