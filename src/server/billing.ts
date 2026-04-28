import { and, desc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { billingSubscriptions, billingTransactions } from "@/db/schema";
import { hasPlaceholderEnvValue, normalizeEnvValue } from "@/lib/env-utils";
import {
  getPlanFeatureBullets,
  getPlanFeatureChecklist,
  type PlanFeatureChecklistItem,
} from "@/lib/plan-feature-matrix";
import { ensureBillingSchema } from "@/server/billing-schema-bootstrap";
import { isMissingBillingSchemaError } from "@/server/database-errors";

export type BillingPlanName = "free" | "creator" | "business";
export type BillingCycle = "monthly" | "yearly";

type PlanConfig = {
  name: BillingPlanName;
  label: string;
  monthly: number;
  yearlyLegacy: number;
  benefits: string[];
  benefitItems: PlanFeatureChecklistItem[];
};

type MidtransAction = {
  name: string;
  method: string;
  url: string;
};

type MidtransChargePayload = {
  order_id?: string;
  transaction_id?: string;
  transaction_status?: string;
  payment_type?: string;
  gross_amount?: string | number;
  currency?: string;
  expiry_time?: string;
  actions?: Array<{
    name?: string;
    method?: string;
    url?: string;
  }>;
  status_code?: string;
  status_message?: string;
  error_messages?: string[];
  fraud_status?: string;
};

type MidtransSnapPayload = {
  token?: string;
  redirect_url?: string;
  currency?: string;
  status_code?: string;
  status_message?: string;
  error_messages?: string[];
};

export type MidtransRuntimeConfig = {
  mode: "sandbox" | "production";
  isProduction: boolean;
  serverKeySet: boolean;
  clientKeySet: boolean;
  coreApiBaseUrl: string;
  snapApiBaseUrl: string;
  snapScriptUrl: string;
};

type BillingTransactionRow = typeof billingTransactions.$inferSelect;

export type BillingPaymentSummary = {
  invoiceId: string;
  amount: number;
  currency: string;
  status: BillingTransactionRow["status"];
  transactionStatus: string;
  paymentMethod: string;
  snapToken: string | null;
  redirectUrl: string | null;
  expiresAt: string | null;
  qrUrl: string | null;
  qrActions: MidtransAction[];
};

const PLAN_CATALOG: Record<BillingPlanName, PlanConfig> = {
  free: {
    name: "free",
    label: "Free",
    monthly: 0,
    yearlyLegacy: 0,
    benefits: getPlanFeatureBullets("free", "id"),
    benefitItems: getPlanFeatureChecklist("free", "id"),
  },
  creator: {
    name: "creator",
    label: "Creator",
    monthly: 25000,
    yearlyLegacy: 250000,
    benefits: getPlanFeatureBullets("creator", "id"),
    benefitItems: getPlanFeatureChecklist("creator", "id"),
  },
  business: {
    name: "business",
    label: "Business",
    monthly: 49000,
    yearlyLegacy: 490000,
    benefits: getPlanFeatureBullets("business", "id"),
    benefitItems: getPlanFeatureChecklist("business", "id"),
  },
};

function normalizeBillingPlanName(value: string | null | undefined): BillingPlanName {
  if (value === "business") {
    return "business";
  }
  if (value === "creator" || value === "pro") {
    return "creator";
  }
  return "free";
}

function getMidtransServerKey() {
  return normalizeEnvValue(process.env.MIDTRANS_SERVER_KEY);
}

export function getMidtransClientKey() {
  return normalizeEnvValue(process.env.MIDTRANS_CLIENT_KEY);
}

export function getMidtransRuntimeConfig(): MidtransRuntimeConfig {
  const isProduction =
    normalizeEnvValue(process.env.MIDTRANS_IS_PRODUCTION).toLowerCase() === "true";
  const mode = isProduction ? "production" : "sandbox";
  const serverKey = getMidtransServerKey();
  const clientKey = getMidtransClientKey();

  return {
    mode,
    isProduction,
    serverKeySet: !hasPlaceholderEnvValue(serverKey),
    clientKeySet: !hasPlaceholderEnvValue(clientKey),
    coreApiBaseUrl: isProduction
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com",
    snapApiBaseUrl: isProduction
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com",
    snapScriptUrl: isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js",
  };
}

export function getMidtransCoreApiBaseUrl() {
  return getMidtransRuntimeConfig().coreApiBaseUrl;
}

function getMidtransAuthorizationHeader(serverKey: string) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

function buildInvoiceId(userId: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const suffix = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `INV-${y}${m}${d}-${hh}${mm}${ss}-${suffix}`;
}

function normalizeOrigin(value: string | undefined) {
  const trimmed = (value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  try {
    return new URL(trimmed).origin;
  } catch {
    return "";
  }
}

function getAppOrigin() {
  const explicitOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (explicitOrigin) {
    return explicitOrigin;
  }

  const projectProductionOrigin = normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined
  );
  if (projectProductionOrigin) {
    return projectProductionOrigin;
  }

  const deploymentOrigin = normalizeOrigin(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  );
  if (deploymentOrigin) {
    return deploymentOrigin;
  }

  return "https://showreels-id.vercel.app";
}

function getMidtransCallbacks(input: { targetPlan: BillingPlanName; invoiceId: string }) {
  const origin = getAppOrigin();
  const invoice = encodeURIComponent(input.invoiceId);
  const plan = encodeURIComponent(input.targetPlan);

  return {
    finish: `${origin}/dashboard/billing?payment=success&invoice=${invoice}&plan=${plan}`,
    unfinish: `${origin}/payment?plan=${plan}&payment=pending&invoice=${invoice}`,
    error: `${origin}/payment?plan=${plan}&payment=error&invoice=${invoice}`,
  };
}

function toMidtransActions(payload: Record<string, unknown>) {
  const rawActions = payload.actions;
  if (!Array.isArray(rawActions)) {
    return [] as MidtransAction[];
  }

  return rawActions
    .map((action) => {
      const item = action as Record<string, unknown>;
      const name = typeof item.name === "string" ? item.name : "";
      const method = typeof item.method === "string" ? item.method : "";
      const url = typeof item.url === "string" ? item.url : "";

      if (!name || !url) {
        return null;
      }

      return {
        name,
        method,
        url,
      };
    })
    .filter((action): action is MidtransAction => Boolean(action));
}

function getQrisActionUrl(
  actions: MidtransAction[],
  fallback: string | null | undefined
) {
  const directQrAction =
    actions.find((action) => action.name === "generate-qr-code") ||
    actions.find((action) => action.name === "deeplink-redirect") ||
    actions[0];

  return directQrAction?.url || fallback || null;
}

export function isMidtransConfigured() {
  return getMidtransRuntimeConfig().serverKeySet;
}

export function getPlanCatalog() {
  return PLAN_CATALOG;
}

export function getPlanPrice(planName: BillingPlanName, cycle: BillingCycle) {
  const selected = PLAN_CATALOG[planName];
  return cycle === "yearly" ? selected.yearlyLegacy : selected.monthly;
}

export function toBillingPaymentSummary(
  transaction: BillingTransactionRow
): BillingPaymentSummary {
  const payload = (transaction.rawPayload || {}) as Record<string, unknown>;
  const webhook =
    payload.webhook && typeof payload.webhook === "object"
      ? (payload.webhook as Record<string, unknown>)
      : null;
  const actions = toMidtransActions(payload);
  const transactionStatusFromWebhook =
    webhook && typeof webhook.transaction_status === "string"
      ? webhook.transaction_status
      : null;
  const paymentMethodFromWebhook =
    webhook && typeof webhook.payment_type === "string" ? webhook.payment_type : null;
  const tokenFromPayload = typeof payload.token === "string" ? payload.token : null;
  const redirectFromPayload =
    typeof payload.redirect_url === "string" ? payload.redirect_url : null;
  const redirectUrl = transaction.redirectUrl || redirectFromPayload || null;
  const paymentMethod =
    transaction.paymentMethod || paymentMethodFromWebhook || transaction.provider;
  const transactionStatus =
    typeof payload.transaction_status === "string"
      ? payload.transaction_status
      : transactionStatusFromWebhook || transaction.status;
  const expiresAt =
    typeof payload.expiry_time === "string" ? payload.expiry_time : null;
  const isQrisLikePayment =
    paymentMethod === "qris" ||
    actions.some((action) => action.name === "generate-qr-code");

  return {
    invoiceId: transaction.invoiceId,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    transactionStatus,
    paymentMethod,
    snapToken: transaction.snapToken || tokenFromPayload,
    redirectUrl,
    expiresAt,
    qrActions: actions,
    qrUrl: isQrisLikePayment ? getQrisActionUrl(actions, redirectUrl) : null,
  };
}

function buildFallbackSubscription(userId: string) {
  return {
    id: `subscription-${userId}`,
    userId,
    planName: "free" as BillingPlanName,
    billingCycle: "monthly" as BillingCycle,
    status: "active" as const,
    price: 0,
    currency: "IDR",
    renewalDate: null,
    nextPlanName: "free" as BillingPlanName,
    updatedAt: new Date(),
    createdAt: new Date(),
  };
}

export async function getOrCreateSubscription(userId: string) {
  if (!isDatabaseConfigured) {
    return buildFallbackSubscription(userId);
  }

  try {
    const existing = await db.query.billingSubscriptions.findFirst({
      where: eq(billingSubscriptions.userId, userId),
    });
    if (existing) {
      return {
        ...existing,
        planName: normalizeBillingPlanName(existing.planName),
        nextPlanName: normalizeBillingPlanName(existing.nextPlanName),
      };
    }

    // NEW USER: Create trial subscription for Creator plan (1 month)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30); // +30 days

    const [created] = await db
      .insert(billingSubscriptions)
      .values({
        userId,
        planName: "creator",        // Trial starts with Creator plan
        billingCycle: "monthly",
        status: "trial",            // Mark as trial status
        price: 0,
        currency: "IDR",
        renewalDate: trialEndDate,  // Trial expires after 30 days
        nextPlanName: "free",       // After trial, downgrade to free
      })
      .returning();

    return {
      ...created,
      planName: normalizeBillingPlanName(created.planName),
      nextPlanName: normalizeBillingPlanName(created.nextPlanName),
    };
  } catch (error) {
    if (isMissingBillingSchemaError(error)) {
      return buildFallbackSubscription(userId);
    }
    throw error;
  }
}

export async function getBillingTransactions(userId: string) {
  if (!isDatabaseConfigured) {
    return [] as Array<{
      id: string;
      invoiceId: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: Date;
      planName: string;
      billingCycle: string;
    }>;
  }

  try {
    const transactions = await db.query.billingTransactions.findMany({
      where: eq(billingTransactions.userId, userId),
      orderBy: desc(billingTransactions.createdAt),
      limit: 30,
    });
    return transactions.map((transaction) => ({
      ...transaction,
      planName: normalizeBillingPlanName(transaction.planName),
    }));
  } catch (error) {
    if (isMissingBillingSchemaError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getBillingTransactionByInvoiceForUser(
  userId: string,
  invoiceId: string
) {
  if (!isDatabaseConfigured) {
    return null;
  }

  try {
    const transaction = await db.query.billingTransactions.findFirst({
      where: and(
        eq(billingTransactions.userId, userId),
        eq(billingTransactions.invoiceId, invoiceId)
      ),
    });
    if (!transaction) {
      return null;
    }
    return {
      ...transaction,
      planName: normalizeBillingPlanName(transaction.planName),
    };
  } catch (error) {
    if (isMissingBillingSchemaError(error)) {
      return null;
    }
    throw error;
  }
}

export async function createUpgradeTransaction(input: {
  userId: string;
  fullName: string;
  email: string;
  targetPlan: BillingPlanName;
  billingCycle: BillingCycle;
}) {
  const normalizedTargetPlan = normalizeBillingPlanName(input.targetPlan);

  if (input.billingCycle !== "monthly") {
    return {
      ok: false as const,
      code: "invalid_billing_cycle",
      message: "Cycle billing tahunan tidak lagi tersedia. Gunakan cycle bulanan.",
    };
  }

  const amount = getPlanPrice(normalizedTargetPlan, input.billingCycle);
  const invoiceId = buildInvoiceId(input.userId);

  if (!isDatabaseConfigured) {
    return {
      ok: false as const,
      code: "db_not_ready",
      message: "Database belum siap untuk transaksi billing.",
    };
  }

  try {
    const subscription = await getOrCreateSubscription(input.userId);
    const activePlan = normalizeBillingPlanName(subscription.planName);
    if (
      subscription.status === "active" &&
      amount > 0 &&
      activePlan === normalizedTargetPlan
    ) {
      return {
        ok: false as const,
        code: "same_plan_active",
        message:
          "Paket ini sudah aktif. Kamu bisa perpanjang, membatalkan, atau memilih paket lain.",
      };
    }

    if (amount <= 0) {
      const [transaction] = await db
        .insert(billingTransactions)
        .values({
          userId: input.userId,
          subscriptionId: subscription.id,
          invoiceId,
          planName: "free",
          billingCycle: "monthly",
          amount: 0,
          currency: "IDR",
          status: "paid",
          provider: "manual",
          providerReference: invoiceId,
          paymentMethod: "manual",
          description: "Downgrade ke Free plan",
          paidAt: new Date(),
        })
        .returning();

      const [updatedSubscription] = await db
        .update(billingSubscriptions)
        .set({
          planName: "free",
          billingCycle: "monthly",
          status: "active",
          price: 0,
          renewalDate: null,
          nextPlanName: "free",
          updatedAt: new Date(),
        })
        .where(eq(billingSubscriptions.id, subscription.id))
        .returning();

      return {
        ok: true as const,
        mode: "free" as const,
        transaction,
        subscription: updatedSubscription,
      };
    }

    if (!isMidtransConfigured()) {
      return {
        ok: false as const,
        code: "midtrans_not_configured",
        message:
          "Layanan pembayaran belum dikonfigurasi. Hubungi admin untuk aktivasi pembayaran.",
      };
    }

    const runtime = getMidtransRuntimeConfig();
    const serverKey = getMidtransServerKey();
    const callbacks = getMidtransCallbacks({
      targetPlan: normalizedTargetPlan,
      invoiceId,
    });
    const response = await fetch(`${runtime.snapApiBaseUrl}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: getMidtransAuthorizationHeader(serverKey),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: invoiceId,
          gross_amount: amount,
        },
        item_details: [
          {
            id: `${normalizedTargetPlan}-${input.billingCycle}`,
            price: amount,
            quantity: 1,
            name: `Showreels ${PLAN_CATALOG[normalizedTargetPlan].label} (${input.billingCycle})`,
          },
        ],
        customer_details: {
          first_name: input.fullName || "Creator",
          email: input.email,
        },
        credit_card: {
          secure: true,
        },
        enabled_payments: ["credit_card", "qris"],
        custom_field1: normalizedTargetPlan,
        custom_field2: input.billingCycle,
        custom_field3: input.userId,
        callbacks,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | MidtransSnapPayload
      | null;

    if (!response.ok || !payload?.token || !payload?.redirect_url) {
      return {
        ok: false as const,
        code: "midtrans_error",
        message:
          payload?.error_messages?.[0] ||
          payload?.status_message ||
          "Gagal membuat transaksi pembayaran. Coba ulang beberapa saat lagi.",
      };
    }

    const payloadRecord = payload as unknown as Record<string, unknown>;

    const [transaction] = await db
      .insert(billingTransactions)
      .values({
        userId: input.userId,
        subscriptionId: subscription.id,
        invoiceId,
        planName: normalizedTargetPlan,
        billingCycle: input.billingCycle,
        amount,
        currency: payload.currency || "IDR",
        status: "pending",
        provider: "midtrans",
        providerReference: invoiceId,
        snapToken: payload.token,
        redirectUrl: payload.redirect_url,
        paymentMethod: "snap",
        description: `Upgrade ke ${PLAN_CATALOG[normalizedTargetPlan].label}`,
        rawPayload: payloadRecord,
      })
      .returning();

    await db
      .update(billingSubscriptions)
      .set({
        status: "pending",
        nextPlanName: normalizedTargetPlan,
        billingCycle: input.billingCycle,
        price: amount,
        updatedAt: new Date(),
      })
      .where(eq(billingSubscriptions.id, subscription.id));

    return {
      ok: true as const,
      mode: "paid" as const,
      transaction,
      payment: toBillingPaymentSummary(transaction),
    };
  } catch (error) {
    if (isMissingBillingSchemaError(error)) {
      return {
        ok: false as const,
        code: "billing_schema_missing",
        message:
          "Schema billing belum siap di database production. Jalankan migrasi database terbaru lalu coba lagi.",
      };
    }
    throw error;
  }
}

function mapMidtransStatus(transactionStatus: string) {
  switch (transactionStatus) {
    case "settlement":
    case "capture":
      return "paid" as const;
    case "pending":
      return "pending" as const;
    case "deny":
    case "cancel":
      return "cancelled" as const;
    case "expire":
      return "expired" as const;
    default:
      return "failed" as const;
  }
}

function mapSubscriptionStatus(transactionStatus: string) {
  switch (transactionStatus) {
    case "settlement":
    case "capture":
      return "active" as const;
    case "pending":
      return "pending" as const;
    case "deny":
    case "cancel":
    case "expire":
      return "failed" as const;
    default:
      return "failed" as const;
  }
}

export async function handleMidtransWebhook(payload: {
  order_id?: string;
  transaction_status?: string;
  payment_type?: string;
  gross_amount?: string | number;
  currency?: string;
  fraud_status?: string;
}) {
  const invoiceId = payload.order_id || "";
  if (!invoiceId) {
    return { ok: false as const, message: "order_id tidak ditemukan." };
  }

  if (!isDatabaseConfigured) {
    return { ok: true as const, message: "Webhook diterima (db tidak aktif)." };
  }

  try {
    await ensureBillingSchema();
  } catch (error) {
    console.error("Failed to bootstrap billing schema", error);
  }

  try {
    const transaction = await db.query.billingTransactions.findFirst({
      where: eq(billingTransactions.invoiceId, invoiceId),
    });
    if (!transaction) {
      return { ok: false as const, message: "Transaksi invoice tidak ditemukan." };
    }

    const transactionStatus = payload.transaction_status || "failed";
    const mappedTransactionStatus = mapMidtransStatus(transactionStatus);
    const mappedSubscriptionStatus = mapSubscriptionStatus(transactionStatus);
    const isPaid = mappedTransactionStatus === "paid";
    const normalizedTransactionPlan = normalizeBillingPlanName(transaction.planName);
    const grossAmount = Number(payload.gross_amount ?? transaction.amount) || transaction.amount;

    if (Math.round(grossAmount) !== Math.round(transaction.amount)) {
      return {
        ok: false as const,
        message: "Nominal pembayaran tidak sesuai dengan invoice backend.",
      };
    }

    const [updatedTransaction] = await db
      .update(billingTransactions)
      .set({
        status: mappedTransactionStatus,
        paymentMethod: payload.payment_type || transaction.paymentMethod,
        currency: payload.currency || transaction.currency,
        amount: grossAmount,
        paidAt: isPaid ? new Date() : transaction.paidAt,
        rawPayload: {
          ...(transaction.rawPayload || {}),
          webhook: payload,
        },
        updatedAt: new Date(),
      })
      .where(eq(billingTransactions.id, transaction.id))
      .returning();

    const subscription = await db.query.billingSubscriptions.findFirst({
      where: and(
        eq(billingSubscriptions.userId, transaction.userId),
        eq(billingSubscriptions.id, transaction.subscriptionId || "")
      ),
    });

    if (subscription) {
      const renewalDate = isPaid
        ? new Date(
            Date.now() +
              (transaction.billingCycle === "yearly" ? 365 : 30) *
                24 *
                60 *
                60 *
                1000
          )
        : subscription.renewalDate;

      await db
        .update(billingSubscriptions)
        .set({
          planName: isPaid
            ? normalizedTransactionPlan
            : normalizeBillingPlanName(subscription.planName),
          nextPlanName: isPaid
            ? normalizedTransactionPlan
            : normalizeBillingPlanName(subscription.nextPlanName),
          status: mappedSubscriptionStatus,
          price: transaction.amount,
          billingCycle: transaction.billingCycle,
          renewalDate,
          updatedAt: new Date(),
        })
        .where(eq(billingSubscriptions.id, subscription.id));
    }

    return {
      ok: true as const,
      transaction: updatedTransaction,
    };
  } catch (error) {
    if (isMissingBillingSchemaError(error)) {
      return {
        ok: false as const,
        message:
          "Schema billing belum siap di database production. Jalankan migrasi database terbaru.",
      };
    }
    throw error;
  }
}

export async function refreshBillingTransactionStatusFromMidtrans(input: {
  userId: string;
  invoiceId: string;
}) {
  const transaction = await getBillingTransactionByInvoiceForUser(
    input.userId,
    input.invoiceId
  );
  if (!transaction) {
    return null;
  }

  if (!isMidtransConfigured() || transaction.provider !== "midtrans") {
    return transaction;
  }

  const serverKey = (process.env.MIDTRANS_SERVER_KEY || "").trim();
  const response = await fetch(
    `${getMidtransCoreApiBaseUrl()}/v2/${encodeURIComponent(input.invoiceId)}/status`,
    {
      method: "GET",
      headers: {
        Authorization: getMidtransAuthorizationHeader(serverKey),
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    return transaction;
  }

  const payload = (await response.json().catch(() => null)) as
    | MidtransChargePayload
    | null;

  if (!payload?.order_id || !payload.transaction_status) {
    return transaction;
  }

  await handleMidtransWebhook({
    order_id: payload.order_id,
    transaction_status: payload.transaction_status,
    payment_type: payload.payment_type,
    gross_amount: payload.gross_amount,
    currency: payload.currency,
    fraud_status: payload.fraud_status,
  });

  const latest = await getBillingTransactionByInvoiceForUser(
    input.userId,
    input.invoiceId
  );

  return latest || transaction;
}
