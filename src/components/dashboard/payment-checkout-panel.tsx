"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import type { BillingPaymentSummary } from "@/server/billing";

type PlanName = "creator" | "business";
type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";

function toIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getStatusTone(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "failed":
    case "cancelled":
    case "expired":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

interface PaymentCheckoutPanelProps {
  selectedPlan: PlanName;
  planLabel: string;
  amount: number;
  billingEnabled: boolean;
  bayarGGConfigured: boolean;
  existingPayment: BillingPaymentSummary | null;
  autoCheckout?: boolean;
}

export function PaymentCheckoutPanel({
  selectedPlan,
  planLabel,
  amount,
  billingEnabled,
  bayarGGConfigured,
  existingPayment,
  autoCheckout,
}: PaymentCheckoutPanelProps) {
  const createdOnceRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payment, setPayment] = useState<BillingPaymentSummary | null>(
    existingPayment || null
  );
  const [error, setError] = useState("");
  const [qrRevision, setQrRevision] = useState(0);

  const refreshStatus = async (silent = false) => {
    if (!payment) return;
    setChecking(true);
    const response = await fetch(
      `/api/billing/payment-status/${encodeURIComponent(payment.invoiceId)}`
    );
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; payment?: BillingPaymentSummary }
      | null;
    setChecking(false);

    if (!response.ok || !payload?.payment) {
      if (!silent) setError(payload?.error || "Gagal cek status pembayaran.");
      return;
    }
    setPayment(payload.payment);
    setQrRevision((prev) => prev + 1);
    if (!silent) setError("");
  };

  const createPayment = async () => {
    setCreating(true);
    setError("");

    const response = await fetch("/api/billing/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planName: selectedPlan }),
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          code?: string;
          mode?: "paid" | "free";
          payment?: BillingPaymentSummary;
        }
      | null;
    setCreating(false);

    if (!response.ok || payload?.mode !== "paid" || !payload.payment) {
      const message =
        payload?.error ||
        "Gagal membuat transaksi. Coba ulang beberapa saat lagi.";
      setError(message);
      await showFeedbackAlert({
        title:
          payload?.code === "bayar_gg_not_configured"
            ? "Bayar.gg belum dikonfigurasi"
            : payload?.code === "bayar_gg_amount_mismatch"
              ? "Nominal pembayaran tidak sesuai"
              : "Transaksi gagal",
        text: message,
        icon: "error",
      });
      return;
    }

    setPayment(payload.payment);
    setQrRevision((prev) => prev + 1);
    setError("");
  };

  // Auto-create payment on mount if autoCheckout and no existing payment
  useEffect(() => {
    if (createdOnceRef.current) return;
    if (existingPayment) {
      createdOnceRef.current = true;
      return;
    }
    if (autoCheckout && !payment && billingEnabled && bayarGGConfigured) {
      createdOnceRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void createPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheckout, billingEnabled, bayarGGConfigured, existingPayment, payment]);

  // Disabled state UI
  if (!billingEnabled) {
    return (
      <Card className="dashboard-clean-card border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🚧</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Pembayaran Segera Hadir (Coming Soon)
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Fitur pembayaran sedang dalam persiapan. Nantikan update
              selanjutnya!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!bayarGGConfigured) {
    return (
      <Card className="dashboard-clean-card border-rose-200 bg-rose-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-rose-900">
              Layanan pembayaran belum dikonfigurasi
            </p>
            <p className="mt-1 text-sm text-rose-700">
              Hubungi admin untuk mengaktifkan Bayar.gg.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
          Bayar.gg Checkout
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18] sm:text-3xl">
          Checkout {planLabel} Plan
        </h1>
        <p className="mt-2 text-sm text-[#5d514b]">
          Billing bulanan {planLabel}:{" "}
          <span className="font-semibold text-[#201b18]">{toIdr(amount)}</span>
        </p>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#201b18]">
            Detail Pembayaran
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refreshStatus()}
              disabled={!payment || checking}
            >
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              Cek Status
            </Button>
            <Button
              size="sm"
              onClick={() => void createPayment()}
              disabled={creating || (payment?.status === "pending" && !existingPayment)}
            >
              <RotateCcw className="h-4 w-4" />
              {creating ? "Membuat..." : "Buat Transaksi Baru"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {!payment ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#d9cec7] bg-[#f8f3ef] p-4 text-sm text-[#5f524b]">
            {creating ? "Membuat transaksi Bayar.gg..." : "Belum ada transaksi aktif."}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#665a53]">Invoice</p>
                  <p className="text-sm font-semibold text-[#201b18]">
                    {payment.invoiceId}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusTone(payment.status as PaymentStatus)}`}
                >
                  {payment.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#5f524b]">
                Total:{" "}
                <span className="font-semibold text-[#201b18]">
                  {toIdr(payment.amount)}
                </span>
              </p>
              <p className="mt-1 text-sm text-[#5f524b]">
                Status:{" "}
                <span className="font-semibold text-[#201b18]">
                  {payment.transactionStatus}
                </span>
              </p>
              <p className="mt-1 text-sm text-[#5f524b]">
                Metode:{" "}
                <span className="font-semibold text-[#201b18] capitalize">
                  {payment.paymentMethod || "-"}
                </span>
              </p>
              <p className="mt-1 text-sm text-[#5f524b]">
                Expired:{" "}
                <span className="font-semibold text-[#201b18]">
                  {formatDateTime(payment.expiresAt)}
                </span>
              </p>
            </div>

            {payment.status === "paid" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Pembayaran terkonfirmasi.
                </p>
                <p className="mt-1">
                  Plan akan aktif otomatis setelah status Bayar.gg tervalidasi.
                </p>
              </div>
            ) : null}

            {payment.status === "pending" && payment.checkoutUrl ? (
              <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
                <p className="text-sm font-semibold text-[#201b18]">
                  Lanjutkan Pembayaran
                </p>
                <p className="mt-1 text-sm text-[#5f524b]">
                  Klik tombol di bawah untuk membuka halaman pembayaran Bayar.gg
                  dan menyelesaikan checkout.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={payment.checkoutUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="w-full sm:w-auto">
                      <CreditCard className="h-4 w-4" />
                      Bayar via Bayar.gg
                    </Button>
                  </a>
                  {payment.payCode ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#e4dad4] bg-[#f8f3ef] px-3 py-2 text-sm">
                      <span className="text-[#5f524b]">Kode referensi:</span>
                      <span className="font-mono font-semibold text-[#201b18]">
                        {payment.payCode}
                      </span>
                    </div>
                  ) : null}
                </div>

                {payment.qrUrl ? (
                  <div className="mt-5 space-y-3 rounded-xl border border-[#e7ddd7] bg-[#fcf9f7] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7f6f67]">
                      QRIS
                    </p>
                    <Image
                      src={`/api/billing/payment-status/${encodeURIComponent(payment.invoiceId)}/qr?v=${qrRevision}`}
                      alt={`QRIS ${payment.invoiceId}`}
                      width={280}
                      height={280}
                      unoptimized
                      className="mx-auto h-auto w-full max-w-[280px] rounded-xl border border-[#e7ddd7] bg-white object-contain p-3"
                    />
                    <a href={payment.qrUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="h-4 w-4" />
                        Buka Link QRIS
                      </Button>
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}

            {payment.status === "failed" ||
            payment.status === "cancelled" ||
            payment.status === "expired" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Transaksi sudah {payment.status}. Silakan buat transaksi baru.
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/billing">
            <Button variant="secondary">Kembali ke Billing</Button>
          </Link>
          <Link href="/dashboard/settings/payment">
            <Button variant="secondary">Payment Settings</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
