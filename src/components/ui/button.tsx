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
    "bg-[#2f73ff] text-white shadow-soft hover:bg-[#225fe0] focus-visible:ring-[#8eb3ff]",
  secondary:
    "bg-white text-[#1b2e4f] ring-1 ring-[#ccdbf5] shadow-sm hover:bg-[#edf4ff] focus-visible:ring-[#c4d9ff]",
  ghost:
    "bg-transparent text-[#1f365c] hover:bg-[#e9f1ff] focus-visible:ring-[#c4d9ff]",
  danger:
    "bg-rose-600 text-white shadow-soft hover:bg-rose-700 focus-visible:ring-rose-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-11 min-w-11 px-3.5 text-[0.86rem]",
  md: "h-11 min-w-11 px-4 text-[0.91rem]",
  lg: "h-12 min-w-12 px-5 text-[0.95rem] sm:h-[3.25rem] sm:px-6",
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
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold leading-[1.2] tracking-[-0.008em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
