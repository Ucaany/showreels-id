import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { linkProfileSchema } from "@/lib/settings-schemas";
import { sanitizeUsername } from "@/lib/username-rules";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

const USERNAME_CHANGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
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

  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
  const slug = currentUser.username || "creator";
  return NextResponse.json({
    slug,
    publicUrl: `/creator/${slug}`,
    usernameChangeCount: currentUser.usernameChangeCount || 0,
    usernameChangeWindowStart: currentUser.usernameChangeWindowStart,
    usernameChangeLimit: entitlementState.entitlements.usernameChangesPer30Days,
    planName: entitlementState.effectivePlan.planName,
  });
}

export async function PUT(request: Request) {
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

  const body = await request.json().catch(() => null);
  const parsed = linkProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Slug tidak valid." },
      { status: 400 }
    );
  }

  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
  const usernameChangeLimit = entitlementState.entitlements.usernameChangesPer30Days;
  const username = sanitizeUsername(parsed.data.slug);

  const existingUser = await db.query.users.findFirst({
    where: and(eq(users.username, username), ne(users.id, currentUser.id)),
    columns: { id: true },
  });
  if (existingUser) {
    return NextResponse.json({ error: "Slug sudah digunakan." }, { status: 409 });
  }

  let usernameChangeCount = currentUser.usernameChangeCount;
  let usernameChangeWindowStart = currentUser.usernameChangeWindowStart;
  if (username !== (currentUser.username || "")) {
    const now = new Date();
    const shouldResetWindow =
      !currentUser.usernameChangeWindowStart ||
      now.getTime() - currentUser.usernameChangeWindowStart.getTime() >=
        USERNAME_CHANGE_WINDOW_MS;

    if (shouldResetWindow) {
      usernameChangeCount = 1;
      usernameChangeWindowStart = now;
    } else if ((currentUser.usernameChangeCount || 0) >= usernameChangeLimit) {
      const activeWindowStart = currentUser.usernameChangeWindowStart ?? now;
      const resetAt = new Date(
        activeWindowStart.getTime() + USERNAME_CHANGE_WINDOW_MS
      );
      return NextResponse.json(
        {
          error: `Batas perubahan slug tercapai (${usernameChangeLimit}x/30 hari). Coba lagi setelah ${resetAt.toLocaleDateString(
            "id-ID",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          )}.`,
          code: "username_change_limit_exceeded",
        },
        { status: 429 }
      );
    } else {
      usernameChangeCount = (currentUser.usernameChangeCount || 0) + 1;
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      username,
      usernameChangeCount,
      usernameChangeWindowStart,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))
    .returning({
      username: users.username,
      usernameChangeCount: users.usernameChangeCount,
      usernameChangeWindowStart: users.usernameChangeWindowStart,
    });

  return NextResponse.json({
    slug: updated?.username || username,
    publicUrl: `/creator/${updated?.username || username}`,
    usernameChangeCount: updated?.usernameChangeCount || usernameChangeCount,
    usernameChangeWindowStart:
      updated?.usernameChangeWindowStart || usernameChangeWindowStart,
    usernameChangeLimit,
    planName: entitlementState.effectivePlan.planName,
  });
}
