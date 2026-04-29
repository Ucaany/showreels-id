"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import type { PlanFeatureChecklistItem } from "@/lib/plan-feature-matrix";

type PlanName = "free" | "creator" | "business";
type BillingCycle = "monthly" | "yearly";

type PlanConfig = {
  name: PlanName;
  label: string;
  monthly: number;
  yearlyLegacy: number;
  benefits: string[];
  benefitItems?: PlanFeatureChecklistItem[];
};

type BillingEntitlements = {
  linkBuilderMax: number | null;
  usernameChangesPer30Days: number;
  analyticsMaxDays: number;
  customThumbnailEnabled: boolean;
  whitelabelEnabled: boolean;
  creatorGroupEnabled: boolean;
  supportEnabled: boolean;
  themeSwitchComingSoon: boolean;
};

type PlanPayload = {
  id: string;
  planName: PlanName;
  billingCycle: BillingCycle;
  status: "active" | "trial" | "expired" | "failed" | "pending";
  price: number;
  currency: string;
  renewalDate: string | null;
  nextPlanName: PlanName;
};

type TransactionPayload = {
  id: string;
  invoiceId: string;
  planName: PlanName;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  createdAt: string;
};

function toIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | Date | null) {
  if (!value) return "Tidak ada renewal";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Tidak ada renewal";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRemainingDays(value: string | null) {
  if (!value) return 0;
  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function BillingPanel({
  initialPlan,
  effectivePlan,
  catalog,
  initialTransactions,
  billingEmail,
  paymentMethod,
  midtransConfig,
}: {
  initialPlan: PlanPayload;
  effectivePlan: PlanName;
  entitlements: BillingEntitlements;
  catalog: Record<PlanName, PlanConfig>;
  initialTransactions: TransactionPayload[];
  billingEmail: string;
  paymentMethod: string;
  midtransConfig: {
    mode: "sandbox" | "production";
    serverKeySet: boolean;
    clientKeySet: boolean;
  };
  creatorGroupLink: string;
  supportLink: string;
}) {
  const searchParams = useSearchParams();
  const [activePlan, setActivePlan] = useState(initialPlan);
  const [effectivePlanName, setEffectivePlanName] = useState<PlanName>(effectivePlan);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [refreshing, setRefreshing] = useState(false);
  const [stopping, setStopping] = useState(false);

  const activePlanLabel = catalog[effectivePlanName]?.label || effectivePlanName;
  const activePrice = catalog[effectivePlanName]?.monthly || 0;
  const remainingDays = getRemainingDays(activePlan.renewalDate);
  const renewTarget: PlanName = effectivePlanName === "free" ? "creator" : effectivePlanName;
  const recentTransactions = useMemo(() => transactions.slice(0, 4), [transactions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const [planRes, txRes] = await Promise.all([
      fetch("/api/billing/plan"),
      fetch("/api/billing/transactions"),
    ]);
    if (planRes.ok) {
      const payload = (await planRes.json()) as {
        plan: PlanPayload;
        effectivePlan?: { planName?: PlanName };
      };
      setActivePlan(payload.plan);
      if (payload.effectivePlan?.planName) {
        setEffectivePlanName(payload.effectivePlan.planName);
      }
    }
    if (txRes.ok) {
      const payload = (await txRes.json()) as { transactions: TransactionPayload[] };
      setTransactions(payload.transactions || []);
    }
    setRefreshing(false);
  };

  const handleRenew = () => {
    window.location.assign(`/payment?plan=${renewTarget}&intent=checkout`);
  };

  const handleStopPlan = async () => {
    if (effectivePlanName === "free") {
      await showFeedbackAlert({
        title: "Plan Free aktif",
        text: "Tidak ada paket berbayar yang perlu dihentikan.",
        icon: "info",
      });
      return;
    }

    const confirmed = await confirmFeedbackAction({
      title: "Stop paket aktif?",
      text: "Paket akan kembali ke Free dan fitur Creator/Business akan terkunci.",
      confirmButtonText: "Ya, stop paket",
      cancelButtonText: "Batal",
      icon: "warning",
    });
    if (!confirmed) return;

    setStopping(true);
    const response = await fetch("/api/billing/downgrade", { method: "POST" });
    setStopping(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      await showFeedbackAlert({
        title: "Stop paket gagal",
        text: payload?.error || "Coba lagi beberapa saat.",
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({
      title: "Paket berhasil distop",
      text: "Akun kamu sekarang kembali ke plan Free.",
      icon: "success",
      timer: 1400,
    });
    await handleRefresh();
  };

  useEffect(() => {
    if (searchParams.get("payment") !== "success") return;
    void showFeedbackAlert({
      title: "Terima kasih sudah berlangganan",
      text: "Paket kamu sudah aktif. Sekarang kamu bisa menggunakan fitur Showreels.id sesuai paket yang dipilih.",
      icon: "success",
      confirmButtonText: "Masuk Dashboard",
    });
    const refreshTimer = window.setTimeout(() => {
      void handleRefresh();
    }, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [searchParams]);

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card overflow-hidden border-[#cfddf5] bg-white p-0">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-5 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
              <CreditCard className="h-3.5 w-3.5" />
              Billing
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">
              Paket aktif kamu: {activePlanLabel}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#55709d] sm:text-base">
              Ringkasan paket, masa aktif, perpanjang, dan stop paket dibuat sederhana agar mudah dipantau.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={handleRenew} disabled={!midtransConfig.serverKeySet}>
                <Sparkles className="h-4 w-4" />
                Perpanjang
              </Button>
              <Button variant="secondary" onClick={handleStopPlan} disabled={stopping || effectivePlanName === "free"}>
                <XCircle className="h-4 w-4" />
                {stopping ? "Memproses..." : "Stop Paket"}
              </Button>
              <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-[radial-gradient(circle_at_top_right,#f1f5f9,transparent_36%),linear-gradient(180deg,#f8fbff,#f8fafc)] p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.35rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Harga Bulanan</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{toIdr(activePrice)}</p>
                <p className="mt-1 text-xs text-slate-500">Status: <span className="font-semibold capitalize text-slate-900">{activePlan.status}</span></p>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <CalendarClock className="h-4 w-4 text-slate-700" />
                  Sisa Masa Aktif
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{remainingDays} hari</p>
                <p className="mt-1 text-xs text-slate-500">Renewal: {formatDate(activePlan.renewalDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {activePlan.status === "trial" && activePlan.renewalDate && (
        <Card className="dashboard-clean-card overflow-hidden border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-4">
            <span className="text-4xl">🎁</span>
            <div className="flex-1">
              <p className="text-lg font-semibold text-slate-900">
                Trial Plan Creator Aktif
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Berakhir pada: {new Date(activePlan.renewalDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })} ({remainingDays} hari lagi)
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Setelah trial berakhir, akun akan otomatis turun ke plan Free. Upgrade sekarang untuk terus menggunakan fitur Creator!
              </p>
              <Link href="/payment?plan=creator&intent=checkout" className="mt-3 inline-block">
                <Button size="sm" className="bg-zinc-800 hover:bg-zinc-700">
                  <Sparkles className="h-4 w-4" />
                  Upgrade ke Creator
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {!midtransConfig.serverKeySet ? (
        <Card className="dashboard-clean-card border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-700">Konfigurasi pembayaran belum lengkap</p>
          <p className="mt-1 text-sm text-amber-700">
            Konfigurasi server pembayaran belum terdeteksi. Checkout berbayar dapat gagal sampai environment production diperbarui.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="dashboard-clean-card border-[#cfddf5] bg-white p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Rincian akun billing</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Billing Email</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">{billingEmail}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Payment Method</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{paymentMethod}</p>
            </div>
          </div>
        </Card>

        <Card className="dashboard-clean-card border-[#cfddf5] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">Transaksi</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Riwayat terbaru</h2>
            </div>
            <Link href="/payment">
              <Button variant="secondary" size="sm">
                <ShieldCheck className="h-4 w-4" />
                Pilih Plan
              </Button>
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Belum ada transaksi.
              </div>
            ) : (
              recentTransactions.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.invoiceId}</p>
                    <p className="text-xs text-slate-500">
                      {catalog[item.planName]?.label || item.planName} - {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#d6e4fb] bg-white px-2.5 py-1 text-xs font-semibold capitalize text-slate-500">
                      {item.status === "paid" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
                      {item.status}
                    </span>
                    <Link href={`/api/billing/invoice/${item.invoiceId}?download=1`} target="_blank">
                      <Button size="sm" variant="secondary" aria-label="Download invoice">
                        <Download className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

