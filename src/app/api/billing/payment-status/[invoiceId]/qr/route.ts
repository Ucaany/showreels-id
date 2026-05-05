import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import {
  getBillingTransactionByInvoiceForUser,
  isMidtransConfigured,
  toBillingPaymentSummary,
} from "@/server/billing";
import { getCurrentUser } from "@/server/current-user";

function getMidtransAuthHeader() {
  const serverKey = (process.env.MIDTRANS_SERVER_KEY || "").trim();
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

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

  if (!isMidtransConfigured()) {
    return NextResponse.json({ error: "Layanan pembayaran belum dikonfigurasi." }, { status: 412 });
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
      Authorization: getMidtransAuthHeader(),
      Accept: "image/*,application/octet-stream,application/json",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Gagal mengambil QR pembayaran." },
      { status: 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") || "image/png";

  if (contentType.includes("application/json")) {
    const body = (await upstream.json().catch(() => null)) as
      | { url?: string; qr_url?: string }
      | null;
    const redirectUrl = body?.url || body?.qr_url;
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.json(
      { error: "QR pembayaran belum dapat dirender." },
      { status: 502 }
    );
  }

  const bytes = await upstream.arrayBuffer();
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
