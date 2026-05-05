import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { creatorSettings } from "@/db/schema";
import { paymentSettingsSchema } from "@/lib/settings-schemas";
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
    billingEmail: settings.billingEmail || currentUser.contactEmail || currentUser.email,
    paymentMethod: settings.paymentMethod,
    taxInfo: settings.taxInfo,
    invoiceNotes: settings.invoiceNotes,
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
  const parsed = paymentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data payment tidak valid." },
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
      billingEmail: parsed.data.billingEmail,
      paymentMethod: parsed.data.paymentMethod,
      taxInfo: parsed.data.taxInfo,
      invoiceNotes: parsed.data.invoiceNotes,
      updatedAt: new Date(),
    })
    .where(eq(creatorSettings.userId, currentUser.id))
    .returning({
      billingEmail: creatorSettings.billingEmail,
      paymentMethod: creatorSettings.paymentMethod,
      taxInfo: creatorSettings.taxInfo,
      invoiceNotes: creatorSettings.invoiceNotes,
    });

  return NextResponse.json({
    settings: updated,
  });
}
