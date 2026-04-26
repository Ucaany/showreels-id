import { z } from "zod";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import { createUpgradeTransaction } from "@/server/billing";
import { getCurrentUser } from "@/server/current-user";

const upgradeSchema = z.object({
  planName: z.enum(["creator", "business", "pro"]).transform((value) => {
    if (value === "pro") {
      return "creator";
    }
    return value;
  }),
}).strict();

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => null);
  const parsed = upgradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload upgrade tidak valid." },
      { status: 400 }
    );
  }

  const result = await createUpgradeTransaction({
    userId: currentUser.id,
    fullName: currentUser.name || "Creator",
    email: currentUser.contactEmail || currentUser.email,
    targetPlan: parsed.data.planName,
    billingCycle: "monthly",
  });

  if (!result.ok) {
    const status =
      result.code === "midtrans_not_configured"
        ? 412
        : result.code === "same_plan_active"
          ? 409
        : result.code === "invalid_billing_cycle"
          ? 400
        : result.code === "db_not_ready" || result.code === "billing_schema_missing"
          ? 503
          : 502;

    return NextResponse.json({ error: result.message, code: result.code }, { status });
  }

  return NextResponse.json(result);
}
