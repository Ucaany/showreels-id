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
          "rounded-2xl border border-dashed border-[#d6e2f7] bg-[#f7fbff] px-4 py-3 text-sm text-[#5f78a3]",
          className
        )}
      >
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {enabledLinks.map((link) => {
        if (link.type === "divider") {
          return (
            <div
              key={link.id}
              className={cn(
                "my-3 border-[#d6e2f7]",
                link.style === "dashed" ? "border-t border-dashed" : "border-t",
                link.style === "solid" ? "border-t-2" : ""
              )}
            />
          );
        }

        if (!link.url) {
          return (
            <div
              key={link.id}
              className={cn(
                "rounded-2xl border border-[#d4e2f8] bg-white px-4 py-3 text-[#243a5f]",
                compact ? "text-sm" : "text-[0.95rem]"
              )}
            >
              <span className="font-semibold">{link.title}</span>
              {link.description ? (
                <p className="mt-1 text-xs leading-5 text-[#6078a2]">{link.description}</p>
              ) : null}
            </div>
          );
        }

        return (
          <Link
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group flex w-full items-center justify-between rounded-2xl border border-[#d4e2f8] bg-white px-4 text-left text-[#243a5f] transition hover:border-[#2f73ff] hover:bg-[#eff6ff]",
              compact ? "h-11 text-sm" : "h-12 text-[0.95rem]"
            )}
          >
            <span className="truncate pr-3 font-semibold">{link.title}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-[#6a83ae] transition group-hover:text-[#2f73ff]" />
          </Link>
        );
      })}
    </div>
  );
}
