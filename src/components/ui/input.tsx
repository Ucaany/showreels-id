import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[1rem] border border-slate-200 bg-white px-3.5 text-[0.95rem] leading-[1.2] tracking-[-0.008em] text-slate-950 outline-none ring-zinc-200 placeholder:text-slate-400 focus:border-zinc-900 focus:ring-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:h-12 sm:rounded-[1.15rem] sm:px-4",
        className
      )}
      {...props}
    />
  );
}

