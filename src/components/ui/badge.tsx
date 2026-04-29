import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "positive" | "dark";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-slate-200 bg-slate-100 text-slate-600",
  positive: "border-emerald-100 bg-emerald-50 text-emerald-600",
  dark: "border-zinc-900 bg-zinc-900 text-white",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
