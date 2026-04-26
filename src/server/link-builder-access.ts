import { NextResponse } from "next/server";
import type { BillingPlanName } from "@/server/billing";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export function canUseBuildLink(planName: BillingPlanName | string | null | undefined) {
  return planName === "creator" || planName === "business";
}

export function buildLinkLockedJsonResponse() {
  return NextResponse.json(
    {
      error: "Build Link tersedia untuk plan Creator dan Business.",
      code: "FEATURE_LOCKED",
      requiredPlan: "creator",
    },
    { status: 403 }
  );
}

export async function requireBuildLinkAccess(userId: string) {
  const entitlementState = await getCreatorEntitlementsForUser(userId);
  return {
    entitlementState,
    allowed: canUseBuildLink(entitlementState.effectivePlan.planName),
  };
}
