import { z } from "zod";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import {
  createUpgradeTransaction,
  getPlanCatalog,
  getPlanPrice,
} from "@/server/billing";
import { getCurrentUser } from "@/server/current-user";

const checkoutSchema = z
  .object({
    plan_id: z.enum(["free", "creator", "business", "pro"]).optional(),
    planName: z.enum(["free", "creator", "business", "pro"]).optional(),
  })
  .strict();

function normalizePlanId(value: "free" | "creator" | "business" | "pro") {
  if (value === "pro") {
    return "creator";
  }
  return value;
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED", message: "Unauthorized" },
      { status: 401 }
    );
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      {
        success: false,
        code: "FORBIDDEN_OWNER",
        message: "Akun owner tidak menggunakan billing creator.",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        code: "INVALID_PAYLOAD",
        message: parsed.error.issues[0]?.message ?? "Payload checkout tidak valid.",
      },
      { status: 400 }
    );
  }

  const planInput = parsed.data.plan_id || parsed.data.planName || null;
  if (!planInput) {
    return NextResponse.json(
      { success: false, code: "INVALID_PLAN", message: "Paket tidak valid." },
      { status: 400 }
    );
  }

  const planId = normalizePlanId(planInput);
  const result = await createUpgradeTransaction({
    userId: currentUser.id,
    fullName: currentUser.name || "Creator",
    email: currentUser.contactEmail || currentUser.email,
    targetPlan: planId,
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

    return NextResponse.json(
      {
        success: false,
        code: result.code,
        message: result.message,
      },
      { status }
    );
  }

  const catalog = getPlanCatalog();
  const selectedPlan = catalog[planId];
  const planPrice = getPlanPrice(planId, "monthly");
  const accountName =
    currentUser.name?.trim() || currentUser.username || "Creator";
  const accountEmail = currentUser.contactEmail || currentUser.email;
  const creatorLink = currentUser.username
    ? `showreels-id.vercel.app/creator/${currentUser.username}`
    : null;

  const planPayload = {
    id: selectedPlan.name,
    name: selectedPlan.label,
    price: planPrice,
    period: "monthly" as const,
    bonus:
      planId === "business"
        ? {
            title:
              "Bonus Business: Free template Resume CV & Portofolio Canva senilai Rp50.000, akses selamanya.",
            value: 50000,
          }
        : null,
  };

  const accountPayload = {
    name: accountName,
    email: accountEmail,
    username: currentUser.username || null,
    creatorLink,
  };

  if (result.mode === "paid") {
    return NextResponse.json({
      success: true,
      mode: "paid",
      checkout_id: result.transaction.id,
      plan: planPayload,
      account: accountPayload,
      payment_url: result.payment.redirectUrl,
      payment: result.payment,
      transaction: result.transaction,
    });
  }

  return NextResponse.json({
    success: true,
    mode: "free",
    checkout_id: result.transaction.id,
    plan: planPayload,
    account: accountPayload,
    payment_url: null,
    transaction: result.transaction,
    subscription: result.subscription,
  });
}
