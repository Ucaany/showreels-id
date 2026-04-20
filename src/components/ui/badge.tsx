import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm",
        className
      )}
      {...props}
    />
  );
}
