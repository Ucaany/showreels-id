import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { creatorSettings, users } from "@/db/schema";
import { privacySettingsSchema } from "@/lib/settings-schemas";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getOrCreateCreatorSettings } from "@/server/creator-settings";

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

  const settings = await getOrCreateCreatorSettings({
    userId: currentUser.id,
    billingEmail: currentUser.contactEmail || currentUser.email,
  });

  return NextResponse.json({
    publicProfile: settings.publicProfile,
    searchIndexing: settings.searchIndexing,
    showPublicEmail: settings.showPublicEmail,
    showSocialLinks: settings.showSocialLinks,
    showPublicStats: settings.showPublicStats,
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
  const parsed = privacySettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload privacy tidak valid." },
      { status: 400 }
    );
  }

  await getOrCreateCreatorSettings({
    userId: currentUser.id,
    billingEmail: currentUser.contactEmail || currentUser.email,
  });

  const [updated] = await db
    .update(creatorSettings)
    .set({
      publicProfile: parsed.data.publicProfile,
      searchIndexing: parsed.data.searchIndexing,
      showPublicEmail: parsed.data.showPublicEmail,
      showSocialLinks: parsed.data.showSocialLinks,
      showPublicStats: parsed.data.showPublicStats,
      updatedAt: new Date(),
    })
    .where(eq(creatorSettings.userId, currentUser.id))
    .returning();

  await db
    .update(users)
    .set({
      profileVisibility: parsed.data.publicProfile ? "public" : "private",
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id));

  return NextResponse.json({
    settings: updated,
  });
}
