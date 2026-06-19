import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export const revalidate = 300;

export async function GET() {
  try {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [videoCount] = await db
      .select({ count: count() })
      .from(videos)
      .where(eq(videos.visibility, "public"));

    return NextResponse.json({
      users: userCount?.count ?? 0,
      videos: videoCount?.count ?? 0,
    });
  } catch {
    return NextResponse.json({ users: 0, videos: 0 }, { status: 500 });
  }
}