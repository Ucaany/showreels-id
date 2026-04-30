import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

const PIN_LIMIT = 3;

const pinVideoSchema = z.object({
  videoId: z.string().trim().min(1, "Video tidak valid."),
  pinned: z.boolean(),
});

function isPinnableVisibility(visibility: string) {
  return visibility === "public" || visibility === "semi_private";
}

async function getPinnedVideos(userId: string) {
  return db.query.videos.findMany({
    where: and(eq(videos.userId, userId), eq(videos.pinnedToProfile, true)),
    orderBy: [asc(videos.pinnedOrder), asc(videos.createdAt)],
    columns: {
      id: true,
      pinnedOrder: true,
    },
  });
}

async function normalizePinnedOrder(userId: string) {
  const pinnedVideos = await getPinnedVideos(userId);
  await Promise.all(
    pinnedVideos.slice(0, PIN_LIMIT).map((video, index) =>
      db
        .update(videos)
        .set({ pinnedOrder: index + 1, updatedAt: new Date() })
        .where(and(eq(videos.id, video.id), eq(videos.userId, userId)))
    )
  );
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner hanya untuk admin panel, tidak untuk pin video creator." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = pinVideoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data pin video tidak valid." },
      { status: 400 }
    );
  }

  const video = await db.query.videos.findFirst({
    where: and(eq(videos.id, parsed.data.videoId), eq(videos.userId, currentUser.id)),
    columns: {
      id: true,
      visibility: true,
      pinnedToProfile: true,
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Video tidak ditemukan." }, { status: 404 });
  }

  if (parsed.data.pinned && !isPinnableVisibility(video.visibility)) {
    return NextResponse.json(
      { error: "Hanya video Public atau Semi Private yang dapat dipin ke Bio Link." },
      { status: 400 }
    );
  }

  if (parsed.data.pinned) {
    const pinnedVideos = await getPinnedVideos(currentUser.id);
    const alreadyPinned = pinnedVideos.some((item) => item.id === video.id);

    if (!alreadyPinned && pinnedVideos.length >= PIN_LIMIT) {
      return NextResponse.json(
        { error: "Maksimal 3 video dapat dipin ke Bio Link.", code: "PIN_LIMIT_REACHED" },
        { status: 400 }
      );
    }

    await db
      .update(videos)
      .set({
        pinnedToProfile: true,
        pinnedOrder: alreadyPinned
          ? pinnedVideos.find((item) => item.id === video.id)?.pinnedOrder || 1
          : pinnedVideos.length + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, currentUser.id)));
  } else {
    await db
      .update(videos)
      .set({ pinnedToProfile: false, pinnedOrder: 0, updatedAt: new Date() })
      .where(and(eq(videos.id, video.id), eq(videos.userId, currentUser.id)));
    await normalizePinnedOrder(currentUser.id);
  }

  const pinnedVideos = await db.query.videos.findMany({
    where: and(eq(videos.userId, currentUser.id), eq(videos.pinnedToProfile, true)),
    orderBy: [asc(videos.pinnedOrder), asc(videos.createdAt)],
    columns: {
      id: true,
      pinnedOrder: true,
    },
  });

  if (pinnedVideos.length > PIN_LIMIT) {
    const overflowIds = pinnedVideos.slice(PIN_LIMIT).map((item) => item.id);

    await db
      .update(videos)
      .set({ pinnedToProfile: false, pinnedOrder: 0, updatedAt: new Date() })
      .where(
        and(
          eq(videos.userId, currentUser.id),
          eq(videos.pinnedToProfile, true),
          inArray(videos.id, overflowIds)
        )
      );
  }

  return NextResponse.json({
    success: true,
    pinnedVideoIds: pinnedVideos.slice(0, PIN_LIMIT).map((item) => item.id),
  });
}
