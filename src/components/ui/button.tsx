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
    "bg-[#1a1412] text-white shadow-soft hover:bg-[#2a211d] focus-visible:ring-[#5f4d44]",
  secondary:
    "bg-white text-[#201b18] ring-1 ring-[#d7cec7] shadow-sm hover:bg-[#faf7f4] focus-visible:ring-[#d7cec7]",
  ghost:
    "bg-transparent text-[#201b18] hover:bg-[#efeae6] focus-visible:ring-[#d7cec7]",
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
