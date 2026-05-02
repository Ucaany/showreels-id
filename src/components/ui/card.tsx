import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "glass" | "glass-strong" | "glass-dark" | "glass-dark-strong";

const variantClasses: Record<CardVariant, string> = {
  default: "rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm shadow-slate-900/5",
  glass: "glass-panel p-5",
  "glass-strong": "glass-panel-strong p-5",
  "glass-dark": "glass-panel-dark p-5",
  "glass-dark-strong": "glass-panel-dark-strong p-5",
};

export function Card({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return (
    <div
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  );
}
