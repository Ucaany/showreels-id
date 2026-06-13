import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { billingSubscriptions, billingTransactions, users } from "@/db/schema";
import { queueEmail } from "@/lib/email";
import {
  getBayarGGConfig,
  isBayarGGConfigured,
  mapBayarGGStatusToInternal,
  mapBayarGGStatusToSubscription,
  parseBayarGGDateTime,
  verifyBayarGGWebhookSignature,
  type BayarGGWebhookPayload,
} from "@/server/bayar-gg";
import { getPlanPrice, type BillingCycle, type BillingPlanName } from "@/server/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(request: Request) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: "Database belum dikonfigurasi." },
      { status: 503 }
    );
  }

  if (!isBayarGGConfigured()) {
    return NextResponse.json(
      { error: "Webhook Bayar.gg belum dikonfigurasi." },
      { status: 503 }
    );
  }

  const config = getBayarGGConfig();
  const rawBody = await request.text();
  const callbackSignature = request.headers.get("X-Webhook-Signature") || "";
  const callbackTimestamp = request.headers.get("X-Webhook-Timestamp") || "";

  let payload: BayarGGWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BayarGGWebhookPayload;
  } catch {
    return NextResponse.json(
      { error: "Payload callback tidak valid." },
      { status: 400 }
    );
  }

  const isValid = await verifyBayarGGWebhookSignature({
    payload,
    callbackSignature,
    timestamp: callbackTimestamp,
    webhookSecret: config.webhookSecret,
  });

  if (!isValid) {
    console.error("[Bayar.gg Callback] Signature tidak valid");
    return NextResponse.json(
      { error: "Signature Bayar.gg tidak valid." },
      { status: 401 }
    );
  }

  if (!payload.invoice_id || !payload.status) {
    return NextResponse.json(
      { error: "Payload tidak lengkap: invoice_id dan status diperlukan." },
      { status: 400 }
    );
  }

  let transaction;
  try {
    transaction = await db.query.billingTransactions.findFirst({
      where: and(
        eq(billingTransactions.provider, "bayar_gg"),
        eq(billingTransactions.providerReference, payload.invoice_id)
      ),
    });
  } catch (error) {
    console.error("[Bayar.gg Callback] Error query transaction:", error);
    return NextResponse.json(
      { error: "Gagal mencari transaksi." },
      { status: 500 }
    );
  }

  if (!transaction) {
    console.warn(`[Bayar.gg Callback] Transaksi tidak ditemukan: ${payload.invoice_id}`);
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan." },
      { status: 404 }
    );
  }

  const previousStatus = transaction.status;
  const internalStatus = mapBayarGGStatusToInternal(payload.status);
  const now = new Date();
  const paidAt = parseBayarGGDateTime(payload.paid_at);

  const updatedRawPayload = {
    ...((transaction.rawPayload as Record<string, unknown>) || {}),
    webhook: payload as unknown as Record<string, unknown>,
  };

  try {
    await db
      .update(billingTransactions)
      .set({
        status: internalStatus,
        paymentMethod: payload.payment_method || transaction.paymentMethod || "",
        providerReference: payload.invoice_id,
        payCode: payload.paid_reff_num || transaction.payCode || "",
        paidAt: internalStatus === "paid" ? paidAt || now : transaction.paidAt,
        rawPayload: updatedRawPayload,
        updatedAt: now,
      })
      .where(eq(billingTransactions.id, transaction.id));
  } catch (error) {
    console.error("[Bayar.gg Callback] Error update transaction:", error);
    return NextResponse.json(
      { error: "Gagal update transaksi." },
      { status: 500 }
    );
  }

  const isNewPaid = internalStatus === "paid" && previousStatus !== "paid";

  // Validate nominal: webhook amount must match expected plan price exactly
  if (isNewPaid) {
    const expectedAmount = getPlanPrice(
      transaction.planName as BillingPlanName,
      (transaction.billingCycle || "monthly") as BillingCycle
    );
    const webhookAmount = payload.final_amount ?? payload.amount ?? payload.paid_amount;

    if (
      webhookAmount !== undefined &&
      expectedAmount > 0 &&
      webhookAmount !== expectedAmount
    ) {
      console.error("[Bayar.gg Callback] Amount mismatch - marking transaction as failed", {
        invoiceId: payload.invoice_id,
        expected: expectedAmount,
        received: webhookAmount,
        plan: transaction.planName,
      });

      // Mark transaction as failed due to amount mismatch
      try {
        await db
          .update(billingTransactions)
          .set({
            status: "failed",
            rawPayload: updatedRawPayload,
            updatedAt: now,
          })
          .where(eq(billingTransactions.id, transaction.id));
      } catch (error) {
        console.error("[Bayar.gg Callback] Error marking mismatched transaction as failed:", error);
      }

      // Return 200 to prevent Bayar.gg from retrying a permanently invalid webhook
      return NextResponse.json({
        success: false,
        error: "Amount mismatch: nominal pembayaran tidak sesuai harga paket.",
      });
    }
  }

  if (isNewPaid && transaction.subscriptionId) {
    const subscriptionStatus = mapBayarGGStatusToSubscription(payload.status);
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + (transaction.billingCycle === "yearly" ? 12 : 1));

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

      void (async () => {
        try {
          const user = await db.query.users.findFirst({
            where: eq(users.id, transaction.userId),
          });
          if (user?.email) {
            const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://showreels.id";
            const amount = new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(transaction.amount);

            void queueEmail({
              userId: user.id,
              recipientEmail: user.email,
              template: {
                type: "payment_success",
                data: {
                  userName: user.name || "Creator",
                  planName: transaction.planName || "Creator",
                  amount,
                  invoiceId: transaction.invoiceId,
                  dashboardUrl: `${appOrigin}/dashboard/billing`,
                },
              },
            });

            void queueEmail({
              userId: user.id,
              recipientEmail: user.email,
              template: {
                type: "subscription_activated",
                data: {
                  userName: user.name || "Creator",
                  planName: transaction.planName || "Creator",
                  expiresAt: renewalDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                  dashboardUrl: `${appOrigin}/dashboard`,
                },
              },
            });
          }
        } catch (emailError) {
          console.error("[Bayar.gg Callback] Email queue error (non-blocking):", emailError);
        }
      })();
    } catch (error) {
      console.error("[Bayar.gg Callback] Error update subscription:", error);
      return NextResponse.json(
        { error: "Gagal update subscription." },
        { status: 500 }
      );
    }
  }

  if (
    (internalStatus === "expired" || internalStatus === "cancelled") &&
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
      console.error("[Bayar.gg Callback] Error reverting subscription:", error);
    }
  }

  return NextResponse.json({ success: true });
}
