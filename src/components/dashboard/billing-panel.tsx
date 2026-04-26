"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CreditCard, Download, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import {
  getPlanFeatureChecklistFromBullets,
  getPlanFeatureComingSoonLabel,
  type PlanFeatureChecklistItem,
} from "@/lib/plan-feature-matrix";

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
  effectivePlan,
  entitlements,
  catalog,
  initialTransactions,
  billingEmail,
  paymentMethod,
  midtransConfig,
  creatorGroupLink,
  supportLink,
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
  const [activePlan, setActivePlan] = useState(initialPlan);
  const [effectivePlanName, setEffectivePlanName] = useState<PlanName>(effectivePlan);
  const [entitlementsState, setEntitlementsState] = useState<BillingEntitlements>(entitlements);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [submittingPlan, setSubmittingPlan] = useState<PlanName | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const midtransReady = midtransConfig.serverKeySet;

  const activePlanLabel = useMemo(
    () => catalog[effectivePlanName]?.label || effectivePlanName,
    [effectivePlanName, catalog]
  );
  const comingSoonLabel = getPlanFeatureComingSoonLabel("id");

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
        entitlements?: BillingEntitlements;
      };
      setActivePlan(payload.plan);
      if (payload.effectivePlan?.planName) {
        setEffectivePlanName(payload.effectivePlan.planName);
      }
      if (payload.entitlements) {
        setEntitlementsState(payload.entitlements);
      }
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
        text: "Akses fitur Creator/Business akan nonaktif setelah downgrade.",
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
      text: "Kamu akan diarahkan ke halaman pembayaran Midtrans (bulanan).",
      confirmButtonText: "Lanjutkan",
    });
    if (!confirmed) return;

    setSubmittingPlan(planName);
    window.location.assign(`/payment?plan=${planName}&intent=checkout`);
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
            <p className="text-sm font-medium text-[#6a5d56]">Effective Plan</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#201b18]">
              {activePlanLabel}
            </h2>
            <p className="mt-1 text-sm text-[#5f524b]">
              Status subscription:{" "}
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
              <span className="font-semibold capitalize text-[#201b18]">{paymentMethod}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#e4dad4] bg-white p-3">
            <p className="text-xs font-semibold text-[#6f625a]">Cycle pembelian</p>
            <p className="mt-2 text-sm font-semibold text-[#201b18]">Bulanan saja</p>
            <p className="mt-1 text-xs text-[#6f625a]">
              Data tahunan lama tetap tampil sebagai histori transaksi.
            </p>
          </div>
        </div>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#201b18]">Status Integrasi Midtrans</p>
            <p className="mt-1 text-xs text-[#6f625a]">
              Mode:{" "}
              <span className="font-semibold capitalize text-[#201b18]">
                {midtransConfig.mode}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span
              className={`rounded-full border px-2.5 py-1 font-semibold ${midtransConfig.serverKeySet ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}
            >
              Server Key: {midtransConfig.serverKeySet ? "Terdeteksi" : "Belum diisi"}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 font-semibold ${midtransConfig.clientKeySet ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
            >
              Client Key: {midtransConfig.clientKeySet ? "Terdeteksi" : "Belum diisi"}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6f625a]">
          Server Key wajib untuk membuat transaksi. Client Key dipakai agar popup Snap aktif;
          tanpa Client Key checkout tetap bisa lewat redirect URL Midtrans.
        </p>
      </Card>

      {!midtransReady ? (
        <Card className="dashboard-clean-card border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-700">Midtrans belum dikonfigurasi</p>
          <p className="mt-1 text-sm text-amber-700">
            Upgrade plan sementara nonaktif sampai environment Midtrans diisi.
          </p>
        </Card>
      ) : null}

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-[#201b18]">Entitlements Aktif</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#e4dad4] bg-white p-3">
            <p className="text-xs text-[#6f625a]">Link Builder</p>
            <p className="mt-1 text-sm font-semibold text-[#201b18]">
              {typeof entitlementsState.linkBuilderMax === "number"
                ? `Maks ${entitlementsState.linkBuilderMax} link`
                : "Unlimited"}
            </p>
          </div>
          <div className="rounded-xl border border-[#e4dad4] bg-white p-3">
            <p className="text-xs text-[#6f625a]">Analytics</p>
            <p className="mt-1 text-sm font-semibold text-[#201b18]">
              {entitlementsState.analyticsMaxDays} hari
            </p>
          </div>
          <div className="rounded-xl border border-[#e4dad4] bg-white p-3">
            <p className="text-xs text-[#6f625a]">Username Changes</p>
            <p className="mt-1 text-sm font-semibold text-[#201b18]">
              {entitlementsState.usernameChangesPer30Days}x / 30 hari
            </p>
          </div>
          <div className="rounded-xl border border-[#e4dad4] bg-white p-3">
            <p className="text-xs text-[#6f625a]">Whitelabel</p>
            <p className="mt-1 text-sm font-semibold text-[#201b18]">
              {entitlementsState.whitelabelEnabled ? "Business Unlocked" : "Business Only"}
            </p>
          </div>
        </div>
      </Card>

      {(entitlementsState.creatorGroupEnabled || entitlementsState.supportEnabled) &&
      (creatorGroupLink || supportLink) ? (
        <section className="grid gap-3 md:grid-cols-2">
          {entitlementsState.creatorGroupEnabled && creatorGroupLink ? (
            <Card className="dashboard-clean-card border-border bg-surface p-4">
              <h3 className="text-base font-semibold text-[#201b18]">Grup Khusus Creator</h3>
              <p className="mt-1 text-sm text-[#5f524b]">
                Akses komunitas creator untuk update dan networking.
              </p>
              <Link href={creatorGroupLink} target="_blank" className="mt-3 inline-block">
                <Button size="sm" variant="secondary">
                  Buka Grup
                </Button>
              </Link>
            </Card>
          ) : null}
          {entitlementsState.supportEnabled && supportLink ? (
            <Card className="dashboard-clean-card border-border bg-surface p-4">
              <h3 className="text-base font-semibold text-[#201b18]">Contact Support</h3>
              <p className="mt-1 text-sm text-[#5f524b]">
                Hubungi tim support creator untuk bantuan prioritas.
              </p>
              <Link href={supportLink} target="_blank" className="mt-3 inline-block">
                <Button size="sm" variant="secondary">
                  Hubungi Support
                </Button>
              </Link>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(catalog) as PlanName[]).map((planName) => {
          const plan = catalog[planName];
          const isCurrent = planName === effectivePlanName;

          return (
            <Card
              key={plan.name}
              className="dashboard-clean-card border-border bg-surface flex h-full flex-col p-4"
            >
              <p className="text-sm font-semibold text-[#201b18]">{plan.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#201b18]">{toIdr(plan.monthly)}</p>
              <p className="text-xs text-[#635750]">per bulan</p>
              <ul className="mt-3 flex-1 space-y-2 text-sm">
                {(plan.benefitItems?.length
                  ? plan.benefitItems
                  : getPlanFeatureChecklistFromBullets(plan.benefits, "id")
                ).map((benefit) => {
                  const isUnavailable = benefit.status === "unavailable";
                  const isComingSoon = benefit.status === "coming_soon";

                  return (
                    <li key={`${plan.name}-${benefit.id}`} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${isUnavailable ? "bg-[#f0eae6] text-[#8d7f77] ring-[#e5d7cf]" : "bg-emerald-50 text-emerald-600 ring-emerald-200"}`}
                        aria-hidden="true"
                      >
                        {isUnavailable ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span
                        className={`min-w-0 leading-snug ${isUnavailable ? "text-[#8f8179] line-through" : "text-[#3f3530]"}`}
                      >
                        {benefit.label}
                        {isComingSoon ? (
                          <span className="ml-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                            {comingSoonLabel}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
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
