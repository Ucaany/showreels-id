interface PricingCardProps {
  plan: {
    name: string;
    badge?: string;
    description: string;
    price: number;
    period: string;
    features: string[];
    cta: string;
    featured: boolean;
  };
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
      <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold">
          {plan.price === 0 ? "Rp0" : `Rp${plan.price.toLocaleString("id-ID")}`}
        </span>
        <span className="text-sm text-text-muted">{plan.period}</span>
      </div>
      <ul className="mt-6 space-y-3">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {feature}
          </li>
        ))}
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
