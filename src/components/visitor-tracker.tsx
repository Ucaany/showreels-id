"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/api")) {
      return;
    }

    let cancelled = false;
    const payload = JSON.stringify({ path: pathname });
    const idleWindow = window as IdleWindow;

    const send = () => {
      if (cancelled) {
        return;
      }

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon("/api/visitor", blob)) {
          return;
        }
      }

      fetch("/api/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Visitor tracking is best-effort and must never block the UI.
      });
    };

    const requestIdle =
      typeof idleWindow.requestIdleCallback === "function"
        ? idleWindow.requestIdleCallback.bind(idleWindow)
        : null;
    const cancelIdle =
      typeof idleWindow.cancelIdleCallback === "function"
        ? idleWindow.cancelIdleCallback.bind(idleWindow)
        : null;

    const idleId = requestIdle
      ? requestIdle(send, { timeout: 2000 })
      : window.setTimeout(send, 1200);

    return () => {
      cancelled = true;
      if (requestIdle && cancelIdle) {
        cancelIdle(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [pathname]);

  return null;
}
