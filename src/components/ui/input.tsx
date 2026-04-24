import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[1rem] border border-[#d7cec7] bg-white/95 px-3.5 text-[0.95rem] leading-[1.2] tracking-[-0.008em] text-[#201b18] outline-none ring-[#f1b8ad] placeholder:text-[#94867e] focus:border-[#ef5f49] focus:ring-2 sm:h-12 sm:rounded-[1.15rem] sm:px-4",
        className
      )}
      {...props}
    />
  );
}

