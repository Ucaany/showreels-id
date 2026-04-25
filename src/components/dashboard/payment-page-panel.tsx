"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, CreditCard, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showFeedbackAlert } from "@/lib/feedback-alert";

type PlanName = "pro" | "business";
type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";

type MidtransConfig = {
  mode: "sandbox" | "production";
  serverKeySet: boolean;
  clientKeySet: boolean;
  clientKey: string;
  snapScriptUrl: string;
};

type PaymentSummary = {
  invoiceId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionStatus: string;
  paymentMethod: string;
  snapToken: string | null;
  redirectUrl: string | null;
  expiresAt: string | null;
  qrUrl: string | null;
  qrActions: Array<{ name: string; method: string; url: string }>;
};

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

function toIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

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

export function PaymentPagePanel({
  selectedPlan,
  planLabel,
  amount,
  midtransConfig,
}: {
  selectedPlan: PlanName;
  planLabel: string;
  amount: number;
  midtransConfig: MidtransConfig;
}) {
  const createdOnceRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [error, setError] = useState("");
  const [qrRevision, setQrRevision] = useState(0);
  const midtransReady = midtransConfig.serverKeySet;
  const canUseSnapPopup = midtransConfig.clientKeySet && Boolean(midtransConfig.clientKey);

  const refreshStatus = async (silent = false) => {
    if (!payment) {
      return;
    }

    setChecking(true);
    const response = await fetch(
      `/api/billing/payment-status/${encodeURIComponent(payment.invoiceId)}`
    );
    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          payment?: PaymentSummary;
        }
      | null;
    setChecking(false);

    if (!response.ok || !payload?.payment) {
      const message = payload?.error || "Gagal cek status pembayaran.";
      if (!silent) {
        setError(message);
      }
      return;
    }

    setPayment(payload.payment);
    setQrRevision((prev) => prev + 1);
    if (!silent) {
      setError("");
    }
  };

  const openMidtransCheckout = async (targetPayment?: PaymentSummary | null) => {
    const source = targetPayment || payment;
    if (!source) {
      setError("Belum ada transaksi aktif. Klik Buat Transaksi Baru.");
      return;
    }

    if (source.status !== "pending") {
      setError("Transaksi ini tidak lagi pending. Buat transaksi baru untuk melanjutkan pembayaran.");
      return;
    }

    if (canUseSnapPopup && source.snapToken && window.snap?.pay) {
      window.snap.pay(source.snapToken, {
        onSuccess: () => void refreshStatus(true),
        onPending: () => void refreshStatus(true),
        onError: () => void refreshStatus(true),
        onClose: () => void refreshStatus(true),
      });
      return;
    }

    if (source.redirectUrl) {
      window.location.assign(source.redirectUrl);
      return;
    }

    setError("Checkout Midtrans belum siap. Pastikan transaksi memiliki Snap token atau redirect URL.");
  };

  const createPayment = async () => {
    if (!midtransReady) {
      setError("Midtrans belum dikonfigurasi. Hubungi admin untuk aktivasi payment.");
      return;
    }

    setCreating(true);
    setError("");

    const response = await fetch("/api/billing/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planName: selectedPlan,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          code?: string;
          mode?: "paid" | "free";
          payment?: PaymentSummary;
        }
      | null;
    setCreating(false);

    if (!response.ok || payload?.mode !== "paid" || !payload.payment) {
      const message =
        payload?.error ||
        "Gagal membuat transaksi Midtrans. Coba ulang beberapa saat lagi.";
      setError(message);
      await showFeedbackAlert({
        title: payload?.code === "midtrans_not_configured" ? "Midtrans belum aktif" : "Transaksi gagal",
        text: message,
        icon: "error",
      });
      return;
    }

    setPayment(payload.payment);
    setQrRevision((prev) => prev + 1);
    setError("");
  };

  useEffect(() => {
    if (!canUseSnapPopup || typeof window === "undefined") {
      return;
    }

    if (window.snap?.pay) {
      return;
    }

    const scriptId = "midtrans-snap-script";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript && existingScript.dataset.clientKey !== midtransConfig.clientKey) {
      existingScript.remove();
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = midtransConfig.snapScriptUrl;
      script.dataset.clientKey = midtransConfig.clientKey;
      script.async = true;
      document.body.appendChild(script);
    }

    const handleError = () =>
      setError("Gagal memuat Midtrans Snap.js. Coba refresh halaman atau gunakan redirect.");

    script.addEventListener("error", handleError);

    return () => {
      script?.removeEventListener("error", handleError);
    };
  }, [canUseSnapPopup, midtransConfig.clientKey, midtransConfig.snapScriptUrl]);

  useEffect(() => {
    if (createdOnceRef.current) {
      return;
    }
    createdOnceRef.current = true;
    void createPayment();
  }, [selectedPlan]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
          Midtrans Checkout
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18] sm:text-3xl">
          Checkout {planLabel} Plan
        </h1>
        <p className="mt-2 text-sm text-[#5d514b]">
          Billing bulanan {planLabel}:{" "}
          <span className="font-semibold text-[#201b18]">{toIdr(amount)}</span>
        </p>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="font-semibold text-[#201b18]">
            Mode Midtrans: <span className="capitalize">{midtransConfig.mode}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 font-semibold ${midtransConfig.serverKeySet ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}
            >
              Server Key {midtransConfig.serverKeySet ? "OK" : "Missing"}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 font-semibold ${midtransConfig.clientKeySet ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
            >
              Client Key {midtransConfig.clientKeySet ? "OK" : "Missing"}
            </span>
          </div>
        </div>
      </Card>

      {!midtransReady ? (
        <Card className="dashboard-clean-card border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-700">Midtrans belum dikonfigurasi</p>
          <p className="mt-1 text-sm text-amber-700">
            Halaman payment aktif, tapi transaksi belum bisa dibuat sampai env Midtrans lengkap.
          </p>
        </Card>
      ) : null}

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#201b18]">Detail Pembayaran</p>
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
            <Button size="sm" onClick={createPayment} disabled={creating || !midtransReady}>
              <RotateCcw className="h-4 w-4" />
              {creating ? "Membuat..." : "Buat Transaksi Baru"}
            </Button>
            <Button
              size="sm"
              onClick={() => void openMidtransCheckout()}
              disabled={!payment || payment.status !== "pending" || !midtransReady}
            >
              <CreditCard className="h-4 w-4" />
              Bayar di Midtrans
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
            {creating ? "Membuat transaksi Midtrans..." : "Belum ada transaksi aktif."}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#665a53]">Invoice</p>
                  <p className="text-sm font-semibold text-[#201b18]">{payment.invoiceId}</p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusTone(payment.status)}`}
                >
                  {payment.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#5f524b]">
                Total: <span className="font-semibold text-[#201b18]">{toIdr(payment.amount)}</span>
              </p>
              <p className="mt-1 text-sm text-[#5f524b]">
                Status Midtrans:{" "}
                <span className="font-semibold text-[#201b18]">{payment.transactionStatus}</span>
              </p>
              <p className="mt-1 text-sm text-[#5f524b]">
                Metode:{" "}
                <span className="font-semibold text-[#201b18] capitalize">{payment.paymentMethod}</span>
              </p>
              <p className="mt-1 text-sm text-[#5f524b]">
                Expired:{" "}
                <span className="font-semibold text-[#201b18]">{formatDateTime(payment.expiresAt)}</span>
              </p>
            </div>

            {payment.status === "paid" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Pembayaran terkonfirmasi.
                </p>
                <p className="mt-1">Plan akan aktif otomatis setelah webhook/status sinkron.</p>
              </div>
            ) : null}

            {payment.status === "pending" ? (
              <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
                <p className="text-sm font-semibold text-[#201b18]">Lanjutkan Checkout</p>
                <p className="mt-1 text-sm text-[#5f524b]">
                  Klik tombol <span className="font-semibold">Bayar di Midtrans</span> untuk memilih
                  metode pembayaran (kartu kredit, QRIS, dan metode lain yang aktif).
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void openMidtransCheckout()}>
                    <CreditCard className="h-4 w-4" />
                    {canUseSnapPopup ? "Buka Popup Midtrans" : "Buka Redirect Midtrans"}
                  </Button>
                  {payment.redirectUrl ? (
                    <Link href={payment.redirectUrl} target="_blank">
                      <Button variant="secondary" size="sm">
                        Buka Hosted Checkout
                      </Button>
                    </Link>
                  ) : null}
                </div>

                {midtransConfig.mode === "sandbox" ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="font-semibold">Panduan Kartu Uji Sandbox</p>
                    <p className="mt-1 font-mono text-xs sm:text-sm">4011 1111 1111 1112</p>
                    <p className="mt-1 text-xs sm:text-sm">
                      Expiry gunakan bulan apa saja (mis. 12) dengan tahun masa depan (mis. 2030).
                    </p>
                    <p className="text-xs sm:text-sm">CVV: 123, OTP/3DS: 112233</p>
                  </div>
                ) : null}

                {payment.qrUrl ? (
                  <div className="mt-5 space-y-3 rounded-xl border border-[#e7ddd7] bg-[#fcf9f7] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7f6f67]">
                      Legacy QRIS Fallback
                    </p>
                    <Image
                      src={`/api/billing/payment-status/${encodeURIComponent(payment.invoiceId)}/qr?v=${qrRevision}`}
                      alt={`QRIS ${payment.invoiceId}`}
                      width={280}
                      height={280}
                      unoptimized
                      className="h-[280px] w-[280px] rounded-xl border border-[#e7ddd7] bg-white object-contain p-3"
                    />
                    <Link href={payment.qrUrl} target="_blank">
                      <Button variant="secondary" size="sm">
                        <CreditCard className="h-4 w-4" />
                        Buka Link QRIS
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-rose-700">QR belum tersedia dari Midtrans.</p>
                )}
              </div>
            ) : null}

            {(payment.status === "failed" ||
              payment.status === "cancelled" ||
              payment.status === "expired") ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Transaksi sudah {payment.status}. Silakan buat QR baru.
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
