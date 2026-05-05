"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/app-logo";

type SiteStatus = {
  maintenanceEnabled: boolean;
  pauseEnabled: boolean;
  maintenanceMessage: string;
};

export function SiteMaintenanceGate() {
  const pathname = usePathname();
  const [status, setStatus] = useState<SiteStatus | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/site-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: SiteStatus) => {
        if (active) {
          setStatus(payload);
        }
      })
      .catch(() => {
        if (active) {
          setStatus(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!status?.maintenanceEnabled && !status?.pauseEnabled) {
    return null;
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
        <div className="mb-5 flex justify-center">
          <AppLogo />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
          Maintenance
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">
          Website sedang dijeda sementara
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {status.maintenanceMessage ||
            "showreels.id sedang dirapikan. Silakan kembali beberapa saat lagi."}
        </p>
      </div>
    </div>
  );
}
