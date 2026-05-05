"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/api")) {
      return;
    }

    const controller = new AbortController();
    fetch("/api/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Visitor tracking is best-effort and must never block the UI.
    });

    return () => controller.abort();
  }, [pathname]);

  return null;
}
