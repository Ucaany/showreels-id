"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Next.js Link dengan prefetch default + router.prefetch pada hover untuk navigasi publik terasa instan.
 */
function hrefToPrefetchString(href: ComponentProps<typeof Link>["href"]): string {
  if (typeof href === "string") return href;
  if (href && typeof href === "object" && "pathname" in href) {
    const o = href as { pathname?: string; search?: string };
    return `${o.pathname ?? ""}${o.search ?? ""}`;
  }
  return String(href);
}

export function PrefetchOnHoverLink({
  href,
  onMouseEnter,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  const hrefString = hrefToPrefetchString(href);

  return (
    <Link
      prefetch
      href={href}
      {...props}
      onMouseEnter={(e) => {
        router.prefetch(hrefString);
        onMouseEnter?.(e);
      }}
    />
  );
}
