import { platforms } from "@/lib/constants/landing";
import { PlatformIcon } from "./PlatformIcons";

export default function PlatformRow() {
  return (
    <section className="relative py-5">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />
      <div className="container mx-auto max-w-[1080px] px-6">
        <p className="mb-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">
          Tautkan semua platform favoritmu
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {platforms.map((p) => (
            <div
              key={p}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink/70 transition-colors hover:text-ink"
            >
              <PlatformIcon name={p} className="h-3.5 w-3.5" />
              <span className="capitalize">{p}</span>
            </div>
          ))}
          <span className="text-[12px] font-medium text-ink/45">
            dan lainnya
          </span>
        </div>
      </div>
    </section>
  );
}