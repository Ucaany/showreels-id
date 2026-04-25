import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import {
  getCreatorTrafficAnalytics,
  resolveAnalyticsPeriod,
} from "@/server/creator-analytics";

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
  const range = resolveAnalyticsPeriod({
    period: searchParams.get("period"),
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  const analytics = await getCreatorTrafficAnalytics({
    userId: currentUser.id,
    username: currentUser.username || "creator",
    range,
  });

  return NextResponse.json({
    period: range.period,
    startDay: range.startDay,
    endDay: range.endDay,
    ...analytics.summary,
  });
}
