import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import { createUpgradeTransaction } from "@/server/billing";
import { getCurrentUser } from "@/server/current-user";

export async function POST() {
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

  const result = await createUpgradeTransaction({
    userId: currentUser.id,
    fullName: currentUser.name || "Creator",
    email: currentUser.contactEmail || currentUser.email,
    targetPlan: "free",
    billingCycle: "monthly",
  });

  if (!result.ok) {
    const status =
      result.code === "db_not_ready" || result.code === "billing_schema_missing"
        ? 503
        : result.code === "midtrans_not_configured"
          ? 412
          : 502;
    return NextResponse.json({ error: result.message, code: result.code }, { status });
  }

  return NextResponse.json(result);
}
