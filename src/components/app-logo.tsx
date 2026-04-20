import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-soft">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="font-display text-lg font-semibold text-slate-900">
        VideoPort AI Hub
      </span>
    </Link>
  );
}
