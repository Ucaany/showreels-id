"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";

type Role = "Videographer" | "Content Creator" | "Editor";
type Creator = {
  id: string;
  name: string;
  handle: string;
  role: Role;
  // avatar seed for DiceBear
  seed: string;
};

const FIRST = [
  "Rina", "Bima", "Putri", "Aulia", "Dimas", "Sasha", "Bagas", "Andhika",
  "Kayla", "Reza", "Nadia", "Iqbal", "Mahesa", "Tiara", "Galih", "Sinta",
  "Yusuf", "Kirana", "Naufal", "Salwa",
];
const LAST = [
  "Adelia", "Pratama", "Anindya", "Saputra", "Lestari", "Wijaya",
  "Nugroho", "Putri", "Hidayat", "Maulana", "Ramadhan", "Pertiwi",
];

const ROLES: Role[] = ["Videographer", "Content Creator", "Editor"];

function buildCreators(count = 8): Creator[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[(i * 7 + 3) % FIRST.length];
    const last = LAST[(i * 11 + 5) % LAST.length];
    const role = ROLES[i % ROLES.length];
    const handle = `@${first.toLowerCase()}.${last.toLowerCase().slice(0, 4)}`;
    return {
      id: `c-${i}`,
      name: `${first} ${last}`,
      handle,
      role,
      seed: `${first}-${last}-${i}`,
    };
  });
}

function MemojiAvatar({ seed, size = 44 }: { seed: string; size?: number }) {
  const url = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}&radius=50&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
    />
  );
}

export default function PhoneSlider() {
  const creators = useMemo(() => buildCreators(8), []);

  // Show 4 cards once on page load — no auto rotation.
  const visible = [0, 1, 2, 3].map((slot) => {
    const c = creators[(slot * 2) % creators.length];
    return { slot, creator: c };
  });

  return (
    <div className="mt-10">
      <div className="relative mx-auto max-w-[1080px]">
        <div
          className="scrollbar-hide -mx-6 flex items-center justify-center gap-3 overflow-x-auto px-6 py-4 md:gap-4"
          onMouseLeave={() => undefined}
        >
          {visible.map(({ slot, creator }, i) => {
            const offset = slot % 2 === 0 ? -10 : 10;
            return (
              <div
                key={`${creator.id}-${slot}`}
                className="group relative flex shrink-0 items-center gap-3 rounded-full border border-[color:var(--border)] bg-white px-3 py-2 text-left animate-fade-swap"
                style={{
                  animationDelay: `${slot * 250}ms`,
                  transform: `translateY(${offset}px)`,
                }}
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-brand-50 to-white shadow-[0_2px_8px_rgba(10,13,20,0.06)]">
                  <MemojiAvatar seed={creator.seed} size={40} />
                  <span className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-brand-500">
                    <Check className="h-2 w-2 text-white" strokeWidth={3.5} />
                  </span>
                </div>
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-semibold text-ink">
                      {creator.handle}
                    </span>
                  </div>
                  <span className="truncate text-[10.5px] font-normal text-ink/55">
                    {creator.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10.5px] font-medium text-ink/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-500 animate-live-dot" />
            Kreator aktif sekarang
          </span>
        </div>
      </div>
    </div>
  );
}