import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { handleMidtransWebhook, isMidtransConfigured } from "@/server/billing";

function verifySignature(payload: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}) {
  const serverKey = (process.env.MIDTRANS_SERVER_KEY || "").trim();
  if (!serverKey) {
    return !isMidtransConfigured();
  }
  if (!payload.order_id || !payload.status_code || !payload.gross_amount) {
    return false;
  }
  if (!payload.signature_key) {
    return false;
  }

  const local = createHash("sha512")
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest("hex");

  return local === payload.signature_key;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        order_id?: string;
        status_code?: string;
        gross_amount?: string;
        signature_key?: string;
        transaction_status?: string;
        payment_type?: string;
        currency?: string;
        fraud_status?: string;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Payload webhook tidak valid." }, { status: 400 });
  }

  if (!verifySignature(body)) {
    return NextResponse.json({ error: "Signature Midtrans tidak valid." }, { status: 401 });
  }

  const result = await handleMidtransWebhook(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
