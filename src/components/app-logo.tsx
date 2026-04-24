import Link from "next/link";
import { Link2 } from "lucide-react";
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
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "inline-flex h-[2.15rem] w-[2.15rem] items-center justify-center rounded-full border sm:h-9 sm:w-9",
          darkTone
            ? "border-brand-200 bg-white text-brand-600"
            : "border-white/25 bg-white/15 text-white"
        )}
      >
        <Link2 className="h-4 w-4" />
      </span>
      <span
        className={cn(
          "text-[1rem] font-semibold tracking-[-0.02em] sm:text-[1.04rem]",
          darkTone ? "text-[#1f1a17]" : "text-[#f6f3f0]"
        )}
      >
        showreels.id
      </span>
    </Link>
  );
}
