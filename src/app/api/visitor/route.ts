import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { visitorEvents } from "@/db/schema";

const VISITOR_COOKIE = "videoport_visitor_id";

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const existingVisitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || crypto.randomUUID();
  const body = (await request.json().catch(() => null)) as { path?: string } | null;
  const path = body?.path?.slice(0, 250) || "/";

  const existingEvent = await db.query.visitorEvents.findFirst({
    where: and(
      eq(visitorEvents.visitorId, visitorId),
      gte(visitorEvents.createdAt, getTodayStart())
    ),
    columns: { id: true },
  });

  if (!existingEvent) {
    await db.insert(visitorEvents).values({
      visitorId,
      path,
    });
  }

  const response = NextResponse.json({ ok: true });
  if (!existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}
