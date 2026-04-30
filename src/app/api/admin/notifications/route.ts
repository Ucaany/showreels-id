import { NextResponse } from "next/server";
import { desc, eq, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminNotificationSchedules, adminNotifications } from "@/db/schema";
import { requireAdminSession } from "@/server/admin-guard";

const scheduleSchema = z.object({
  targetType: z.enum(["all", "active", "blocked", "public", "private"]).default("all"),
  targetUserId: z.uuid().optional().nullable(),
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(3).max(1000),
  sendMode: z.enum(["now", "scheduled"]).default("now"),
  recurrence: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  activeDurationDays: z.coerce.number().int().min(1).max(365).default(1),
});

function addRecurrenceDate(value: Date, recurrence: "once" | "daily" | "weekly" | "monthly") {
  const next = new Date(value);

  if (recurrence === "daily") next.setDate(next.getDate() + 1);
  if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);

  return next;
}

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [notifications, schedules] = await Promise.all([
    db.query.adminNotifications.findMany({
      orderBy: desc(adminNotifications.createdAt),
      limit: 50,
    }),
    db.query.adminNotificationSchedules.findMany({
      orderBy: desc(adminNotificationSchedules.createdAt),
      limit: 50,
      with: {
        targetUser: {
          columns: {
            name: true,
            email: true,
            username: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ notifications, schedules });
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = scheduleSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.issues[0]?.message || "Payload notifikasi tidak valid." },
      { status: 400 }
    );
  }

  const now = new Date();
  const startsAt = payload.data.startsAt ? new Date(payload.data.startsAt) : now;
  const endsAt = payload.data.endsAt
    ? new Date(payload.data.endsAt)
    : new Date(startsAt.getTime() + payload.data.activeDurationDays * 24 * 60 * 60 * 1000);
  const shouldSendNow = payload.data.sendMode === "now" || startsAt <= now;
  const notificationId = crypto.randomUUID();
  const scheduleId = crypto.randomUUID();
  const nextRunAt = shouldSendNow
    ? payload.data.recurrence === "once"
      ? null
      : addRecurrenceDate(now, payload.data.recurrence)
    : startsAt;

  await db.transaction(async (tx) => {
    await tx.insert(adminNotifications).values({
      id: notificationId,
      type: "campaign",
      severity: shouldSendNow ? "success" : "info",
      title: payload.data.title,
      message: payload.data.message,
      entityType: "notification_schedule",
      entityId: scheduleId,
    });

    await tx.insert(adminNotificationSchedules).values({
      id: scheduleId,
      notificationId,
      targetType: payload.data.targetType,
      targetUserId: payload.data.targetUserId || null,
      title: payload.data.title,
      message: payload.data.message,
      status: shouldSendNow ? "sent" : "scheduled",
      sendMode: payload.data.sendMode,
      recurrence: payload.data.recurrence,
      startsAt,
      endsAt,
      lastSentAt: shouldSendNow ? now : null,
      nextRunAt,
      activeDurationDays: payload.data.activeDurationDays,
      metadata: {
        source: "admin_panel",
        immediate: shouldSendNow,
      },
      createdBy: admin.id,
    });
  });

  return NextResponse.json({
    ok: true,
    schedule: {
      id: scheduleId,
      notificationId,
      status: shouldSendNow ? "sent" : "scheduled",
      nextRunAt: nextRunAt?.toISOString() ?? null,
    },
  });
}

export async function PATCH() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const dueSchedules = await db.query.adminNotificationSchedules.findMany({
    where: or(
      eq(adminNotificationSchedules.status, "scheduled"),
      eq(adminNotificationSchedules.status, "sent")
    ),
    limit: 50,
  });

  for (const schedule of dueSchedules) {
    if (!schedule.nextRunAt || schedule.nextRunAt > now) continue;
    if (schedule.endsAt && schedule.nextRunAt > schedule.endsAt) {
      await db
        .update(adminNotificationSchedules)
        .set({ status: "cancelled", updatedAt: now })
        .where(eq(adminNotificationSchedules.id, schedule.id));
      continue;
    }

    const nextRunAt =
      schedule.recurrence === "once" ? null : addRecurrenceDate(now, schedule.recurrence);

    await db.transaction(async (tx) => {
      await tx.insert(adminNotifications).values({
        id: crypto.randomUUID(),
        type: "campaign",
        severity: "success",
        title: schedule.title,
        message: schedule.message,
        entityType: "notification_schedule",
        entityId: schedule.id,
      });

      await tx
        .update(adminNotificationSchedules)
        .set({
          status: schedule.recurrence === "once" ? "sent" : "scheduled",
          lastSentAt: now,
          nextRunAt,
          updatedAt: now,
        })
        .where(eq(adminNotificationSchedules.id, schedule.id));
    });
  }

  await db
    .update(adminNotifications)
    .set({ isRead: true, readAt: now })
    .where(eq(adminNotifications.isRead, false));

  await db
    .update(adminNotificationSchedules)
    .set({ status: "cancelled", updatedAt: now })
    .where(
      or(
        lte(adminNotificationSchedules.endsAt, now),
        eq(adminNotificationSchedules.status, "cancelled")
      )
    );

  return NextResponse.json({ ok: true });
}
