import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export function AppLogo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const darkTone = tone === "dark";

  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg text-white",
          darkTone
            ? "bg-brand-600 shadow-soft"
            : "bg-brand-500 shadow-[0_12px_30px_rgba(79,158,255,0.35)]"
        )}
      >
        <Sparkles className="h-4 w-4" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-semibold",
          darkTone ? "text-slate-900" : "text-slate-100"
        )}
      >
        VideoPort AI Hub
      </span>
    </Link>
  );
}
