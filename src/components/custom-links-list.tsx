import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { normalizeCustomLinks } from "@/lib/profile-utils";

interface CustomLinksListProps {
  links: unknown;
  className?: string;
  compact?: boolean;
  maxItems?: number;
  emptyLabel?: string;
}

export function CustomLinksList({
  links,
  className,
  compact = false,
  maxItems,
  emptyLabel,
}: CustomLinksListProps) {
  const normalized = normalizeCustomLinks(links);
  const visibleLinks =
    typeof maxItems === "number" ? normalized.slice(0, maxItems) : normalized;
  const enabledLinks = visibleLinks.filter((link) => link.enabled !== false);

  if (enabledLinks.length === 0) {
    if (!emptyLabel) {
      return null;
    }

    return (
      <p
        className={cn(
          "rounded-2xl border border-dashed border-[#e0d4ce] bg-white/75 px-4 py-3 text-sm text-[#6b5d56]",
          className
        )}
      >
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {enabledLinks.map((link) => (
          <Link
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group flex w-full items-center justify-between rounded-2xl border border-[#dfd4ce] bg-white px-4 text-left text-[#231d19] transition hover:border-[#e65a46] hover:bg-[#fff8f6]",
              compact ? "h-11 text-sm" : "h-12 text-[0.95rem]"
            )}
          >
            <span className="truncate pr-3 font-semibold">{link.title}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-[#85766e] transition group-hover:text-[#e65a46]" />
          </Link>
        ))}
    </div>
  );
}
