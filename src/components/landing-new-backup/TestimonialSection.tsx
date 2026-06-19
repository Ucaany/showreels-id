"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

type Role = "Videographer" | "Content Creator" | "Editor";
type Testimonial = {
  quote: string;
  name: string;
  role: Role;
  rating: number;
};

const FIRST = ["Rina", "Bima", "Sasha", "Dimas", "Aulia", "Bagas", "Andhika", "Kayla"];
const LAST = [
  "Adelia",
  "Pratama",
  "Anindya",
  "Saputra",
  "Lestari",
  "Wijaya",
  "Nugroho",
  "Pertiwi",
];

const QUOTES = [
  "Portfolio jadi jauh lebih rapi. Klien langsung klik dari Instagram.",
  "Clean, simpel, dan tampil profesional tanpa ribet setup.",
  "Semua video dari berbagai platform dalam satu link. Game changer.",
  "Cukup share satu link di bio Instagram, viewer langsung explore.",
  "Sekarang klien lihat semua showreel tanpa harus kirim satu-satu.",
  "Tampil profesional hanya dalam beberapa menit. Suka banget.",
];

const ROLES: Role[] = ["Videographer", "Content Creator", "Editor"];
const RATINGS = [5, 5, 4, 5, 5, 4];

function buildTestimonials(): Testimonial[] {
  return Array.from({ length: 6 }, (_, i) => {
    const first = FIRST[i];
    const last = LAST[i];
    return {
      name: `${first} ${last}`,
      role: ROLES[i % ROLES.length],
      quote: QUOTES[i],
      rating: RATINGS[i] ?? 5,
    };
  });
}



export default function TestimonialSection() {
  const testimonials = useMemo(() => buildTestimonials(), []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setItemsPerView(window.innerWidth >= 1024 ? 3 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const total = testimonials.length;
  const maxIndex = Math.max(0, total - itemsPerView);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 4200);
    return () => clearInterval(id);
  }, [paused, maxIndex]);

  const goTo = (i: number) => {
    if (i < 0) setIndex(maxIndex);
    else if (i > maxIndex) setIndex(0);
    else setIndex(i);
  };

  return (
    <section id="testimoni" className="relative py-14 md:py-16">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-3 text-ink/35">
            <span className="h-px w-10 bg-current" />
            <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              TESTIMONI
            </span>
            <span className="h-px w-10 bg-current" />
          </div>
          <h2 className="text-section-display font-semibold text-ink">
            Dipakai kreator yang{" "}
            <span className="font-accent text-accent">serius</span> berkarya.
          </h2>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex gap-4 transition-transform duration-[700ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                transform:
                  itemsPerView === 1
                    ? `translateX(-${index * 100}%)`
                    : `translateX(calc(-${index} * (calc((100% - 32px) / ${itemsPerView}) + 16px)))`,
              }}
            >
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="shrink-0"
                  style={{
                    width:
                      itemsPerView === 1
                        ? "100%"
                        : `calc((100% - ${(itemsPerView - 1) * 16}px) / ${itemsPerView})`,
                  }}
                >
                  <Card testimonial={t} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => goTo(index - 1)}
              aria-label="Sebelumnya"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-ink/70 transition-all hover:border-ink hover:bg-ink hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-6 bg-ink"
                      : "w-1.5 bg-ink/15 hover:bg-ink/30"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => goTo(index + 1)}
              aria-label="Berikutnya"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-ink/70 transition-all hover:border-ink hover:bg-ink hover:text-white"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex h-full w-full shrink-0 flex-col justify-between rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_1px_4px_0_rgba(0,0,0,0.06)] transition-colors duration-300 hover:border-brand-200">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                strokeWidth={1.5}
                className={`h-3.5 w-3.5 ${i <= testimonial.rating ? "fill-[#FACC15] text-[#FACC15]" : "fill-[#E5E7EB] text-[#E5E7EB]"}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-ink/55">
            {testimonial.rating}/5
          </span>
        </div>
        <p className="text-[14px] font-semibold leading-[1.55] text-ink">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </div>
      <div className="mt-5 border-t border-[color:var(--border-soft)] pt-4">
        <p className="truncate text-[12.5px] font-semibold text-ink">
          {testimonial.name}
        </p>
        <p className="truncate text-[11px] font-normal text-ink/55">
          {testimonial.role}
        </p>
      </div>
    </div>
  );
}
