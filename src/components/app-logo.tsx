import Link from "next/link";
import Image from "next/image";
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
      <div className="relative h-[2.15rem] w-[2.15rem] sm:h-9 sm:w-9">
        <Image
          src="/logo.png"
          alt="Showreels.id Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      <span
        className={cn(
          "text-[1rem] font-semibold tracking-[-0.02em] sm:text-[1.04rem]",
          darkTone ? "text-slate-950" : "text-white"
        )}
      >
        showreels.id
      </span>
    </Link>
  );
}
