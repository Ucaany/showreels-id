import { testimonials } from "@/lib/constants/landing";
import TestimonialCard from "./TestimonialCard";

export default function TestimonialSection() {
  return (
    <section id="testimoni" className="py-22 md:py-28">
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <h2 className="text-3xl md:text-4xl lg:text-[40px] font-bold leading-tight">
            Dipercaya ribuan kreator
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            Dengar langsung dari para profesional yang sudah menggunakan
            showreels.id.
          </p>
        </div>

        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, idx) => (
            <TestimonialCard key={idx} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
