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
import { isTripayConfigured, createTripayClosedPayment } from "@/server/tripay";

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

// Legacy types kept for backward compatibility with old transactions
type LegacyAction = {
  name: string;
  method: string;
  url: string;
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
  qrActions: LegacyAction[];
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

// Midtrans functions removed - now using Tripay exclusively
// Stub kept for backward-compatible routes that still reference it
export function isMidtransConfigured(): boolean {
  const serverKey = (process.env.MIDTRANS_SERVER_KEY || "").trim();
  const clientKey = (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim();
  if (!serverKey || !clientKey) return false;
  if (hasPlaceholderEnvValue(serverKey) || hasPlaceholderEnvValue(clientKey)) return false;
  return true;
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



// Legacy helper functions for old Midtrans transactions
function toLegacyActions(payload: Record<string, unknown>) {
  const rawActions = payload.actions;
  if (!Array.isArray(rawActions)) {
    return [] as LegacyAction[];
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

      return { name, method, url };
    })
    .filter((action): action is LegacyAction => Boolean(action));
}

function getQrisActionUrl(
  actions: LegacyAction[],
  fallback: string | null | undefined
) {
  const directQrAction =
    actions.find((action) => action.name === "generate-qr-code") ||
    actions.find((action) => action.name === "deeplink-redirect") ||
    actions[0];

  return directQrAction?.url || fallback || null;
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
  const actions = toLegacyActions(payload);
  const transactionStatusFromWebhook =
    webhook && typeof webhook.transaction_status === "string"
      ? webhook.transaction_status
      : null;
  const paymentMethodFromWebhook =
    webhook && typeof webhook.payment_type === "string" ? webhook.payment_type : null;
  const tokenFromPayload = typeof payload.token === "string" ? payload.token : null;
  const redirectFromPayload =
    typeof payload.redirect_url === "string" ? payload.redirect_url : null;
  const redirectUrl = transaction.checkoutUrl || transaction.redirectUrl || redirectFromPayload || null;
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
    qrUrl: transaction.qrUrl || (isQrisLikePayment ? getQrisActionUrl(actions, redirectUrl) : null),
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
    await ensureBillingSchema();
  } catch (bootstrapError) {
    // If bootstrap itself fails, return fallback instead of crashing
    console.error("[billing] ensureBillingSchema failed in getOrCreateSubscription:", bootstrapError);
    return buildFallbackSubscription(userId);
  }

  try {
    const existing = await db.query.billingSubscriptions.findFirst({
      where: eq(billingSubscriptions.userId, userId),
    });
    if (existing) {
      if (existing.status === "trial" && !existing.renewalDate) {
        const trialEndDate = new Date(existing.createdAt);
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        const [updated] = await db
          .update(billingSubscriptions)
          .set({
            renewalDate: trialEndDate,
            nextPlanName: "free",
            updatedAt: new Date(),
          })
          .where(eq(billingSubscriptions.id, existing.id))
          .returning();

        return {
          ...updated,
          planName: normalizeBillingPlanName(updated.planName),
          nextPlanName: normalizeBillingPlanName(updated.nextPlanName),
        };
      }

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
    await ensureBillingSchema();
  } catch (bootstrapError) {
    console.error("[billing] ensureBillingSchema failed in createUpgradeTransaction:", bootstrapError);
    return {
      ok: false as const,
      code: "billing_schema_missing",
      message:
        "Schema billing sedang disiapkan. Silakan coba lagi dalam beberapa detik.",
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

    if (!isTripayConfigured()) {
      return {
        ok: false as const,
        code: "tripay_not_configured",
        message:
          "Layanan pembayaran belum dikonfigurasi. Hubungi admin untuk aktivasi pembayaran.",
      };
    }

    const tripayResult = await createTripayClosedPayment({
      merchantRef: invoiceId,
      amount,
      customerName: input.fullName || "Creator",
      customerEmail: input.email,
      paymentMethod: "QRIS",
      orderItemName: `Showreels ${PLAN_CATALOG[normalizedTargetPlan].label} (${input.billingCycle})`,
      callbackUrl: `${getAppOrigin()}/api/billing/tripay/callback`,
      returnUrl: `${getAppOrigin()}/dashboard/billing?payment=success`,
    });

    if (!tripayResult.ok) {
      return {
        ok: false as const,
        code: "tripay_error",
        message:
          tripayResult.message ||
          "Gagal membuat transaksi pembayaran. Coba ulang beberapa saat lagi.",
      };
    }

    const tripayData = tripayResult.data!;
    const tripayRecord = tripayData as unknown as Record<string, unknown>;

    const [transaction] = await db
      .insert(billingTransactions)
      .values({
        userId: input.userId,
        subscriptionId: subscription.id,
        invoiceId,
        planName: normalizedTargetPlan,
        billingCycle: input.billingCycle,
        amount,
        currency: "IDR",
        status: "pending",
        provider: "tripay",
        providerReference: tripayData.reference || invoiceId,
        checkoutUrl: tripayData.checkout_url || "",
        qrUrl: tripayData.qr_url || "",
        payCode: tripayData.pay_code || "",
        expiredAt: tripayData.expired_time
          ? new Date(tripayData.expired_time * 1000)
          : null,
        paymentMethod: tripayData.payment_method || "tripay",
        description: `Upgrade ke ${PLAN_CATALOG[normalizedTargetPlan].label}`,
        rawPayload: tripayRecord,
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

/**
 * @deprecated Legacy function for old Midtrans transactions only.
 * New transactions use Tripay status mapping.
 */
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

/**
 * @deprecated Legacy function for old Midtrans transactions only.
 */
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

/**
 * @deprecated Kept for backward compatibility with old Midtrans transactions.
 * New transactions use Tripay callback at /api/billing/tripay/callback.
 */
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

/**
 * @deprecated This function is kept for backward compatibility with old Midtrans transactions.
 * It will return the transaction as-is for non-Midtrans providers.
 */
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

  // Only process Midtrans transactions
  if (transaction.provider !== "midtrans") {
    return transaction;
  }

  // For old Midtrans transactions, just return as-is
  // (Midtrans integration has been removed)
  console.warn("[Deprecated] Midtrans transaction refresh attempted:", input.invoiceId);
  return transaction;
}
