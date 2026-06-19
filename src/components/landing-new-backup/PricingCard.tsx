import {
  Zap,
  Rocket,
  Crown,
  Check,
  X,
  Clock,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { PlanFeatureStatus, PricingPlan } from "@/lib/constants/landing";

interface PricingCardProps {
  plan: PricingPlan;
  cycle: "monthly" | "quarterly";
}

function formatRupiah(value: number) {
  if (value === 0) return "Rp0";
  return `Rp${value.toLocaleString("id-ID")}`;
}

const PLAN_ICON: Record<string, LucideIcon> = {
  Basic: Zap,
  Creator: Rocket,
  Business: Crown,
};

function PlanIcon({
  name,
  featured,
}: {
  name: string;
  featured: boolean;
}) {
  const Icon = PLAN_ICON[name] ?? Zap;
  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
        featured
          ? "bg-brand-600 text-white"
          : "bg-black/5 text-black"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}

function FeatureIcon({
  status,
  featured,
}: {
  status: PlanFeatureStatus;
  featured: boolean;
}) {
  if (status === "not_included") {
    return (
      <span
        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
          featured ? "bg-black/8" : "bg-black/[0.06]"
        }`}
      >
        <X
          className={`h-2.5 w-2.5 ${featured ? "text-black/40" : "text-black/35"}`}
          strokeWidth={3}
        />
      </span>
    );
  }

  if (status === "coming_soon") {
    return (
      <span
        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
          featured ? "bg-amber-100" : "bg-amber-100"
        }`}
      >
        <Clock
          className={`h-2.5 w-2.5 ${featured ? "text-amber-700" : "text-amber-700"}`}
          strokeWidth={2.6}
        />
      </span>
    );
  }

  return (
    <span
      className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
        featured ? "bg-brand-600" : "bg-black"
      }`}
    >
      <Check
        className={`h-2.5 w-2.5 ${featured ? "text-white" : "text-white"}`}
        strokeWidth={3.5}
      />
    </span>
  );
}

function FeatureRow({
  text,
  status,
  featured,
}: {
  text: string;
  status: PlanFeatureStatus;
  featured: boolean;
}) {
  const isMuted = status === "not_included";
  const isComing = status === "coming_soon";

  return (
    <li className="flex items-start gap-2.5 text-[12.5px] leading-snug">
      <FeatureIcon status={status} featured={featured} />
      <span
        className={
          isMuted
            ? "text-black/40 line-through decoration-black/20"
            : isComing
              ? "text-black"
              : "text-black"
        }
      >
        {text}
        {isComing && (
          <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-700">
            Soon
          </span>
        )}
      </span>
    </li>
  );
}

export default function PricingCard({
  plan,
  cycle,
}: PricingCardProps) {
  const featured = plan.featured;
  const isFree = plan.price === 0;

  const QUARTERLY_DISCOUNT = 0.2;
  const displayPrice =
    cycle === "quarterly" && !isFree
      ? Math.round(plan.price * 3 * (1 - QUARTERLY_DISCOUNT))
      : plan.price;
  const periodLabel =
    cycle === "quarterly" && !isFree ? "/3 bulan" : plan.period;

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl p-6 transition-all duration-500 md:p-7 ${
        featured
          ? "border-2 border-brand-600/40 bg-transparent text-black shadow-[0_24px_60px_-25px_rgba(29,78,216,0.35)] md:hover:-translate-y-1 md:hover:border-brand-600/60"
          : "border border-black/10 bg-transparent text-black shadow-[0_18px_40px_-25px_rgba(10,13,20,0.18)] backdrop-blur-[6px] md:hover:-translate-y-1 md:hover:border-black/20"
      }`}
    >
      <div className="mb-5 flex items-start justify-between">
        <PlanIcon name={plan.name} featured={featured} />

        <div className="flex items-center gap-2">
          {plan.badge && (
            <span
              className={`inline-flex h-6 items-center gap-1 rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                featured
                  ? "bg-brand-600 text-white"
                  : "bg-black/8 text-black/70"
              }`}
            >
              {plan.badge}
            </span>
          )}
        </div>
      </div>

      <h3 className="text-[20px] font-semibold leading-tight tracking-tight text-black">
        {plan.name}
      </h3>
      <p className="mt-1.5 min-h-[36px] text-[12.5px] font-normal leading-snug text-black/65">
        {plan.tagline}
      </p>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-[36px] font-semibold leading-none tracking-tight text-black">
          {isFree ? "Rp0" : formatRupiah(displayPrice)}
        </span>
        <span className="text-[12px] font-medium text-black/55">
          {periodLabel}
        </span>
      </div>

      <div className="mt-5">
        <Link
          href="#cta"
          className="group inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-white/40 bg-transparent text-[13.5px] font-semibold text-white transition-all duration-200 hover:bg-white/10"
        >
          <span>{plan.cta}</span>
          <svg
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>

      <div
        className={`mt-6 border-t pt-5 ${
          featured ? "border-brand-600/20" : "border-black/10"
        }`}
      >
        <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">
          Features
        </p>
        <ul className="space-y-2.5">
          {plan.features.map((f) => (
            <FeatureRow
              key={f.text}
              text={f.text}
              status={f.status}
              featured={featured}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
