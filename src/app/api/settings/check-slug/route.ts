import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { users } from "@/db/schema";
import {
  isReservedUsername,
  isUsernameFormatValid,
  sanitizeUsername,
} from "@/lib/username-rules";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("slug") ?? "";
  const sanitized = sanitizeUsername(input);

  if (!isUsernameFormatValid(sanitized) || sanitized.length < 3) {
    return NextResponse.json({
      slug: input,
      sanitized,
      available: false,
      reason: "invalid",
    });
  }

  if (isReservedUsername(sanitized)) {
    return NextResponse.json({
      slug: input,
      sanitized,
      available: false,
      reason: "reserved",
    });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json({
      slug: input,
      sanitized,
      available: false,
      reason: "idle",
    });
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.username, sanitized),
    columns: { id: true },
  });

  return NextResponse.json({
    slug: input,
    sanitized,
    available: !existing,
    reason: existing ? "taken" : "available",
  });
}
