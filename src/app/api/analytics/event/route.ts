import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const VISITOR_COOKIE = "showreels_visitor_id";

const analyticsEventSchema = z.object({
  eventType: z.enum(["page_view", "video_view", "link_click", "share", "like"]).default("page_view"),
  path: z.string().trim().max(300).default("/"),
  userId: z.uuid().optional().nullable(),
  videoId: z.string().trim().max(120).optional().nullable(),
  targetType: z.string().trim().max(80).default("page"),
  targetId: z.string().trim().max(160).default(""),
  targetUrl: z.string().trim().max(500).default(""),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = analyticsEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload analytics tidak valid." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingVisitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || crypto.randomUUID();

  // Analytics events are tracked via visitor_events table (visitor-tracker).
  // This endpoint maintains backward compatibility for any client-side calls.

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
