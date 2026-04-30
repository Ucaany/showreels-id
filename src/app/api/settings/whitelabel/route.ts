import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { creatorSettings } from "@/db/schema";
import { whitelabelSettingsSchema } from "@/lib/settings-schemas";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getOrCreateCreatorSettings } from "@/server/creator-settings";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

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

  const [settings, entitlementState] = await Promise.all([
    getOrCreateCreatorSettings({
      userId: currentUser.id,
      billingEmail: currentUser.contactEmail || currentUser.email,
    }),
    getCreatorEntitlementsForUser(currentUser.id),
  ]);

  const planName = entitlementState.effectivePlan.planName;
  const available = entitlementState.entitlements.whitelabelEnabled;
  return NextResponse.json({
    available,
    planName,
    enabled: available ? settings.whitelabelEnabled : false,
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

  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
  const planName = entitlementState.effectivePlan.planName;
  if (!entitlementState.entitlements.whitelabelEnabled) {
    return NextResponse.json(
      {
        error: "Fitur whitelabel hanya tersedia untuk plan Business.",
        code: "feature_not_available_for_plan",
      },
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
