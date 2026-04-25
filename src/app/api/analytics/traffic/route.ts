import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import {
  clampAnalyticsRangeByMaxDays,
  countAnalyticsRangeDays,
  getCreatorTrafficAnalytics,
  resolveAnalyticsPeriod,
} from "@/server/creator-analytics";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan analytics creator." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedRange = resolveAnalyticsPeriod({
    period: searchParams.get("period"),
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });
  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
  const appliedRange = clampAnalyticsRangeByMaxDays({
    range: requestedRange,
    maxDays: entitlementState.entitlements.analyticsMaxDays,
  });
  const range = appliedRange.range;

  const analytics = await getCreatorTrafficAnalytics({
    userId: currentUser.id,
    username: currentUser.username || "creator",
    range,
  });

  return NextResponse.json({
    period: requestedRange.period,
    appliedPeriod: appliedRange.appliedPeriod,
    startDay: range.startDay,
    endDay: range.endDay,
    requestedRangeDays: countAnalyticsRangeDays(requestedRange),
    appliedRangeDays: appliedRange.appliedRangeDays,
    analyticsMaxDays: entitlementState.entitlements.analyticsMaxDays,
    planName: entitlementState.effectivePlan.planName,
    points: analytics.points,
  });
}
