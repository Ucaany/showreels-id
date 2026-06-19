"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

export function AppLogo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const darkTone = tone === "dark";
  const [logoVisible, setLogoVisible] = useState(true);

  return (
    <Link
      href="/"
      aria-label="showreels.id home"
      className={cn("inline-flex max-w-full min-w-0 items-center gap-2.5", className)}
    >
      <span className="relative flex h-[2.15rem] w-[2.15rem] shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-9 sm:w-9">
        {logoVisible ? (
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            decoding="async"
            unoptimized
            className="h-full w-full object-contain"
            onError={() => setLogoVisible(false)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-lg bg-[#ea580c] text-base font-bold text-white">
            s
          </span>
        )}
      </span>
      <span
        className={cn(
          "min-w-0 max-w-[9.25rem] truncate text-[1rem] font-semibold sm:max-w-none sm:text-[1.04rem]",
          darkTone ? "text-slate-950" : "text-white"
        )}
      >
        showreels.id
      </span>
    </Link>
  );
}
