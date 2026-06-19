import { faqs } from "@/lib/constants/landing";

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-24">
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <h2 className="text-3xl md:text-4xl lg:text-[40px] font-bold leading-tight">
            Pertanyaan yang sering ditanyakan
          </h2>
        </div>

        <div className="mx-auto grid max-w-[880px] gap-4 md:grid-cols-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="flex min-h-[56px] items-center justify-between rounded-full border border-border bg-white px-5 transition-all hover:border-text-muted hover:shadow-soft"
            >
              <span className="text-sm font-medium text-text-primary">
                {faq}
              </span>
              <svg
                className="h-5 w-5 flex-shrink-0 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
