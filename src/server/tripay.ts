/**
 * Tripay Payment Gateway Client
 *
 * Menggantikan Midtrans sebagai payment gateway utama.
 * Dokumentasi: https://tripay.co.id/developer
 */

import { createHmac } from "node:crypto";
import { normalizeEnvValue, hasPlaceholderEnvValue } from "@/lib/env-utils";

// --- Types ---

export type TripayConfig = {
  apiKey: string;
  privateKey: string;
  merchantCode: string;
  isProduction: boolean;
  baseUrl: string;
  callbackSecret: string;
};

export type TripayClosedPaymentRequest = {
  method: string;
  merchant_ref: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  order_items: Array<{
    sku?: string;
    name: string;
    price: number;
    quantity: number;
    product_url?: string;
    image_url?: string;
  }>;
  callback_url: string;
  return_url: string;
  expired_time?: number;
  signature: string;
};

export type TripayClosedPaymentResponse = {
  success: boolean;
  message: string;
  data?: {
    reference: string;
    merchant_ref: string;
    payment_selection_type: string;
    payment_method: string;
    payment_name: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    callback_url: string;
    return_url: string;
    amount: number;
    fee_merchant: number;
    fee_customer: number;
    total_fee: number;
    amount_received: number;
    pay_code: string;
    pay_url: string;
    checkout_url: string;
    status: string;
    expired_time: number;
    order_items: Array<{
      sku: string;
      name: string;
      price: number;
      quantity: number;
      subtotal: number;
    }>;
    instructions: Array<{
      title: string;
      steps: string[];
    }>;
    qr_string: string;
    qr_url: string;
  };
};

export type TripayCallbackPayload = {
  reference: string;
  merchant_ref: string;
  payment_selection_type: string;
  payment_method: string;
  payment_method_code: string;
  total_amount: number;
  fee_merchant: number;
  fee_customer: number;
  total_fee: number;
  amount_received: number;
  is_closed_payment: number;
  status: "PAID" | "EXPIRED" | "FAILED" | "UNPAID" | "REFUND";
  paid_at?: number;
  note?: string;
};

export type TripayTransactionStatus = "PAID" | "UNPAID" | "EXPIRED" | "FAILED" | "REFUND";

export type InternalTransactionStatus = "paid" | "pending" | "expired" | "failed" | "cancelled";

// --- Config ---

export function getTripayConfig(): TripayConfig {
  const apiKey = normalizeEnvValue(process.env.TRIPAY_API_KEY);
  const privateKey = normalizeEnvValue(process.env.TRIPAY_PRIVATE_KEY);
  const merchantCode = normalizeEnvValue(process.env.TRIPAY_MERCHANT_CODE);
  const callbackSecret = normalizeEnvValue(process.env.TRIPAY_CALLBACK_SECRET);
  const isProduction =
    normalizeEnvValue(process.env.TRIPAY_IS_PRODUCTION).toLowerCase() === "true";

  return {
    apiKey,
    privateKey,
    merchantCode,
    isProduction,
    baseUrl: isProduction
      ? "https://tripay.co.id/api"
      : "https://tripay.co.id/api-sandbox",
    callbackSecret,
  };
}

export function isTripayConfigured(): boolean {
  const config = getTripayConfig();
  return (
    !hasPlaceholderEnvValue(config.apiKey) &&
    !hasPlaceholderEnvValue(config.privateKey) &&
    !hasPlaceholderEnvValue(config.merchantCode) &&
    config.apiKey.length > 0 &&
    config.privateKey.length > 0 &&
    config.merchantCode.length > 0
  );
}

// --- Signature ---

export function createTripaySignature(input: {
  merchantCode: string;
  merchantRef: string;
  amount: number;
  privateKey: string;
}): string {
  const { merchantCode, merchantRef, amount, privateKey } = input;
  return createHmac("sha256", privateKey)
    .update(`${merchantCode}${merchantRef}${amount}`)
    .digest("hex");
}

export function verifyTripayCallbackSignature(input: {
  callbackSignature: string;
  rawBody: string;
  privateKey: string;
}): boolean {
  const { callbackSignature, rawBody, privateKey } = input;
  const computed = createHmac("sha256", privateKey)
    .update(rawBody)
    .digest("hex");
  return computed === callbackSignature;
}

// --- Status Mapping ---

export function mapTripayStatusToInternal(tripayStatus: TripayTransactionStatus): InternalTransactionStatus {
  switch (tripayStatus) {
    case "PAID":
      return "paid";
    case "UNPAID":
      return "pending";
    case "EXPIRED":
      return "expired";
    case "FAILED":
      return "failed";
    case "REFUND":
      return "cancelled";
    default:
      return "pending";
  }
}

export function mapTripayStatusToSubscription(tripayStatus: TripayTransactionStatus): "active" | "pending" | "expired" | "failed" {
  switch (tripayStatus) {
    case "PAID":
      return "active";
    case "UNPAID":
      return "pending";
    case "EXPIRED":
      return "expired";
    case "FAILED":
      return "failed";
    default:
      return "pending";
  }
}

// --- API Calls ---

export async function createTripayClosedPayment(input: {
  merchantRef: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethod: string;
  orderItemName: string;
  callbackUrl: string;
  returnUrl: string;
  expiredTimeSeconds?: number;
}): Promise<{ ok: true; data: TripayClosedPaymentResponse["data"] } | { ok: false; message: string }> {
  const config = getTripayConfig();

  if (!isTripayConfigured()) {
    return {
      ok: false,
      message: "Tripay belum dikonfigurasi. Pastikan TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, dan TRIPAY_MERCHANT_CODE sudah diisi.",
    };
  }

  const signature = createTripaySignature({
    merchantCode: config.merchantCode,
    merchantRef: input.merchantRef,
    amount: input.amount,
    privateKey: config.privateKey,
  });

  const payload: TripayClosedPaymentRequest = {
    method: input.paymentMethod,
    merchant_ref: input.merchantRef,
    amount: input.amount,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    order_items: [
      {
        name: input.orderItemName,
        price: input.amount,
        quantity: 1,
      },
    ],
    callback_url: input.callbackUrl,
    return_url: input.returnUrl,
    expired_time: input.expiredTimeSeconds
      ? Math.floor(Date.now() / 1000) + input.expiredTimeSeconds
      : Math.floor(Date.now() / 1000) + 24 * 60 * 60, // default 24 jam
    signature,
  };

  try {
    const response = await fetch(`${config.baseUrl}/transaction/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as TripayClosedPaymentResponse;

    if (!result.success || !result.data) {
      return {
        ok: false,
        message: result.message || "Gagal membuat transaksi Tripay.",
      };
    }

    return { ok: true, data: result.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error saat menghubungi Tripay.";
    return { ok: false, message };
  }
}

export async function getTripayPaymentChannels(): Promise<
  Array<{ code: string; name: string; group: string; fee_merchant: { flat: number; percent: number }; fee_customer: { flat: number; percent: number }; active: boolean }>
> {
  const config = getTripayConfig();

  if (!isTripayConfigured()) {
    return [];
  }

  try {
    const response = await fetch(`${config.baseUrl}/merchant/payment-channel`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data;
  } catch {
    return [];
  }
}

export async function getTripayTransactionDetail(reference: string): Promise<TripayClosedPaymentResponse["data"] | null> {
  const config = getTripayConfig();

  if (!isTripayConfigured()) {
    return null;
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/transaction/detail?reference=${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      }
    );

    const result = await response.json();
    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}
