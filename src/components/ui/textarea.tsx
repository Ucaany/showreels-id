import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-[#d7cec7] bg-white/95 px-4 py-3 text-sm text-[#201b18] outline-none ring-[#f1b8ad] placeholder:text-[#94867e] focus:border-[#ef5f49] focus:ring-2",
        className
      )}
      {...props}
    />
  );
}

