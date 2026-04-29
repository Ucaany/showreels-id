import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white shadow-sm shadow-slate-900/10 hover:bg-zinc-800 focus-visible:ring-zinc-300",
  secondary:
    "border border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-900/5 hover:bg-slate-50 focus-visible:ring-slate-300",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-300",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 min-w-10 px-3.5 text-sm",
  md: "h-11 min-w-11 px-4 text-sm",
  lg: "h-12 min-w-12 px-5 text-sm sm:px-6",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium leading-[1.2] tracking-[-0.008em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
