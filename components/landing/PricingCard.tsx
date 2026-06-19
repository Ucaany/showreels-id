import type { PricingPlan, PlanFeatureStatus } from "@/lib/constants/landing";

interface PricingCardProps {
  plan: PricingPlan;
}

function getFeatureText(feature: { text: string; status: PlanFeatureStatus } | string): string {
  return typeof feature === "string" ? feature : feature.text;
}

function isFeatureIncluded(feature: { text: string; status: PlanFeatureStatus } | string): boolean {
  if (typeof feature === "string") return true;
  return feature.status === "included" || feature.status === "limited" || feature.status === "coming_soon";
}

export default function PricingCard({ plan }: PricingCardProps) {
  return (
    <div
      className={`rounded-lg border p-8 shadow-card transition-all hover:-translate-y-1 ${
        plan.featured
          ? "border-[#D8F26A] bg-gradient-to-b from-[#F6FBDC] to-white"
          : "border-border bg-white"
      }`}
    >
      {plan.badge && (
        <div className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-text-primary">
          {plan.badge}
        </div>
      )}
      <h3 className="text-2xl font-bold">{plan.name}</h3>
      {plan.tagline && (
        <p className="mt-2 text-sm text-text-secondary">{plan.tagline}</p>
      )}
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold">
          {plan.priceLabel ?? (plan.price === 0 ? "Rp0" : `Rp${plan.price.toLocaleString("id-ID")}`)}
        </span>
        <span className="text-sm text-text-muted">{plan.period}</span>
      </div>
      <ul className="mt-6 space-y-3">
        {plan.features.map((feature, idx) => {
          const included = isFeatureIncluded(feature);
          return (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <svg
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                  included ? "text-success" : "text-text-muted opacity-40"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={included ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
                />
              </svg>
              <span className={included ? "" : "text-text-muted line-through opacity-50"}>
                {getFeatureText(feature)}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        className={`mt-8 w-full rounded-full py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
          plan.featured
            ? "bg-[#050505] text-white shadow-button hover:bg-[#1A1A1A]"
            : "border border-border bg-white text-text-primary hover:border-text-muted"
        }`}
      >
        {plan.cta}
      </button>
    </div>
  );
}
