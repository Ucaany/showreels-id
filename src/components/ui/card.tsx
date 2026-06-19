import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm shadow-slate-900/5",
        className
      )}
      {...props}
    />
  );
}
