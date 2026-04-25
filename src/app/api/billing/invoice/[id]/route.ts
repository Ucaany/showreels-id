import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { billingTransactions } from "@/db/schema";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "Database billing belum aktif." }, { status: 503 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const shouldDownload = searchParams.get("download") === "1";
  const invoice = await db.query.billingTransactions.findFirst({
    where: and(
      eq(billingTransactions.invoiceId, id),
      eq(billingTransactions.userId, currentUser.id)
    ),
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  }

  if (shouldDownload) {
    const lines = [
      `INVOICE: ${invoice.invoiceId}`,
      `PLAN: ${invoice.planName} (${invoice.billingCycle})`,
      `AMOUNT: ${invoice.currency} ${invoice.amount}`,
      `STATUS: ${invoice.status}`,
      `DATE: ${invoice.createdAt.toISOString()}`,
      `PAYMENT_METHOD: ${invoice.paymentMethod || "-"}`,
      `PROVIDER: ${invoice.provider}`,
    ].join("\n");

    return new Response(lines, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${invoice.invoiceId}.txt"`,
      },
    });
  }

  return NextResponse.json({
    invoice,
  });
}
