"use client";

import { useLang } from "@/lib/i18n/landing-context";
import { testimonialSectionEN } from "@/lib/constants/landing-en";
import { InfiniteSlider } from "@/components/infinite-slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Role = "Videographer" | "Content Creator" | "Editor";
type Testimonial = {
  quote: string;
  name: string;
  role: Role;
  image: string;
};

const testimonials: Testimonial[] = [
  {
    quote: "Portfolio jadi jauh lebih rapi. Klien langsung klik dari Instagram.",
    name: "Rina Adelia",
    role: "Videographer",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=rina",
  },
  {
    quote: "Clean, simpel, dan tampil profesional tanpa ribet setup.",
    name: "Bima Pratama",
    role: "Content Creator",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=bima",
  },
  {
    quote: "Semua video dari berbagai platform dalam satu link. Game changer.",
    name: "Sasha Anindya",
    role: "Editor",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sasha",
  },
  {
    quote: "Cukup share satu link di bio Instagram, viewer langsung explore.",
    name: "Dimas Saputra",
    role: "Videographer",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=dimas",
  },
  {
    quote: "Sekarang klien lihat semua showreel tanpa harus kirim satu-satu.",
    name: "Aulia Lestari",
    role: "Content Creator",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=aulia",
  },
  {
    quote: "Tampil profesional hanya dalam beberapa menit. Suka banget.",
    name: "Bagas Wijaya",
    role: "Editor",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=bagas",
  },
  {
    quote: "Lebih mudah showcase portfolio ke klien internasional.",
    name: "Andhika Nugroho",
    role: "Videographer",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=andhika",
  },
  {
    quote: "Engagement di Instagram naik setelah pakai link showreels.id.",
    name: "Kayla Pertiwi",
    role: "Content Creator",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=kayla",
  },
  {
    quote: "Interface-nya intuitif banget. Langsung paham cara pakainya.",
    name: "Rizki Santoso",
    role: "Editor",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=rizki",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export default function TestimonialSection() {
  const { lang } = useLang();
  const isEN = lang === "EN";

  return (
    <section id="testimoni" className="relative py-14 md:py-16">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-3 text-ink/35">
            <span className="h-px w-10 bg-current" />
            <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              {isEN ? testimonialSectionEN.eyebrow : "TESTIMONI"}
            </span>
            <span className="h-px w-10 bg-current" />
          </div>
          <h2 className="text-section-display font-semibold text-ink">
            {isEN ? (
              <>
                {testimonialSectionEN.headline}{" "}
                <span className="font-accent text-accent">{testimonialSectionEN.headlineAccent}</span>{" "}
                {testimonialSectionEN.headlineSuffix}
              </>
            ) : (
              <>
                Dipakai kreator yang{" "}
                <span className="font-accent text-accent">serius</span> berkarya.
              </>
            )}
          </h2>
        </div>

        <div
          className={cn(
            "mt-10 flex max-h-[640px] justify-center gap-6 overflow-hidden",
            "mask-[linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
          )}
        >
          <InfiniteSlider direction="vertical" speed={30} speedOnHover={15}>
            {firstColumn.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </InfiniteSlider>
          <InfiniteSlider
            className="hidden md:block"
            direction="vertical"
            speed={50}
            speedOnHover={25}
          >
            {secondColumn.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </InfiniteSlider>
          <InfiniteSlider
            className="hidden lg:block"
            direction="vertical"
            speed={35}
            speedOnHover={17}
          >
            {thirdColumn.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </InfiniteSlider>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { quote, image, name, role } = testimonial;
  return (
    <figure
      className={cn(
        "w-full max-w-xs rounded-3xl border border-[color:var(--border)] bg-white p-8",
        "shadow-lg shadow-ink/[0.08] transition-all duration-300",
        "hover:border-brand-200 hover:shadow-xl hover:shadow-ink/[0.12]"
      )}
    >
      <blockquote className="text-[14px] font-medium leading-[1.6] text-ink">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <Avatar className="size-10 rounded-full">
          <AvatarImage alt={`${name}'s profile picture`} src={image} />
          <AvatarFallback className="bg-brand-100 text-brand-700 text-sm font-semibold">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <cite className="text-[13px] font-semibold not-italic leading-tight tracking-tight text-ink">
            {name}
          </cite>
          <span className="text-[12px] leading-tight tracking-tight text-ink/55">
            {role}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
