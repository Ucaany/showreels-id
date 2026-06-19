interface TestimonialCardProps {
  testimonial: {
    quote: string;
    name: string;
    role: string;
    avatar: string;
  };
}

export default function TestimonialCard({
  testimonial,
}: TestimonialCardProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-7 shadow-card transition-all hover:-translate-y-1">
      <div className="mb-4 text-lg tracking-wider text-star">
        ★★★★★
      </div>
      <p className="mb-6 text-sm leading-relaxed text-text-primary">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-base font-bold text-text-primary">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-bold">{testimonial.name}</p>
          <p className="text-xs text-text-muted">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}
