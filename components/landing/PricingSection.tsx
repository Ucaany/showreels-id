import { pricingPlans } from "@/lib/constants/landing";
import PricingCard from "./PricingCard";

export default function PricingSection() {
  return (
    <section id="harga" className="py-24 md:py-32">
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <h2 className="text-3xl md:text-4xl lg:text-[40px] font-bold leading-tight">
            Pilih paket yang sesuai dengan kebutuhanmu
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            Mulai gratis, upgrade kapan saja.
          </p>
        </div>

        <div className="mx-auto grid max-w-[980px] gap-7 md:grid-cols-3">
          {pricingPlans.map((plan, idx) => (
            <PricingCard key={idx} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
