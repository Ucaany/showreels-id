import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { billingSubscriptions, billingTransactions, users } from "@/db/schema";
import {
  verifyTripayCallbackSignature,
  getTripayConfig,
  mapTripayStatusToInternal,
  mapTripayStatusToSubscription,
  type TripayCallbackPayload,
} from "@/server/tripay";
import { queueEmail } from "@/lib/email";

// Force Node.js runtime dan disable caching untuk webhook route
// Ini mencegah Edge Runtime redirect (307) yang menyebabkan callback gagal
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

  const config = getTripayConfig();
  const rawBody = await request.text();
  const callbackSignature = request.headers.get("X-Callback-Signature") || "";

  // Verify signature
  if (config.privateKey) {
    const isValid = verifyTripayCallbackSignature({
      callbackSignature,
      rawBody,
      privateKey: config.privateKey,
    });

    if (!isValid) {
      console.error("[Tripay Callback] Signature tidak valid");
      return NextResponse.json(
        { error: "Signature Tripay tidak valid." },
        { status: 401 }
      );
    }
  }

  // Parse payload
  let payload: TripayCallbackPayload;
  try {
    payload = JSON.parse(rawBody) as TripayCallbackPayload;
  } catch {
    return NextResponse.json(
      { error: "Payload callback tidak valid." },
      { status: 400 }
    );
  }

  if (!payload.merchant_ref || !payload.status) {
    return NextResponse.json(
      { error: "Payload tidak lengkap: merchant_ref dan status diperlukan." },
      { status: 400 }
    );
  }

  const invoiceId = payload.merchant_ref;
  const tripayStatus = payload.status;
  const internalStatus = mapTripayStatusToInternal(tripayStatus);

  // Find transaction by invoiceId
  let transaction;
  try {
    transaction = await db.query.billingTransactions.findFirst({
      where: eq(billingTransactions.invoiceId, invoiceId),
    });
  } catch (error) {
    console.error("[Tripay Callback] Error query transaction:", error);
    return NextResponse.json(
      { error: "Gagal mencari transaksi." },
      { status: 500 }
    );
  }

  if (!transaction) {
    console.warn(`[Tripay Callback] Transaksi tidak ditemukan: ${invoiceId}`);
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan." },
      { status: 404 }
    );
  }

  // Update transaction status
  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: internalStatus,
    paymentMethod: payload.payment_method || payload.payment_method_code || "",
    providerReference: payload.reference || "",
    rawPayload: payload as unknown as Record<string, unknown>,
    updatedAt: now,
  };

  if (internalStatus === "paid") {
    updateData.paidAt = payload.paid_at ? new Date(payload.paid_at * 1000) : now;
  }

  try {
    await db
      .update(billingTransactions)
      .set(updateData)
      .where(eq(billingTransactions.id, transaction.id));
  } catch (error) {
    console.error("[Tripay Callback] Error update transaction:", error);
    return NextResponse.json(
      { error: "Gagal update transaksi." },
      { status: 500 }
    );
  }

  // Update subscription if payment is successful
  if (internalStatus === "paid" && transaction.subscriptionId) {
    const subscriptionStatus = mapTripayStatusToSubscription(tripayStatus);
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

      // Fire-and-forget: queue payment success & subscription email
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

            // Payment success email
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

            // Subscription activated email
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
          console.error("[Tripay Callback] Email queue error (non-blocking):", emailError);
        }
      })();
    } catch (error) {
      console.error("[Tripay Callback] Error update subscription:", error);
      return NextResponse.json(
        { error: "Gagal update subscription." },
        { status: 500 }
      );
    }
  }

  // If payment expired/failed and subscription was pending, revert
  if ((internalStatus === "expired" || internalStatus === "failed") && transaction.subscriptionId) {
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
      console.error("[Tripay Callback] Error reverting subscription:", error);
    }
  }

  return NextResponse.json({ success: true });
}
