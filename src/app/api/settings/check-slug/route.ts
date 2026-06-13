import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { users } from "@/db/schema";
import {
  isReservedUsername,
  isUsernameFormatValid,
  sanitizeUsername,
} from "@/lib/username-rules";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan settings creator." },
      { status: 403 }
    );
  }

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
      available: process.env.NODE_ENV !== "production",
      reason: process.env.NODE_ENV !== "production" ? "local_preview" : "idle",
    });
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.username, sanitized),
    columns: { id: true },
  });
  const ownedByCurrentUser = Boolean(existing?.id && existing.id === currentUser.id);

  return NextResponse.json({
    slug: input,
    sanitized,
    available: !existing || ownedByCurrentUser,
    reason: !existing ? "available" : ownedByCurrentUser ? "owned_by_current_user" : "taken",
    ownedByCurrentUser,
    owned_by_current_user: ownedByCurrentUser,
  });
}
