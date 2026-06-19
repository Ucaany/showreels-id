import { Lock, RotateCcw } from "lucide-react";

export default function TrustSection() {
  return (
    <section className="relative -mt-2 pb-10 pt-2 md:-mt-4 md:pb-14 md:pt-3">
      <div className="container mx-auto flex max-w-[1180px] items-center justify-center px-6">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 font-sans text-[11px] font-medium text-ink/55 md:text-[12px]">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-emerald-600" strokeWidth={2.4} />
            Pembayaran terenkripsi &amp; aman
          </span>
          <span className="text-ink/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <RotateCcw
              className="h-3 w-3 text-ink/55"
              strokeWidth={2.4}
            />
            Batalkan kapan saja
          </span>
        </p>
      </div>
    </section>
  );
}
