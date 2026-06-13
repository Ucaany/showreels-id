import { and, desc, eq, gt } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { billingSubscriptions, billingTransactions } from "@/db/schema";
import {
  getPlanFeatureBullets,
  getPlanFeatureChecklist,
  type PlanFeatureChecklistItem,
} from "@/lib/plan-feature-matrix";
import {
  createBayarGGPayment,
  getBayarGGDefaultPaymentMethod,
  getBayarGGPaymentStatus,
  getBayarGGQrUrl,
  isBayarGGConfigured,
  mapBayarGGStatusToInternal,
  mapBayarGGStatusToSubscription,
  parseBayarGGDateTime,
} from "@/server/bayar-gg";
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
  checkoutUrl: string | null;
  expiresAt: string | null;
  qrUrl: string | null;
  payCode: string | null;
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

  return "https://showreels.id";
}

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

function pickFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function toIsoString(value: Date | null | undefined) {
  return value instanceof Date ? value.toISOString() : null;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
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
  const payload = asRecord(transaction.rawPayload) || {};
  const webhook = asRecord(payload.webhook);
  const statusCheck = asRecord(payload.statusCheck);
  const actions = toLegacyActions(payload);

  const checkoutUrl =
    transaction.checkoutUrl ||
    pickFirstString(payload.payment_url, payload.redirect_url, payload.checkout_url) ||
    null;

  const paymentMethod =
    transaction.paymentMethod ||
    pickFirstString(
      webhook?.payment_method,
      statusCheck?.payment_method,
      payload.payment_method,
      transaction.provider
    ) ||
    transaction.provider;

  const transactionStatus =
    pickFirstString(webhook?.status, statusCheck?.status, payload.status, transaction.status) ||
    transaction.status;

  const expiresAt =
    toIsoString(transaction.expiredAt) ||
    pickFirstString(statusCheck?.expires_at, payload.expires_at, payload.expiry_time);

  const qrUrl =
    transaction.qrUrl ||
    getBayarGGQrUrl(payload as { qris_dynamic_image_url?: string; qris_static_image_url?: string }) ||
    getBayarGGQrUrl(
      statusCheck as { qris_dynamic_image_url?: string; qris_static_image_url?: string }
    ) ||
    getQrisActionUrl(actions, checkoutUrl);

  const payCode =
    transaction.payCode ||
    pickFirstString(webhook?.paid_reff_num, statusCheck?.paid_reff_num, payload.paid_reff_num) ||
    null;

  const isQrisLikePayment =
    paymentMethod.toLowerCase().includes("qris") ||
    actions.some((action) => action.name === "generate-qr-code");

  return {
    invoiceId: transaction.invoiceId,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    transactionStatus,
    paymentMethod,
    checkoutUrl,
    expiresAt,
    payCode,
    qrActions: actions,
    qrUrl: isQrisLikePayment ? qrUrl : null,
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

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    const [created] = await db
      .insert(billingSubscriptions)
      .values({
        userId,
        planName: "creator",
        billingCycle: "monthly",
        status: "trial",
        price: 0,
        currency: "IDR",
        renewalDate: trialEndDate,
        nextPlanName: "free",
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
    console.error("getOrCreateSubscription_db_error", error);
    return buildFallbackSubscription(userId);
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
      checkoutUrl: string;
      expiredAt: Date | null;
      paidAt: Date | null;
      updatedAt: Date;
      provider: string;
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
    console.error("getBillingTransactions_db_error", error);
    return [];
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
    console.error("getBillingTransactionByInvoice_db_error", error);
    return null;
  }
}

/**
 * Cari transaksi pending Bayar.gg yang masih valid (belum expired) untuk user + plan + cycle tertentu.
 * Digunakan untuk mencegah pembuatan invoice ganda.
 */
export async function findValidPendingTransaction(
  userId: string,
  planName: BillingPlanName,
  billingCycle: BillingCycle
) {
  if (!isDatabaseConfigured) return null;

  try {
    const transaction = await db.query.billingTransactions.findFirst({
      where: and(
        eq(billingTransactions.userId, userId),
        eq(billingTransactions.planName, planName),
        eq(billingTransactions.billingCycle, billingCycle),
        eq(billingTransactions.status, "pending"),
        eq(billingTransactions.provider, "bayar_gg"),
        gt(billingTransactions.expiredAt, new Date())
      ),
      orderBy: desc(billingTransactions.createdAt),
    });

    if (!transaction || !transaction.checkoutUrl) return null;
    return transaction;
  } catch (error) {
    if (isMissingBillingSchemaError(error)) return null;
    console.error("findValidPendingTransaction_db_error", error);
    return null;
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

    if (!isBayarGGConfigured()) {
      return {
        ok: false as const,
        code: "bayar_gg_not_configured",
        message:
          "Layanan pembayaran Bayar.gg belum dikonfigurasi. Hubungi admin untuk aktivasi pembayaran.",
      };
    }

    // Reuse existing valid pending transaction to prevent duplicate invoices
    const existingPending = await findValidPendingTransaction(
      input.userId,
      normalizedTargetPlan,
      input.billingCycle
    );
    if (existingPending) {
      return {
        ok: true as const,
        mode: "paid" as const,
        transaction: existingPending,
        payment: toBillingPaymentSummary(existingPending),
      };
    }

    const bayarGGResult = await createBayarGGPayment({
      amount,
      customerName: input.fullName || "Creator",
      customerEmail: input.email,
      description: `Showreels ${PLAN_CATALOG[normalizedTargetPlan].label} (${input.billingCycle}) - ${invoiceId}`,
      callbackUrl: `${getAppOrigin()}/api/billing/bayar-gg/callback`,
      redirectUrl: `${getAppOrigin()}/dashboard/billing?payment=success&invoice=${encodeURIComponent(invoiceId)}`,
      paymentMethod: getBayarGGDefaultPaymentMethod(),
    });

    if (!bayarGGResult.ok) {
      const code =
        bayarGGResult.reason === "auth"
          ? ("bayar_gg_auth_error" as const)
          : bayarGGResult.reason === "validation"
            ? ("bayar_gg_validation_error" as const)
            : bayarGGResult.reason === "not_configured"
              ? ("bayar_gg_not_configured" as const)
              : bayarGGResult.reason === "network"
                ? ("bayar_gg_network_error" as const)
                : ("bayar_gg_error" as const);

      return {
        ok: false as const,
        code,
        message:
          bayarGGResult.message ||
          "Gagal membuat transaksi pembayaran. Coba ulang beberapa saat lagi.",
      };
    }

    const bayarGGData = bayarGGResult.data;

    // Validate that Bayar.gg returned base amount matches expected plan price
    // Note: final_amount includes gateway fees, so we compare against base amount
    const providerAmount = bayarGGData.amount;
    if (providerAmount !== undefined && providerAmount !== amount) {
      console.error("[billing] Amount mismatch from Bayar.gg", {
        expected: amount,
        received: providerAmount,
        invoiceId: bayarGGData.invoice_id,
        plan: normalizedTargetPlan,
      });
      return {
        ok: false as const,
        code: "bayar_gg_amount_mismatch" as const,
        message: `Nominal dari gateway pembayaran (Rp${providerAmount.toLocaleString("id-ID")}) tidak sesuai dengan harga paket (Rp${amount.toLocaleString("id-ID")}). Silakan coba lagi atau hubungi admin.`,
      };
    }

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
        provider: "bayar_gg",
        providerReference: bayarGGData.invoice_id || invoiceId,
        checkoutUrl: bayarGGData.payment_url || "",
        qrUrl: getBayarGGQrUrl(bayarGGData) || "",
        payCode: bayarGGData.paid_reff_num || "",
        expiredAt: parseBayarGGDateTime(bayarGGData.expires_at),
        paymentMethod:
          bayarGGData.payment_method || getBayarGGDefaultPaymentMethod(),
        description: `Upgrade ke ${PLAN_CATALOG[normalizedTargetPlan].label}`,
        rawPayload: bayarGGData as unknown as Record<string, unknown>,
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

export async function refreshPaymentTransactionStatus(input: {
  userId: string;
  invoiceId: string;
}) {
  if (!isDatabaseConfigured) {
    return null;
  }

  const transaction = await getBillingTransactionByInvoiceForUser(
    input.userId,
    input.invoiceId
  );
  if (!transaction) {
    return null;
  }

  const finalStatuses = ["paid", "expired", "failed", "cancelled"];
  if (finalStatuses.includes(transaction.status)) {
    return transaction;
  }

  if (transaction.provider !== "bayar_gg") {
    return transaction;
  }

  const providerRef = transaction.providerReference || "";
  if (!providerRef) {
    return transaction;
  }

  const providerStatus = await getBayarGGPaymentStatus(providerRef);
  if (!providerStatus) {
    console.warn("[billing] Gagal fetch detail transaksi dari Bayar.gg:", providerRef);
    return transaction;
  }

  const newInternalStatus = mapBayarGGStatusToInternal(providerStatus.status);
  if (newInternalStatus === transaction.status) {
    return transaction;
  }

  const now = new Date();
  const updateData: Partial<typeof billingTransactions.$inferInsert> = {
    status: newInternalStatus,
    updatedAt: now,
    paymentMethod:
      providerStatus.payment_method || transaction.paymentMethod || getBayarGGDefaultPaymentMethod(),
    providerReference: providerStatus.invoice_id || providerRef,
    payCode: providerStatus.paid_reff_num || transaction.payCode || "",
    expiredAt: parseBayarGGDateTime(providerStatus.expires_at) || transaction.expiredAt,
    rawPayload: {
      ...(asRecord(transaction.rawPayload) || {}),
      statusCheck: providerStatus as unknown as Record<string, unknown>,
    },
  };

  if (newInternalStatus === "paid") {
    updateData.paidAt = parseBayarGGDateTime(providerStatus.paid_at) || now;

    // Validate nominal: provider base amount must match plan price
    // Note: final_amount includes gateway fees, so we compare against base amount
    const providerPaidAmount = providerStatus.amount;
    const expectedAmount = getPlanPrice(
      normalizeBillingPlanName(transaction.planName),
      transaction.billingCycle as BillingCycle
    );
    if (
      providerPaidAmount !== undefined &&
      expectedAmount > 0 &&
      providerPaidAmount !== expectedAmount
    ) {
      console.error("[billing] Polling amount mismatch - marking transaction as failed", {
        invoiceId: transaction.invoiceId,
        expected: expectedAmount,
        received: providerPaidAmount,
        plan: transaction.planName,
      });
      // Mark transaction as failed due to amount mismatch
      updateData.status = "failed";
      try {
        await db
          .update(billingTransactions)
          .set(updateData)
          .where(eq(billingTransactions.id, transaction.id));
      } catch (error) {
        console.error("[billing] Error marking mismatched transaction as failed:", error);
      }
      return { ...transaction, status: "failed" as const, updatedAt: now };
    }
  }

  try {
    await db
      .update(billingTransactions)
      .set(updateData)
      .where(eq(billingTransactions.id, transaction.id));
  } catch (error) {
    console.error("[billing] Error update transaction dari polling:", error);
    return transaction;
  }

  if (newInternalStatus === "paid" && transaction.subscriptionId) {
    const subscriptionStatus = mapBayarGGStatusToSubscription(providerStatus.status);
    const renewalDate = new Date();
    renewalDate.setMonth(
      renewalDate.getMonth() + (transaction.billingCycle === "yearly" ? 12 : 1)
    );

    try {
      await db
        .update(billingSubscriptions)
        .set({
          status: subscriptionStatus,
          planName: transaction.planName,
          renewalDate,
          updatedAt: now,
        })
        .where(eq(billingSubscriptions.id, transaction.subscriptionId));
    } catch (error) {
      console.error("[billing] Error update subscription dari polling:", error);
    }
  }

  if (
    (newInternalStatus === "expired" || newInternalStatus === "cancelled") &&
    transaction.subscriptionId
  ) {
    try {
      const subscription = await db.query.billingSubscriptions.findFirst({
        where: eq(billingSubscriptions.id, transaction.subscriptionId),
      });

      if (subscription && subscription.status === "pending") {
        await db
          .update(billingSubscriptions)
          .set({
            status: "expired",
            updatedAt: now,
          })
          .where(eq(billingSubscriptions.id, transaction.subscriptionId));
      }
    } catch (error) {
      console.error("[billing] Error reverting subscription dari polling:", error);
    }
  }

  return {
    ...transaction,
    status: newInternalStatus,
    paymentMethod:
      providerStatus.payment_method || transaction.paymentMethod || getBayarGGDefaultPaymentMethod(),
    providerReference: providerStatus.invoice_id || providerRef,
    payCode: providerStatus.paid_reff_num || transaction.payCode,
    paidAt:
      newInternalStatus === "paid"
        ? parseBayarGGDateTime(providerStatus.paid_at) || now
        : transaction.paidAt,
    expiredAt: parseBayarGGDateTime(providerStatus.expires_at) || transaction.expiredAt,
    updatedAt: now,
    rawPayload: {
      ...(asRecord(transaction.rawPayload) || {}),
      statusCheck: providerStatus as unknown as Record<string, unknown>,
    },
  };
}
