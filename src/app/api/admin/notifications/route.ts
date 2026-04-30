import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminNotifications } from "@/db/schema";
import { requireAdminSession } from "@/server/admin-guard";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const notifications = await db.query.adminNotifications.findMany({
    orderBy: desc(adminNotifications.createdAt),
    limit: 50,
  });

  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .update(adminNotifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(adminNotifications.isRead, false));

  return NextResponse.json({ ok: true });
}
