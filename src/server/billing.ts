import { and, desc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { billingSubscriptions, billingTransactions } from "@/db/schema";

export type BillingPlanName = "free" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

type PlanConfig = {
  name: BillingPlanName;
  label: string;
  monthly: number;
  yearly: number;
  benefits: string[];
};

const PLAN_CATALOG: Record<BillingPlanName, PlanConfig> = {
  free: {
    name: "free",
    label: "Free",
    monthly: 0,
    yearly: 0,
    benefits: [
      "Maksimal 10 custom links",
      "Profile publik + video showcase",
      "Dashboard analytics traffic",
    ],
  },
  pro: {
    name: "pro",
    label: "Pro",
    monthly: 49000,
    yearly: 490000,
    benefits: [
      "Link builder lanjutan",
      "Whitelabel toggle",
      "Analytics dashboard lengkap",
    ],
  },
  business: {
    name: "business",
    label: "Business",
    monthly: 149000,
    yearly: 1490000,
    benefits: [
      "Semua fitur Pro",
      "Prioritas support",
      "Akses penuh billing settings",
    ],
  },
};

function midtransBaseUrl() {
  const isProduction =
    (process.env.MIDTRANS_IS_PRODUCTION || "").toLowerCase() === "true";
  return isProduction
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
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

export function isMidtransConfigured() {
  return Boolean((process.env.MIDTRANS_SERVER_KEY || "").trim());
}

export function getPlanCatalog() {
  return PLAN_CATALOG;
}

export function getPlanPrice(planName: BillingPlanName, cycle: BillingCycle) {
  const selected = PLAN_CATALOG[planName];
  return cycle === "yearly" ? selected.yearly : selected.monthly;
}

export async function getOrCreateSubscription(userId: string) {
  if (!isDatabaseConfigured) {
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

  const existing = await db.query.billingSubscriptions.findFirst({
    where: eq(billingSubscriptions.userId, userId),
  });
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(billingSubscriptions)
    .values({
      userId,
      planName: "free",
      billingCycle: "monthly",
      status: "active",
      price: 0,
      currency: "IDR",
      nextPlanName: "free",
    })
    .returning();

  return created;
}

export async function getBillingTransactions(userId: string) {
  if (!isDatabaseConfigured) {
    return [] as Array<
      {
        id: string;
        invoiceId: string;
        amount: number;
        currency: string;
        status: string;
        createdAt: Date;
        planName: string;
        billingCycle: string;
      }
    >;
  }

  return db.query.billingTransactions.findMany({
    where: eq(billingTransactions.userId, userId),
    orderBy: desc(billingTransactions.createdAt),
    limit: 30,
  });
}

export async function createUpgradeTransaction(input: {
  userId: string;
  fullName: string;
  email: string;
  targetPlan: BillingPlanName;
  billingCycle: BillingCycle;
}) {
  const subscription = await getOrCreateSubscription(input.userId);
  const amount = getPlanPrice(input.targetPlan, input.billingCycle);
  const invoiceId = buildInvoiceId(input.userId);

  if (!isDatabaseConfigured) {
    return {
      ok: false as const,
      code: "db_not_ready",
      message: "Database belum siap untuk transaksi billing.",
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
      mode: "free",
      transaction,
      subscription: updatedSubscription,
    };
  }

  if (!isMidtransConfigured()) {
    return {
      ok: false as const,
      code: "midtrans_not_configured",
      message:
        "Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di environment.",
    };
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const response = await fetch(`${midtransBaseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
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
          id: `${input.targetPlan}-${input.billingCycle}`,
          price: amount,
          quantity: 1,
          name: `Showreels ${PLAN_CATALOG[input.targetPlan].label} (${input.billingCycle})`,
        },
      ],
      customer_details: {
        first_name: input.fullName || "Creator",
        email: input.email,
      },
      custom_field1: input.targetPlan,
      custom_field2: input.billingCycle,
      custom_field3: input.userId,
      enabled_payments: [
        "gopay",
        "bank_transfer",
        "credit_card",
        "qris",
        "shopeepay",
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        token?: string;
        redirect_url?: string;
        error_messages?: string[];
      }
    | null;

  if (!response.ok || !payload?.token || !payload.redirect_url) {
    return {
      ok: false as const,
      code: "midtrans_error",
      message:
        payload?.error_messages?.[0] ||
        "Gagal membuat transaksi Midtrans. Coba ulang beberapa saat lagi.",
    };
  }

  const [transaction] = await db
    .insert(billingTransactions)
    .values({
      userId: input.userId,
      subscriptionId: subscription.id,
      invoiceId,
      planName: input.targetPlan,
      billingCycle: input.billingCycle,
      amount,
      currency: "IDR",
      status: "pending",
      provider: "midtrans",
      providerReference: invoiceId,
      snapToken: payload.token,
      redirectUrl: payload.redirect_url,
      paymentMethod: "midtrans",
      description: `Upgrade ke ${PLAN_CATALOG[input.targetPlan].label}`,
      rawPayload: payload as Record<string, unknown>,
    })
    .returning();

  await db
    .update(billingSubscriptions)
    .set({
      status: "pending",
      nextPlanName: input.targetPlan,
      billingCycle: input.billingCycle,
      price: amount,
      updatedAt: new Date(),
    })
    .where(eq(billingSubscriptions.id, subscription.id));

  return {
    ok: true as const,
    mode: "paid",
    transaction,
    snapToken: payload.token,
    redirectUrl: payload.redirect_url,
  };
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
  gross_amount?: string;
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

  const [updatedTransaction] = await db
    .update(billingTransactions)
    .set({
      status: mappedTransactionStatus,
      paymentMethod: payload.payment_type || transaction.paymentMethod,
      currency: payload.currency || transaction.currency,
      amount:
        Number(payload.gross_amount || transaction.amount) || transaction.amount,
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
            (transaction.billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
        )
      : subscription.renewalDate;

    await db
      .update(billingSubscriptions)
      .set({
        planName: isPaid ? transaction.planName : subscription.planName,
        nextPlanName: isPaid ? transaction.planName : subscription.nextPlanName,
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
}
