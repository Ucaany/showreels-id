import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getPlanCatalog, getOrCreateSubscription } from "@/server/billing";
import { getOrCreateCreatorSettings } from "@/server/creator-settings";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan billing creator." },
      { status: 403 }
    );
  }

  const [subscription, settings, entitlementState] = await Promise.all([
    getOrCreateSubscription(currentUser.id),
    getOrCreateCreatorSettings({
      userId: currentUser.id,
      billingEmail: currentUser.contactEmail || currentUser.email,
    }),
    getCreatorEntitlementsForUser(currentUser.id),
  ]);

  return NextResponse.json({
    plan: subscription,
    effectivePlan: entitlementState.effectivePlan,
    entitlements: entitlementState.entitlements,
    settings: {
      billingEmail: settings.billingEmail || currentUser.contactEmail || currentUser.email,
      paymentMethod: settings.paymentMethod,
      taxInfo: settings.taxInfo,
      invoiceNotes: settings.invoiceNotes,
    },
    billingCycle: "monthly",
    catalog: getPlanCatalog(),
  });
}
