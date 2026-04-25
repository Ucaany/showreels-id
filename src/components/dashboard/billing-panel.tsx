"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CreditCard, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";

type PlanName = "free" | "pro" | "business";
type BillingCycle = "monthly" | "yearly";

type PlanConfig = {
  name: PlanName;
  label: string;
  monthly: number;
  yearly: number;
  benefits: string[];
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
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function BillingPanel({
  initialPlan,
  catalog,
  initialTransactions,
  billingEmail,
  paymentMethod,
  midtransReady,
}: {
  initialPlan: PlanPayload;
  catalog: Record<PlanName, PlanConfig>;
  initialTransactions: TransactionPayload[];
  billingEmail: string;
  paymentMethod: string;
  midtransReady: boolean;
}) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [activePlan, setActivePlan] = useState(initialPlan);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [submittingPlan, setSubmittingPlan] = useState<PlanName | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const activePlanLabel = useMemo(
    () => catalog[activePlan.planName]?.label || activePlan.planName,
    [activePlan.planName, catalog]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    const [planRes, txRes] = await Promise.all([
      fetch("/api/billing/plan"),
      fetch("/api/billing/transactions"),
    ]);
    if (planRes.ok) {
      const payload = (await planRes.json()) as {
        plan: PlanPayload;
      };
      setActivePlan(payload.plan);
    }
    if (txRes.ok) {
      const payload = (await txRes.json()) as { transactions: TransactionPayload[] };
      setTransactions(payload.transactions || []);
    }
    setRefreshing(false);
  };

  const handleUpgrade = async (planName: PlanName) => {
    if (planName === "free") {
      const confirmed = await confirmFeedbackAction({
        title: "Downgrade ke Free?",
        text: "Akses fitur Pro/Business akan nonaktif setelah downgrade.",
        confirmButtonText: "Ya, downgrade",
      });
      if (!confirmed) return;

      setSubmittingPlan(planName);
      const response = await fetch("/api/billing/downgrade", { method: "POST" });
      setSubmittingPlan(null);
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        await showFeedbackAlert({
          title: "Downgrade gagal",
          text: payload?.error || "Coba lagi beberapa saat.",
          icon: "error",
        });
        return;
      }
      await showFeedbackAlert({
        title: "Plan berhasil diubah",
        text: "Akun kamu sekarang berada di plan Free.",
        icon: "success",
      });
      await handleRefresh();
      return;
    }

    const confirmed = await confirmFeedbackAction({
      title: `Upgrade ke ${catalog[planName].label}?`,
      text: `Kamu akan diarahkan ke halaman pembayaran Midtrans (${billingCycle}).`,
      confirmButtonText: "Lanjutkan",
    });
    if (!confirmed) return;

    setSubmittingPlan(planName);
    const response = await fetch("/api/billing/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planName,
        billingCycle,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          code?: string;
          mode?: "free" | "paid";
          redirectUrl?: string;
        }
      | null;
    setSubmittingPlan(null);

    if (!response.ok) {
      await showFeedbackAlert({
        title:
          payload?.code === "midtrans_not_configured"
            ? "Midtrans belum aktif"
            : "Upgrade gagal",
        text:
          payload?.error ||
          "Sistem belum bisa membuat transaksi. Coba beberapa saat lagi.",
        icon: payload?.code === "midtrans_not_configured" ? "warning" : "error",
      });
      return;
    }

    if (payload?.mode === "paid" && payload.redirectUrl) {
      await showFeedbackAlert({
        title: "Transaksi dibuat",
        text: "Kamu akan diarahkan ke pembayaran Midtrans.",
        icon: "success",
        timer: 1100,
      });
      window.location.assign(payload.redirectUrl);
      return;
    }

    await showFeedbackAlert({
      title: "Upgrade berhasil",
      icon: "success",
      timer: 1200,
    });
    await handleRefresh();
  };

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
              Billing
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18] sm:text-3xl">
              Payment & Plan
            </h1>
            <p className="mt-2 text-sm text-[#5d514b]">
              Kelola plan aktif, transaksi, dan pembayaran creator kamu.
            </p>
          </div>
          <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-medium text-[#6a5d56]">Active Plan</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#201b18]">
              {activePlanLabel}
            </h2>
            <p className="mt-1 text-sm text-[#5f524b]">
              Status:{" "}
              <span className="font-semibold capitalize text-[#201b18]">{activePlan.status}</span>
            </p>
            <p className="mt-1 text-sm text-[#5f524b]">
              Renewal date: {formatDate(activePlan.renewalDate)}
            </p>
            <p className="mt-1 text-sm text-[#5f524b]">
              Billing email: <span className="font-semibold text-[#201b18]">{billingEmail}</span>
            </p>
            <p className="mt-1 text-sm text-[#5f524b]">
              Payment method:{" "}
              <span className="font-semibold text-[#201b18] capitalize">{paymentMethod}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#e4dad4] bg-white p-3">
            <p className="text-xs font-semibold text-[#6f625a]">Cycle pembelian</p>
            <Select
              value={billingCycle}
              onChange={(event) => setBillingCycle(event.target.value as BillingCycle)}
              className="mt-2 min-w-[180px]"
            >
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </Select>
          </div>
        </div>
      </Card>

      {!midtransReady ? (
        <Card className="dashboard-clean-card border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-700">Midtrans belum dikonfigurasi</p>
          <p className="mt-1 text-sm text-amber-700">
            Upgrade plan sementara nonaktif sampai environment Midtrans diisi.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(catalog) as PlanName[]).map((planName) => {
          const plan = catalog[planName];
          const isCurrent = planName === activePlan.planName;
          const price = billingCycle === "yearly" ? plan.yearly : plan.monthly;

          return (
            <Card key={plan.name} className="dashboard-clean-card border-border bg-surface p-4">
              <p className="text-sm font-semibold text-[#201b18]">{plan.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#201b18]">{toIdr(price)}</p>
              <p className="text-xs text-[#635750]">
                {billingCycle === "yearly" ? "per tahun" : "per bulan"}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-[#5f524b]">
                {plan.benefits.map((benefit) => (
                  <li key={benefit}>- {benefit}</li>
                ))}
              </ul>
              <div className="mt-4">
                <Button
                  variant={isCurrent ? "secondary" : "primary"}
                  disabled={
                    submittingPlan !== null ||
                    (planName !== "free" && !midtransReady) ||
                    (isCurrent && activePlan.status === "active")
                  }
                  onClick={() => handleUpgrade(planName)}
                >
                  <CreditCard className="h-4 w-4" />
                  {isCurrent ? "Plan Aktif" : planName === "free" ? "Downgrade" : "Upgrade"}
                </Button>
              </div>
            </Card>
          );
        })}
      </section>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#201b18]">Transaction History</h2>
          <Link href="/dashboard/settings/payment">
            <Button variant="secondary" size="sm">
              Payment Settings
            </Button>
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d9cec7] bg-[#f8f3ef] p-4 text-sm text-[#5f524b]">
              Belum ada transaksi.
            </div>
          ) : (
            transactions.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#e4dad4] bg-white p-3 sm:p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#201b18]">{item.invoiceId}</p>
                    <p className="text-xs text-[#665a53]">
                      {catalog[item.planName]?.label || item.planName} - {item.billingCycle}
                    </p>
                    <p className="text-xs text-[#665a53]">{formatDate(item.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#201b18]">{toIdr(item.amount)}</p>
                    <p className="text-xs capitalize text-[#665a53]">{item.status}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/api/billing/invoice/${item.invoiceId}?download=1`} target="_blank">
                    <Button size="sm" variant="secondary">
                      <Download className="h-4 w-4" />
                      Invoice
                    </Button>
                  </Link>
                  {item.status === "pending" ? (
                    <Button size="sm" variant="secondary" disabled>
                      <ArrowUpRight className="h-4 w-4" />
                      Menunggu Pembayaran
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
