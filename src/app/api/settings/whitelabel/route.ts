import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { billingSubscriptions, creatorSettings } from "@/db/schema";
import { whitelabelSettingsSchema } from "@/lib/settings-schemas";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getOrCreateCreatorSettings } from "@/server/creator-settings";

function isWhitelabelAvailable(planName: string) {
  return planName === "pro" || planName === "business";
}

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

  const [settings, subscription] = await Promise.all([
    getOrCreateCreatorSettings({
      userId: currentUser.id,
      billingEmail: currentUser.contactEmail || currentUser.email,
    }),
    db.query.billingSubscriptions.findFirst({
      where: eq(billingSubscriptions.userId, currentUser.id),
      columns: { planName: true },
    }),
  ]);

  const planName = subscription?.planName || "free";
  return NextResponse.json({
    available: isWhitelabelAvailable(planName),
    planName,
    enabled: settings.whitelabelEnabled,
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
  const parsed = whitelabelSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload whitelabel tidak valid." },
      { status: 400 }
    );
  }

  const subscription = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, currentUser.id),
    columns: { planName: true },
  });
  const planName = subscription?.planName || "free";
  if (!isWhitelabelAvailable(planName)) {
    return NextResponse.json(
      { error: "Fitur whitelabel hanya tersedia untuk plan Pro/Business." },
      { status: 403 }
    );
  }

  await getOrCreateCreatorSettings({
    userId: currentUser.id,
    billingEmail: currentUser.contactEmail || currentUser.email,
  });

  const [updated] = await db
    .update(creatorSettings)
    .set({
      whitelabelEnabled: parsed.data.enabled,
      updatedAt: new Date(),
    })
    .where(eq(creatorSettings.userId, currentUser.id))
    .returning({
      whitelabelEnabled: creatorSettings.whitelabelEnabled,
    });

  return NextResponse.json({
    available: true,
    planName,
    enabled: updated?.whitelabelEnabled || false,
  });
}
