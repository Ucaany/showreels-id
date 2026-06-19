import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { billingTransactions, users } from "@/db/schema";
import { requireAdminSession } from "@/server/admin-guard";

function csvCell(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      invoiceId: billingTransactions.invoiceId,
      userEmail: users.email,
      planName: billingTransactions.planName,
      billingCycle: billingTransactions.billingCycle,
      amount: billingTransactions.amount,
      currency: billingTransactions.currency,
      status: billingTransactions.status,
      provider: billingTransactions.provider,
      paymentMethod: billingTransactions.paymentMethod,
      paidAt: billingTransactions.paidAt,
      createdAt: billingTransactions.createdAt,
    })
    .from(billingTransactions)
    .innerJoin(users, eq(billingTransactions.userId, users.id))
    .orderBy(desc(billingTransactions.createdAt))
    .limit(1000);

  const header = [
    "invoice_id",
    "user_email",
    "plan_name",
    "billing_cycle",
    "amount",
    "currency",
    "status",
    "provider",
    "payment_method",
    "paid_at",
    "created_at",
  ];

  const csv = [
    header.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.invoiceId,
        row.userEmail,
        row.planName,
        row.billingCycle,
        row.amount,
        row.currency,
        row.status,
        row.provider,
        row.paymentMethod,
        row.paidAt?.toISOString() ?? "",
        row.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="showreels-transactions.csv"`,
    },
  });
}
