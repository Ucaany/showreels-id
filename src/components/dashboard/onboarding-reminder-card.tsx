"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function OnboardingReminderCard({
  resumeHref = "/onboarding",
}: {
  userId: string;
  resumeHref?: string;
}) {
  return (
    <Card className="dashboard-clean-card border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <Sparkles className="h-3.5 w-3.5" />
            Onboarding Creator
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Selesaikan profile kamu
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Lengkapi profile untuk mendapatkan pengalaman terbaik
          </p>
        </div>
        <Link href={resumeHref}>
          <Button size="sm">Lanjutkan Onboarding</Button>
        </Link>
      </div>
    </Card>
  );
}
