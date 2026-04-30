import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { userNotifications } from "@/db/schema";
import { requireCurrentUser } from "@/server/current-user";

const markReadSchema = z.object({
  notificationId: z.string().min(1).optional(),
  markAll: z.boolean().optional(),
});

export async function GET() {
  const user = await requireCurrentUser();

  const notifications = await db.query.userNotifications.findMany({
    where: eq(userNotifications.userId, user.id),
    orderBy: desc(userNotifications.deliveredAt),
    limit: 50,
  });

  const unreadCount = notifications.filter((item) => item.status === "unread").length;

  return NextResponse.json({
    notifications: notifications.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      status: item.status,
      deliveredAt: item.deliveredAt.toISOString(),
      readAt: item.readAt?.toISOString() ?? null,
    })),
    unreadCount,
  });
}

export async function PATCH(request: Request) {
  const user = await requireCurrentUser();
  const payload = markReadSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.issues[0]?.message || "Payload notifikasi tidak valid." },
      { status: 400 }
    );
  }

  const now = new Date();

  if (payload.data.markAll) {
    await db
      .update(userNotifications)
      .set({ status: "read", readAt: now })
      .where(and(eq(userNotifications.userId, user.id), eq(userNotifications.status, "unread")));

    return NextResponse.json({ ok: true });
  }

  if (!payload.data.notificationId) {
    return NextResponse.json({ error: "Pilih notifikasi yang ingin ditandai dibaca." }, { status: 400 });
  }

  await db
    .update(userNotifications)
    .set({ status: "read", readAt: now })
    .where(and(eq(userNotifications.userId, user.id), eq(userNotifications.id, payload.data.notificationId)));

  return NextResponse.json({ ok: true });
}
