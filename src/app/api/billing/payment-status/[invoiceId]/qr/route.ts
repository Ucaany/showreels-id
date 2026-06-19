import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import {
  getBillingTransactionByInvoiceForUser,
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
  const transaction = await getBillingTransactionByInvoiceForUser(
    currentUser.id,
    invoiceId
  );
  if (!transaction) {
    return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  }

  const payment = toBillingPaymentSummary(transaction);
  if (!payment.qrUrl) {
    return NextResponse.json({ error: "QR belum tersedia." }, { status: 404 });
  }

  const upstream = await fetch(payment.qrUrl, {
    method: "GET",
    headers: {
      Accept: "image/*,application/octet-stream",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Jika fetch gagal, redirect langsung ke QR URL
    return NextResponse.redirect(payment.qrUrl);
  }

  const contentType = upstream.headers.get("content-type") || "image/png";

  const bytes = await upstream.arrayBuffer();
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
