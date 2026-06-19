import Link from "next/link";

export default function CTABanner() {
  return (
    <section id="cta" className="mt-14">
      <div className="container mx-auto max-w-[1080px] px-6">
        <div className="flex flex-col items-center justify-between gap-6 rounded-lg bg-gradient-to-r from-accent-soft to-[#DFF76A] p-8 md:flex-row md:p-10">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold leading-tight text-text-primary">
              Siap tampil profesional dengan satu link?
            </h2>
            <p className="mt-2 text-base text-text-secondary">
              Buat portofolio keren kamu sekarang juga!
            </p>
          </div>
          <Link
            href="#cta"
            className="inline-flex h-12 flex-shrink-0 items-center gap-2 rounded-full bg-[#050505] px-6 text-sm font-semibold text-white shadow-button transition-all hover:bg-[#1A1A1A] hover:-translate-y-0.5"
          >
            Mulai Gratis
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
