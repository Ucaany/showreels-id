"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/cn";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import { getPlanFeatureChecklist, getPlanFeatureComingSoonLabel } from "@/lib/plan-feature-matrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PlanName = "free" | "creator" | "business";
type FlowStep = "selection" | "confirmation" | "result";

type BillingPlanPayload = {
  planName?: PlanName;
  status?: "active" | "trial" | "expired" | "failed" | "pending";
};

type BillingPlanResponse = {
  plan?: BillingPlanPayload;
  effectivePlan?: {
    planName?: PlanName;
  };
};

type PaymentSummary = {
  invoiceId: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  transactionStatus: string;
  paymentMethod: string;
  snapToken: string | null;
  redirectUrl: string | null;
  expiresAt: string | null;
  qrUrl: string | null;
};

type PaymentRuntimeConfig = {
  mode: "sandbox" | "production";
  serverKeySet: boolean;
};

type AccountPreview = {
  name: string | null;
  email: string | null;
  username: string | null;
};

type CheckoutResponse = {
  success?: boolean;
  mode?: "paid" | "free";
  code?: string;
  message?: string;
  payment_url?: string | null;
  payment?: PaymentSummary;
};

function toIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getDefaultDescription(planName: PlanName, locale: "id" | "en") {
  if (locale === "en") {
    if (planName === "free") return "Start with a personal public profile.";
    if (planName === "creator") return "For creators who need deeper control.";
    return "Designed for studios and growing teams.";
  }

  if (planName === "free") return "Mulai dengan profil publik personal.";
  if (planName === "creator") return "Untuk creator yang butuh kontrol lebih dalam.";
  return "Dirancang untuk studio dan tim yang bertumbuh.";
}

function getFlowStepLabel(step: FlowStep, locale: "id" | "en") {
  if (locale === "en") {
    if (step === "selection") return "Select plan";
    if (step === "confirmation") return "Confirm";
    return "Result";
  }

  if (step === "selection") return "Pilih paket";
  if (step === "confirmation") return "Konfirmasi";
  return "Hasil";
}

function getBusinessBonusCopy(locale: "id" | "en") {
  if (locale === "en") {
    return {
      title: "Business bonus",
      primary: "Free Resume CV & Portfolio Canva templates",
      secondary: "Worth Rp50.000, lifetime access.",
    };
  }

  return {
    title: "Bonus Business",
    primary: "Free template Resume CV & Portofolio Canva",
    secondary: "Senilai Rp50.000, akses selamanya.",
  };
}

export function PricingSubscriptionPage({
  initialPlan,
  autoCheckoutIntent,
  isLoggedIn,
  isOwner,
  planPricing,
  paymentConfig,
  account,
}: {
  initialPlan: PlanName;
  autoCheckoutIntent: boolean;
  isLoggedIn: boolean;
  isOwner: boolean;
  planPricing: Record<PlanName, number>;
  paymentConfig: PaymentRuntimeConfig;
  account: AccountPreview;
}) {
  const { dictionary, locale } = usePreferences();
  const featureLocale = locale === "en" ? "en" : "id";
  const comingSoonLabel = getPlanFeatureComingSoonLabel(featureLocale);
  const businessBonus = getBusinessBonusCopy(featureLocale);
  const canUseCreatorBilling = isLoggedIn && !isOwner;
  const paymentReady = paymentConfig.serverKeySet;

  const [selectedPlan, setSelectedPlan] = useState<PlanName>(initialPlan);
  const [flowStep, setFlowStep] = useState<FlowStep>("selection");
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultTitle, setResultTitle] = useState("");
  const [resultDescription, setResultDescription] = useState("");
  const [resultTone, setResultTone] = useState<"success" | "error">("success");
  const [effectivePlan, setEffectivePlan] = useState<PlanName | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("-");

  const autoCheckoutRef = useRef(false);

  const plans = useMemo(
    () =>
      (["free", "creator", "business"] as PlanName[]).map((planName) => ({
        id: planName,
        name:
          planName === "free"
            ? "Free"
            : planName === "creator"
              ? "Creator"
              : "Business",
        featured: planName === "creator",
        price: planPricing[planName],
        description:
          planName === "free"
            ? dictionary.landingPricingFree
            : planName === "creator"
              ? dictionary.landingPricingCreator
              : dictionary.landingPricingTeam,
        points: getPlanFeatureChecklist(planName, featureLocale),
      })),
    [
      dictionary.landingPricingFree,
      dictionary.landingPricingCreator,
      dictionary.landingPricingTeam,
      featureLocale,
      planPricing,
    ]
  );

  const selectedPlanInfo = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) || plans[0],
    [plans, selectedPlan]
  );

  const loginHref = useMemo(
    () =>
      `/auth/login?next=${encodeURIComponent(`/payment?plan=${selectedPlan}&intent=checkout`)}`,
    [selectedPlan]
  );

  const fetchPlanSnapshot = useCallback(async () => {
    if (!isLoggedIn || isOwner) return;
    const response = await fetch("/api/billing/plan");
    if (!response.ok) return;
    const payload = (await response.json().catch(() => null)) as BillingPlanResponse | null;
    if (!payload) return;
    if (payload.effectivePlan?.planName) {
      setEffectivePlan(payload.effectivePlan.planName);
    }
    if (payload.plan?.status) {
      setSubscriptionStatus(payload.plan.status);
    }
  }, [isLoggedIn, isOwner]);

  const createPaidTransaction = useCallback(async (planName: "creator" | "business") => {
    if (!canUseCreatorBilling) {
      if (!isLoggedIn) {
        window.location.assign(loginHref);
        return false;
      }

      await showFeedbackAlert({
        title: locale === "en" ? "Billing unavailable" : "Billing tidak tersedia",
        text:
          locale === "en"
            ? "Owner account does not use creator billing."
            : "Akun owner tidak menggunakan billing creator.",
        icon: "error",
      });
      return false;
    }

    if (!paymentReady) {
      await showFeedbackAlert({
        title: locale === "en" ? "Payment unavailable" : "Pembayaran belum aktif",
        text:
          locale === "en"
            ? "Payment configuration is not ready. Please contact admin."
            : "Konfigurasi pembayaran belum lengkap. Hubungi admin.",
        icon: "error",
      });
      return false;
    }

    setLoadingAction(true);
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planName }),
    });
    const payload = (await response.json().catch(() => null)) as CheckoutResponse | null;
    setLoadingAction(false);

    if (!response.ok || payload?.mode !== "paid" || !payload.payment) {
      const message =
        payload?.message ||
        (locale === "en"
          ? "Failed to create transaction. Please try again."
          : "Gagal membuat transaksi. Coba lagi beberapa saat.");
      setErrorMessage(message);
      await showFeedbackAlert({
        title: locale === "en" ? "Transaction failed" : "Transaksi gagal",
        text: message,
        icon: "error",
      });
      return false;
    }

    const paymentUrl = payload.payment_url || payload.payment.redirectUrl;
    if (!paymentUrl) {
      const message =
        locale === "en"
          ? "Payment page is not available. Please create a new transaction."
          : "Halaman pembayaran tidak tersedia. Silakan buat transaksi baru.";
      setErrorMessage(message);
      await showFeedbackAlert({
        title: locale === "en" ? "Payment unavailable" : "Pembayaran tidak tersedia",
        text: message,
        icon: "error",
      });
      return false;
    }

    setErrorMessage("");
    window.location.assign(paymentUrl);
    return true;
  }, [canUseCreatorBilling, isLoggedIn, locale, loginHref, paymentReady]);

  const handleContinueCheckout = async () => {
    if (
      effectivePlan === selectedPlan &&
      (subscriptionStatus === "active" || subscriptionStatus === "trial")
    ) {
      await showFeedbackAlert({
        title: locale === "en" ? "Plan already active" : "Paket sudah aktif",
        text:
          locale === "en"
            ? "You can renew, cancel, or switch to another plan from Billing."
            : "Kamu bisa perpanjang, membatalkan, atau beralih ke paket lain dari Billing.",
        icon: "info",
      });
      return;
    }

    if (selectedPlan === "free") {
      if (!canUseCreatorBilling) {
        if (!isLoggedIn) {
          window.location.assign(loginHref);
          return;
        }
        await showFeedbackAlert({
          title: locale === "en" ? "Billing unavailable" : "Billing tidak tersedia",
          text:
            locale === "en"
              ? "Owner account does not use creator billing."
              : "Akun owner tidak menggunakan billing creator.",
          icon: "error",
        });
        return;
      }

      const confirmed = await confirmFeedbackAction({
        title: locale === "en" ? "Switch to Free plan?" : "Pindah ke plan Free?",
        text:
          locale === "en"
            ? "Creator/Business-only capabilities will be disabled after downgrade."
            : "Fitur Creator/Business akan nonaktif setelah downgrade.",
        confirmButtonText: locale === "en" ? "Yes, switch" : "Ya, lanjutkan",
      });
      if (!confirmed) return;

      setLoadingAction(true);
      const response = await fetch("/api/billing/downgrade", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setLoadingAction(false);

      if (!response.ok) {
        const message =
          payload?.error ||
          (locale === "en" ? "Failed to switch plan." : "Gagal mengubah plan.");
        setErrorMessage(message);
        await showFeedbackAlert({
          title: locale === "en" ? "Downgrade failed" : "Downgrade gagal",
          text: message,
          icon: "error",
        });
        return;
      }

      await fetchPlanSnapshot();
      setResultTone("success");
      setResultTitle(locale === "en" ? "Plan updated" : "Plan berhasil diperbarui");
      setResultDescription(
        locale === "en"
          ? "Your account is now on Free plan."
          : "Akun kamu sekarang berada di plan Free."
      );
      setFlowStep("result");
      return;
    }

    await createPaidTransaction(selectedPlan);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPlanSnapshot();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPlanSnapshot]);

  useEffect(() => {
    if (!autoCheckoutIntent || autoCheckoutRef.current) {
      return;
    }
    if (!isLoggedIn || isOwner) {
      return;
    }
    if (selectedPlan === "free") {
      return;
    }
    if (
      effectivePlan === selectedPlan &&
      (subscriptionStatus === "active" || subscriptionStatus === "trial")
    ) {
      return;
    }

    autoCheckoutRef.current = true;
    const timer = window.setTimeout(() => {
      void createPaidTransaction(selectedPlan);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    autoCheckoutIntent,
    createPaidTransaction,
    effectivePlan,
    isLoggedIn,
    isOwner,
    selectedPlan,
    subscriptionStatus,
  ]);

  return (
    <div className="min-h-screen bg-[#f6f4f2] pb-14 pt-10 sm:pb-20 sm:pt-14">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-[#dfd6d0] bg-white p-4 shadow-[0_24px_48px_-34px_rgba(26,38,63,0.34)] sm:p-7 lg:p-9">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href="/" className="inline-flex">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" />
                {locale === "en" ? "Back to landing" : "Kembali ke landing"}
              </Button>
            </Link>
            <Link href="/dashboard/billing" className="inline-flex">
              <Button variant="secondary" size="sm">
                {locale === "en" ? "Open billing" : "Buka billing"}
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center sm:mt-8">
            <Badge className="rounded-full border border-[#d6deee] bg-[#edf3ff] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#2f73ff]">
              {dictionary.landingPricingBadge}
            </Badge>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-[#1f1a17] sm:text-4xl">
              {dictionary.landingPricingTitleLead}{" "}
              <span className="text-[#2f73ff]">{dictionary.landingPricingTitleAccent}</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#5f534c] sm:text-base">
              {dictionary.landingPricingDescription}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs sm:mt-7">
            {(["selection", "confirmation", "result"] as FlowStep[]).map((step, index) => {
              const active =
                step === flowStep;
              const passed =
                (flowStep === "confirmation" && step === "selection") ||
                (flowStep === "result" &&
                  (step === "selection" || step === "confirmation"));

              return (
                <div key={step} className="inline-flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex min-h-8 items-center rounded-full border px-3 font-semibold",
                      active
                        ? "border-[#2f73ff] bg-[#edf3ff] text-[#2f73ff]"
                        : passed
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-[#ddd3cd] bg-white text-[#7b6c63]"
                    )}
                  >
                    {index + 1}. {getFlowStepLabel(step, featureLocale)}
                  </span>
                </div>
              );
            })}
          </div>

          {!isLoggedIn ? (
            <Card className="mt-6 border-[#cfe0ff] bg-[#f4f8ff] p-4">
              <p className="text-sm text-[#35527f]">
                {locale === "en"
                  ? "Sign in is required before checkout. You can still compare all plans on this page."
                  : "Login diperlukan sebelum checkout. Kamu tetap bisa membandingkan semua plan di halaman ini."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={loginHref}>
                  <Button size="sm">
                    {locale === "en" ? "Sign in to continue" : "Login untuk lanjut"}
                  </Button>
                </Link>
                <Link href={`/auth/signup?next=${encodeURIComponent(`/payment?plan=${selectedPlan}`)}`}>
                  <Button size="sm" variant="secondary">
                    {locale === "en" ? "Create account" : "Buat akun"}
                  </Button>
                </Link>
              </div>
            </Card>
          ) : null}

          {isOwner ? (
            <Card className="mt-6 border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                {locale === "en"
                  ? "Owner account does not use creator billing plans."
                  : "Akun owner tidak menggunakan paket billing creator."}
              </p>
            </Card>
          ) : null}

          {errorMessage ? (
            <Card className="mt-6 border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-700">{errorMessage}</p>
            </Card>
          ) : null}

          <div className="mt-7 grid gap-3.5 lg:grid-cols-3">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isCurrent = effectivePlan === plan.id;
              return (
                <article
                  key={plan.id}
                  className={cn(
                    "relative flex h-full cursor-pointer flex-col rounded-[1.4rem] border p-5 transition sm:p-6",
                    plan.featured
                      ? "border-[#2f73ff] bg-gradient-to-b from-[#2f73ff] to-[#235ed0] text-white"
                      : "border-[#e2d9d3] bg-[#faf7f4] text-[#201b18]",
                    isSelected
                      ? "ring-2 ring-[#7da9ff] ring-offset-2 ring-offset-[#f6f4f2]"
                      : "hover:border-[#bdd3ff]"
                  )}
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    setFlowStep("selection");
                    setErrorMessage("");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedPlan(plan.id);
                      setFlowStep("selection");
                      setErrorMessage("");
                    }
                  }}
                >
                  {plan.featured ? (
                    <span className="absolute right-4 top-4 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2f73ff]">
                      {locale === "en" ? "Most popular" : "Paling populer"}
                    </span>
                  ) : null}
                  {isCurrent ? (
                    <span
                      className={cn(
                        "absolute left-4 top-4 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                        plan.featured
                          ? "bg-white/20 text-white"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      )}
                    >
                      {locale === "en" ? "Current plan" : "Plan aktif"}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <span
                      className={cn(
                        "absolute left-4 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                        isCurrent ? "top-11" : "top-4",
                        plan.featured
                          ? "bg-white text-[#2f73ff]"
                          : "bg-[#eaf2ff] text-[#2f73ff] ring-1 ring-[#cfe0ff]"
                      )}
                    >
                      {locale === "en" ? "Selected plan" : "Plan dipilih"}
                    </span>
                  ) : null}
                  <p
                    className={cn(
                      "mt-8 text-helper font-semibold uppercase tracking-[0.14em]",
                      plan.featured ? "text-[#dfeaff]" : "text-[#6d7890]"
                    )}
                  >
                    {plan.name}
                  </p>
                  <p className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] sm:text-[2.3rem]">
                    {toIdr(plan.price)}
                    <span
                      className={cn(
                        "ml-1 text-[0.84rem] font-medium tracking-[-0.006em]",
                        plan.featured ? "text-white/80" : "text-[#776860]"
                      )}
                    >
                      {locale === "en" ? "/month" : "/bulan"}
                    </span>
                  </p>
                  <p className={cn("mt-2 text-sm", plan.featured ? "text-white/85" : "text-[#5f534c]")}>
                    {plan.description || getDefaultDescription(plan.id, featureLocale)}
                  </p>
                  {plan.id === "business" ? (
                    <div
                      className={cn(
                        "mt-3 rounded-xl border px-3 py-2 text-xs",
                        plan.featured
                          ? "border-white/35 bg-white/10 text-white"
                          : "border-[#d6e4ff] bg-[#eef4ff] text-[#2a3b60]"
                      )}
                    >
                      <p className="font-semibold uppercase tracking-[0.08em]">{businessBonus.title}</p>
                      <p className="mt-1">{businessBonus.primary}</p>
                      <p className={cn("font-semibold", plan.featured ? "text-white" : "text-[#1f3f84]")}>
                        {businessBonus.secondary}
                      </p>
                    </div>
                  ) : null}
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {plan.points.slice(0, 5).map((point) => {
                      const unavailable = point.status === "unavailable";
                      return (
                        <li key={`${plan.id}-${point.id}`} className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1",
                              unavailable
                                ? plan.featured
                                  ? "bg-white/10 text-white/50 ring-white/20"
                                  : "bg-[#f0eae6] text-[#8c7f78] ring-[#e5d7cf]"
                                : plan.featured
                                  ? "bg-white/20 text-white ring-white/30"
                                  : "bg-emerald-50 text-emerald-600 ring-emerald-200"
                            )}
                          >
                            {unavailable ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span
                            className={cn(
                              "leading-snug",
                              unavailable
                                ? plan.featured
                                  ? "text-white/60 line-through"
                                  : "text-[#8e7f77] line-through"
                                : plan.featured
                                  ? "text-white"
                                  : "text-[#201b18]"
                            )}
                          >
                            {point.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-[#dfd6d0] bg-[#faf8f6] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f625a]">
                  {locale === "en" ? "Selected plan" : "Plan terpilih"}
                </p>
                <p className="mt-1 text-lg font-semibold text-[#201b18]">{selectedPlanInfo.name}</p>
                <p className="text-sm text-[#665951]">
                  {toIdr(selectedPlanInfo.price)}
                  {locale === "en" ? " / month" : " / bulan"}
                </p>
                <p className="mt-1 text-sm text-[#63564f]">
                  {locale === "en" ? "Subscription status" : "Status subscription"}:{" "}
                  <span className="font-semibold capitalize text-[#2b241f]">{subscriptionStatus}</span>
                </p>
                {selectedPlan === "business" ? (
                  <p className="mt-1 text-sm font-medium text-[#1f3f84]">
                    {businessBonus.primary} - {businessBonus.secondary}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFlowStep("selection");
                    setErrorMessage("");
                  }}
                >
                  {locale === "en" ? "Edit selection" : "Ubah pilihan"}
                </Button>
                <Button
                  onClick={() => setFlowStep("confirmation")}
                  disabled={
                    loadingAction ||
                    (effectivePlan === selectedPlan &&
                      (subscriptionStatus === "active" || subscriptionStatus === "trial"))
                  }
                >
                  {effectivePlan === selectedPlan &&
                  (subscriptionStatus === "active" || subscriptionStatus === "trial")
                    ? locale === "en"
                      ? "Current plan"
                      : "Plan aktif"
                    : locale === "en"
                      ? "Continue"
                      : "Lanjutkan"}
                </Button>
              </div>
            </div>
          </div>

          {flowStep === "confirmation" ? (
            <Card className="mt-6 border-[#d9cec7] bg-white p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f625a]">
                {locale === "en" ? "Payment confirmation" : "Konfirmasi pembayaran"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#201b18]">
                {locale === "en"
                  ? `Proceed with ${selectedPlanInfo.name} plan?`
                  : `Lanjutkan dengan plan ${selectedPlanInfo.name}?`}
              </h2>
              <p className="mt-2 text-sm text-[#63564f]">
                {locale === "en"
                  ? "Please review account and plan details before continuing payment."
                  : "Pastikan informasi akun dan paket sudah benar sebelum lanjut pembayaran."}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#dbe4f6] bg-[#f8fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6078a2]">
                    {locale === "en" ? "Account" : "Informasi akun"}
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-[#2b3444]">
                    <p>
                      <span className="font-semibold">{locale === "en" ? "Name" : "Nama"}:</span>{" "}
                      {account.name?.trim() || (locale === "en" ? "Creator account" : "Akun creator")}
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      {account.email?.trim() || "-"}
                    </p>
                    <p>
                      <span className="font-semibold">{locale === "en" ? "Link" : "Link"}:</span>{" "}
                      {account.username
                        ? `showreels-id.vercel.app/creator/${account.username}`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#dbe4f6] bg-[#f8fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6078a2]">
                    {locale === "en" ? "Plan details" : "Informasi paket"}
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-[#2b3444]">
                    <p>
                      <span className="font-semibold">{locale === "en" ? "Plan" : "Paket"}:</span>{" "}
                      {selectedPlanInfo.name}
                    </p>
                    <p>
                      <span className="font-semibold">{locale === "en" ? "Price" : "Harga"}:</span>{" "}
                      {toIdr(selectedPlanInfo.price)}
                      {locale === "en" ? " / month" : " / bulan"}
                    </p>
                    <p>
                      <span className="font-semibold">{locale === "en" ? "Period" : "Periode"}:</span>{" "}
                      {locale === "en" ? "Monthly subscription" : "Langganan bulanan"}
                    </p>
                  </div>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {selectedPlanInfo.points.map((point) => {
                  const unavailable = point.status === "unavailable";
                  const comingSoon = point.status === "coming_soon";
                  return (
                    <li key={`confirm-${point.id}`} className="rounded-xl border border-[#e4dad4] bg-[#fbf9f7] px-3 py-2 text-sm">
                      <span className={cn(unavailable ? "text-[#8f8179] line-through" : "text-[#322a25]")}>
                        {point.label}
                      </span>
                      {comingSoon ? (
                        <span className="ml-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                          {comingSoonLabel}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              {selectedPlan === "business" ? (
                <div className="mt-4 rounded-xl border border-[#d3e2ff] bg-[#eef4ff] p-3 text-sm text-[#1f3f84]">
                  <p className="font-semibold">{businessBonus.title}</p>
                  <p>{businessBonus.primary}</p>
                  <p className="font-semibold">{businessBonus.secondary}</p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => setFlowStep("selection")}>
                  {locale === "en" ? "Back" : "Kembali"}
                </Button>
                <Button onClick={() => void handleContinueCheckout()} disabled={loadingAction}>
                  {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {selectedPlan === "free"
                    ? locale === "en"
                      ? "Confirm Free plan"
                      : "Konfirmasi plan Free"
                    : locale === "en"
                      ? "Continue payment"
                      : "Lanjutkan pembayaran"}
                </Button>
              </div>
            </Card>
          ) : null}

          {flowStep === "result" ? (
            <Card className="mt-6 border-[#d9cec7] bg-white p-4 sm:p-5">
              <div
                className={cn(
                  "rounded-2xl border p-4",
                  resultTone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                )}
              >
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  {resultTone === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  {resultTitle || (locale === "en" ? "Subscription updated" : "Subscription diperbarui")}
                </p>
                <p className="mt-1 text-sm">
                  {resultDescription ||
                    (locale === "en"
                      ? "Your plan status has been updated."
                      : "Status plan akun kamu telah diperbarui.")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/dashboard/billing">
                    <Button size="sm">
                      <ShieldCheck className="h-4 w-4" />
                      {locale === "en" ? "Open billing dashboard" : "Buka dashboard billing"}
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setFlowStep("selection");
                      setErrorMessage("");
                      void fetchPlanSnapshot();
                    }}
                  >
                    {locale === "en" ? "Pick another plan" : "Pilih plan lain"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

        </section>
      </div>
    </div>
  );
}
