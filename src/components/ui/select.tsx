import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-[#d7cec7] bg-white/95 px-4 text-sm text-[#201b18] outline-none ring-[#f1b8ad] focus:border-[#ef5f49] focus:ring-2",
        className
      )}
      {...props}
    />
  );
}
