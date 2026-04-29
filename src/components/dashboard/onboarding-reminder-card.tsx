"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function OnboardingReminderCard({
  userId,
  resumeHref = "/dashboard?onboarding=1",
}: {
  userId: string;
  resumeHref?: string;
}) {
  const storageKey = useMemo(
    () => `showreels.onboarding.reminder.dismissed.${userId}`,
    [userId]
  );
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    try {
      return window.sessionStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) {
    return null;
  }

  return (
    <Card className="dashboard-clean-card border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <Sparkles className="h-3.5 w-3.5" />
            Setup Creator
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Lengkapi halaman creator kamu</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tambahkan bio dan link agar halaman kamu siap dibagikan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={resumeHref}>
            <Button size="sm">Lanjutkan Setup</Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setDismissed(true);
              try {
                window.sessionStorage.setItem(storageKey, "1");
              } catch {
                // noop
              }
            }}
          >
            <X className="h-4 w-4" />
            Tutup
          </Button>
        </div>
      </div>
    </Card>
  );
}
