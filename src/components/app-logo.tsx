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
  const [src, setSrc] = useState("/favicon-96x96.png");

  return (
    <Link
      href="/"
      aria-label="showreels.id home"
      className={cn("inline-flex max-w-full min-w-0 items-center gap-2.5", className)}
    >
      <span className="relative flex h-[2.15rem] w-[2.15rem] shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-9 sm:w-9">
        <Image
          src={src}
          alt="showreels.id"
          width={36}
          height={36}
          decoding="async"
          unoptimized
          className="h-full w-full object-contain"
          onError={() => setSrc("/logo.png")}
        />
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
