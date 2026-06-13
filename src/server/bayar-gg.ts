import { hasPlaceholderEnvValue, normalizeEnvValue } from "@/lib/env-utils";

const BAYAR_GG_BASE_URL = "https://www.bayar.gg/api";

const SUPPORTED_PAYMENT_METHODS = [
  "qris",
  "qris_bayar_gg",
  "qris_user",
  "qris_livin",
  "gopay_qris",
  "ovo",
  "all",
] as const;

export type BayarGGPaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];
export type BayarGGPaymentStatus = "pending" | "paid" | "expired" | "cancelled";
export type InternalTransactionStatus =
  | "paid"
  | "pending"
  | "expired"
  | "failed"
  | "cancelled";

export type BayarGGConfig = {
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
  defaultPaymentMethod: BayarGGPaymentMethod;
};

export type BayarGGCreatePaymentRequest = {
  amount: number;
  description: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  payment_method: BayarGGPaymentMethod;
  payment_url: string;
  callback_url: string;
  redirect_url: string;
};

export type BayarGGCreatePaymentData = {
  invoice_id: string;
  amount: number;
  final_amount?: number;
  unique_code?: number;
  payment_method?: string;
  payment_method_label?: string;
  status: BayarGGPaymentStatus;
  payment_url?: string;
  expires_at?: string;
  qris_string?: string;
  qris_static_image_url?: string;
  qris_dynamic_string?: string;
  qris_dynamic_image_url?: string;
  paid_reff_num?: string;
};

export type BayarGGCreatePaymentResponse = {
  success: boolean;
  message?: string;
  data?: BayarGGCreatePaymentData;
};

export type BayarGGPaymentStatusResponse = {
  success: boolean;
  message?: string;
  invoice_id: string;
  status: BayarGGPaymentStatus;
  amount: number;
  final_amount?: number;
  payment_method?: string;
  paid_at?: string;
  paid_reff_num?: string;
  expires_at?: string;
};

export type BayarGGWebhookPayload = {
  event?: string;
  invoice_id: string;
  status: BayarGGPaymentStatus;
  payment_method?: string;
  amount?: number;
  final_amount?: number;
  unique_code?: number;
  paid_at?: string;
  paid_amount?: number;
  paid_reff_num?: string;
  paid_via?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  description?: string;
  redirect_url?: string;
  has_file?: boolean;
  has_content?: boolean;
  timestamp?: number;
  signature?: string;
};

export type BayarGGErrorReason =
  | "auth"
  | "validation"
  | "not_configured"
  | "network"
  | "unknown";

export type BayarGGCreatePaymentError = {
  ok: false;
  reason: BayarGGErrorReason;
  message: string;
  providerMessage?: string;
  httpStatus?: number;
};

function sanitizeProviderMessage(message: string) {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/API-[A-Za-z0-9._-]+/gi, "API-[REDACTED]")
    .replace(/[A-Za-z0-9]{32,}/g, "[REDACTED]")
    .slice(0, 500);
}

function logBayarGGEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, unknown> = {}
) {
  const safe: Record<string, unknown> = { event, ...details };
  delete safe.apiKey;
  delete safe.webhookSecret;
  delete safe.signature;
  delete safe.authorization;

  const payload = `[bayar-gg] ${JSON.stringify(safe)}`;
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

function normalizePaymentMethod(value: string | null | undefined): BayarGGPaymentMethod {
  const normalized = normalizeEnvValue(value).toLowerCase() as BayarGGPaymentMethod;
  return SUPPORTED_PAYMENT_METHODS.includes(normalized) ? normalized : "qris";
}

export function getBayarGGConfig(): BayarGGConfig {
  return {
    apiKey: normalizeEnvValue(process.env.BAYAR_GG_API_KEY),
    webhookSecret: normalizeEnvValue(process.env.BAYAR_GG_WEBHOOK_SECRET),
    baseUrl: BAYAR_GG_BASE_URL,
    defaultPaymentMethod: normalizePaymentMethod(
      process.env.BAYAR_GG_DEFAULT_PAYMENT_METHOD
    ),
  };
}

export function getBayarGGDefaultPaymentMethod(): BayarGGPaymentMethod {
  return getBayarGGConfig().defaultPaymentMethod;
}

export function isBayarGGConfigured(): boolean {
  const config = getBayarGGConfig();
  return (
    !hasPlaceholderEnvValue(config.apiKey) &&
    !hasPlaceholderEnvValue(config.webhookSecret) &&
    config.apiKey.length > 0 &&
    config.webhookSecret.length > 0
  );
}

async function createHmacSha256Signature(secret: string, content: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(content));
  return Array.from(new Uint8Array(signature))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function createBayarGGWebhookSignature(input: {
  invoiceId: string;
  status: string;
  finalAmount: number | string;
  timestamp: string | number;
  webhookSecret: string;
}) {
  const { invoiceId, status, finalAmount, timestamp, webhookSecret } = input;
  return createHmacSha256Signature(
    webhookSecret,
    `${invoiceId}|${status}|${finalAmount}|${timestamp}`
  );
}

export async function verifyBayarGGWebhookSignature(input: {
  payload: Pick<BayarGGWebhookPayload, "invoice_id" | "status" | "final_amount" | "timestamp">;
  callbackSignature: string;
  timestamp: string | null | undefined;
  webhookSecret: string;
}) {
  const { payload, callbackSignature, timestamp, webhookSecret } = input;
  if (!callbackSignature || !webhookSecret) return false;

  const signatureTimestamp = timestamp || String(payload.timestamp || "");
  if (!payload.invoice_id || !payload.status || payload.final_amount == null || !signatureTimestamp) {
    return false;
  }

  const expected = await createBayarGGWebhookSignature({
    invoiceId: payload.invoice_id,
    status: payload.status,
    finalAmount: payload.final_amount,
    timestamp: signatureTimestamp,
    webhookSecret,
  });

  return expected === callbackSignature;
}

export function mapBayarGGStatusToInternal(
  providerStatus: BayarGGPaymentStatus
): InternalTransactionStatus {
  switch (providerStatus) {
    case "paid":
      return "paid";
    case "expired":
      return "expired";
    case "cancelled":
      return "cancelled";
    case "pending":
    default:
      return "pending";
  }
}

export function mapBayarGGStatusToSubscription(
  providerStatus: BayarGGPaymentStatus
): "active" | "pending" | "expired" | "failed" {
  switch (providerStatus) {
    case "paid":
      return "active";
    case "expired":
    case "cancelled":
      return "expired";
    case "pending":
    default:
      return "pending";
  }
}

function detectBayarGGErrorReason(
  httpStatus: number,
  message: string | null | undefined
): BayarGGErrorReason {
  const lower = (message || "").toLowerCase();

  if (httpStatus === 401 || lower.includes("api key") || lower.includes("unauthorized")) {
    return "auth";
  }

  if (httpStatus === 400 || lower.includes("invalid") || lower.includes("required")) {
    return "validation";
  }

  return "unknown";
}

export function parseBayarGGDateTime(value: string | null | undefined) {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return null;

  const parsed = new Date(normalized.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getBayarGGQrUrl(
  data:
    | Pick<BayarGGCreatePaymentData, "qris_dynamic_image_url" | "qris_static_image_url">
    | null
    | undefined
) {
  if (!data) return null;
  return data.qris_dynamic_image_url || data.qris_static_image_url || null;
}

export async function createBayarGGPayment(input: {
  amount: number;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl: string;
  redirectUrl: string;
  paymentMethod?: BayarGGPaymentMethod;
}): Promise<
  | { ok: true; data: BayarGGCreatePaymentData }
  | BayarGGCreatePaymentError
> {
  const config = getBayarGGConfig();

  if (!isBayarGGConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "Bayar.gg belum dikonfigurasi. Pastikan BAYAR_GG_API_KEY dan BAYAR_GG_WEBHOOK_SECRET sudah diisi.",
    };
  }

  const payload: BayarGGCreatePaymentRequest = {
    amount: input.amount,
    description: input.description,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    payment_method: input.paymentMethod || config.defaultPaymentMethod,
    payment_url: "https://www.bayar.gg/pay",
    callback_url: input.callbackUrl,
    redirect_url: input.redirectUrl,
  };

  try {
    const response = await fetch(`${config.baseUrl}/create-payment.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as
      | BayarGGCreatePaymentResponse
      | null;

    if (!response.ok || !result?.success || !result.data?.invoice_id) {
      const rawMessage = result?.message || `HTTP ${response.status}`;
      const providerMessage = sanitizeProviderMessage(rawMessage);
      const reason = detectBayarGGErrorReason(response.status, providerMessage);

      logBayarGGEvent("error", "create_payment_failed", {
        reason,
        httpStatus: response.status,
        amount: input.amount,
        paymentMethod: payload.payment_method,
        providerMessage,
      });

      return {
        ok: false,
        reason,
        httpStatus: response.status,
        providerMessage,
        message:
          reason === "auth"
            ? "Konfigurasi Bayar.gg sedang bermasalah. Hubungi admin untuk memeriksa kredensial pembayaran."
            : reason === "validation"
              ? "Data pembayaran tidak valid. Silakan buat transaksi baru dan coba lagi."
              : "Gagal membuat transaksi pembayaran di Bayar.gg. Silakan coba lagi beberapa saat lagi.",
      };
    }

    logBayarGGEvent("info", "create_payment_success", {
      invoiceId: result.data.invoice_id,
      amount: input.amount,
      paymentMethod: result.data.payment_method || payload.payment_method,
    });

    return {
      ok: true,
      data: result.data,
    };
  } catch (error) {
    const providerMessage = sanitizeProviderMessage(
      error instanceof Error ? error.message : "Unknown network error"
    );

    logBayarGGEvent("error", "create_payment_network_error", {
      amount: input.amount,
      paymentMethod: payload.payment_method,
      providerMessage,
    });

    return {
      ok: false,
      reason: "network",
      providerMessage,
      message:
        "Tidak dapat terhubung ke server Bayar.gg. Periksa koneksi lalu coba lagi.",
    };
  }
}

export async function getBayarGGPaymentStatus(invoiceId: string) {
  const config = getBayarGGConfig();
  if (!isBayarGGConfigured()) {
    return null;
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/check-payment.php?invoice=${encodeURIComponent(invoiceId)}`,
      {
        headers: {
          "X-API-Key": config.apiKey,
        },
        cache: "no-store",
      }
    );

    const result = (await response.json().catch(() => null)) as
      | BayarGGPaymentStatusResponse
      | null;

    if (!response.ok || !result?.success || !result.invoice_id || !result.status) {
      const providerMessage = sanitizeProviderMessage(result?.message || `HTTP ${response.status}`);
      logBayarGGEvent("warn", "check_payment_failed", {
        invoiceId,
        httpStatus: response.status,
        providerMessage,
      });
      return null;
    }

    return result;
  } catch (error) {
    logBayarGGEvent("warn", "check_payment_network_error", {
      invoiceId,
      providerMessage:
        error instanceof Error ? sanitizeProviderMessage(error.message) : "Unknown network error",
    });
    return null;
  }
}
