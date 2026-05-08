import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { handleMidtransWebhook, isMidtransConfigured } from "@/server/billing";

/**
 * Simple in-memory rate limiter untuk legacy endpoint.
 * Membatasi 10 request per menit per IP.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

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

/**
 * @deprecated Midtrans webhook dipertahankan untuk backward-compatibility transaksi lama.
 * Semua transaksi baru menggunakan Tripay callback di /api/billing/tripay/callback.
 */
export async function POST(request: Request) {
  const deprecationHeaders = {
    "X-Deprecated": "true",
    "X-Deprecation-Notice": "Use /api/billing/tripay/callback for new transactions",
  };

  // Rate limiting
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { ...deprecationHeaders, "Retry-After": "60" } }
    );
  }

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
    return NextResponse.json(
      { error: "Payload webhook tidak valid." },
      { status: 400, headers: deprecationHeaders }
    );
  }

  if (!verifySignature(body)) {
    return NextResponse.json(
      { error: "Signature Midtrans tidak valid." },
      { status: 401, headers: deprecationHeaders }
    );
  }

  const result = await handleMidtransWebhook(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: 404, headers: deprecationHeaders }
    );
  }

  return NextResponse.json({ ok: true }, { headers: deprecationHeaders });
}
