import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import {
  refreshBillingTransactionStatusFromMidtrans,
  toBillingPaymentSummary,
} from "@/server/billing";
import { getCurrentUser } from "@/server/current-user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ invoiceId: string }> }
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

  const { invoiceId } = await context.params;
  const transaction = await refreshBillingTransactionStatusFromMidtrans({
    userId: currentUser.id,
    invoiceId,
  });

  if (!transaction) {
    return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({
    transaction,
    payment: toBillingPaymentSummary(transaction),
  });
}
