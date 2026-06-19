interface TestimonialCardProps {
  testimonial: {
    quote: string;
    name: string;
    role: string;
    avatar: string;
    photo?: string;
  };
}

export default function TestimonialCard({
  testimonial,
}: TestimonialCardProps) {
  return (
    <div className="flex h-full w-full shrink-0 flex-col justify-between rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-card">
      <div>
        <div className="mb-3 flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              fill="#1E3A8A"
              aria-hidden
              className="h-3.5 w-3.5"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <p className="text-[14px] font-semibold leading-[1.55] text-ink">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-[#DBEAFE] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
          {testimonial.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={testimonial.photo}
              alt={testimonial.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-[#1E3A8A]">
              {testimonial.avatar}
            </span>
          )}
        </div>
        <div>
          <p className="text-[12.5px] font-semibold text-ink">
            {testimonial.name}
          </p>
          <p className="text-[11px] font-normal text-ink/55">
            {testimonial.role}
          </p>
        </div>
      </div>
    </div>
  );
}