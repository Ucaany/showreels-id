import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[1rem] border border-[#cad9f4] bg-white/95 px-3.5 text-[0.95rem] leading-[1.2] tracking-[-0.008em] text-[#12233f] outline-none ring-[#b9d3ff] placeholder:text-[#7e90af] focus:border-[#2f73ff] focus:ring-2 disabled:cursor-not-allowed disabled:border-[#d7e2f5] disabled:bg-[#f2f6fd] disabled:text-[#8392ad] sm:h-12 sm:rounded-[1.15rem] sm:px-4",
        className
      )}
      {...props}
    />
  );
}

