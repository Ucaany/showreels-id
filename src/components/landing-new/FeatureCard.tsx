"use client";

import {
  Link as LinkIcon,
  LayoutDashboard,
  Pencil,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { PlatformIcon } from "./PlatformIcons";
import type { ReactElement } from "react";
import { useLang } from "@/lib/i18n/landing-context";

const iconMap: Record<string, ReactElement> = {
  link: <LinkIcon className="h-4 w-4" strokeWidth={2.2} />,
  layout: <LayoutDashboard className="h-4 w-4" strokeWidth={2.2} />,
  dashboard: <LayoutDashboard className="h-4 w-4" strokeWidth={2.2} />,
  edit: <Pencil className="h-4 w-4" strokeWidth={2.2} />,
  chart: <BarChart3 className="h-4 w-4" strokeWidth={2.2} />,
  analytics: <TrendingUp className="h-4 w-4" strokeWidth={2.2} />,
};

interface FeatureCardProps {
  feature: {
    title: string;
    short: string;
    icon: string;
    badge: string;
    accent: string;
    mockup: string;
  };
  size?: "tall" | "wide" | "default";
}

export default function FeatureCard({ feature, size = "default" }: FeatureCardProps) {
  return (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white p-5 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-soft ${size === "tall" ? "md:min-h-[340px]" : "md:min-h-[300px]"}`}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.08)]">
          {iconMap[feature.icon]}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">
          /{feature.badge}
        </span>
      </div>

      <h3 className="mt-4 text-card-title font-semibold text-ink">
        {feature.title}
      </h3>
      <p className="mt-1.5 text-body-base font-normal text-ink/60">
        {feature.short}
      </p>

      <div className="mt-5">{renderMockup(feature.mockup)}</div>
    </div>
  );
}

function UsernameMockup() {
  const { lang } = useLang();
  const isEN = lang === "EN";

  return (
    <div className="relative h-[112px] overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-surface-soft p-2.5">
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <div className="text-[10px] font-semibold text-ink/55">
          showreels.id/
        </div>
        <div className="h-7 w-32 rounded-full bg-ink px-3 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-white">
            {isEN ? "Create Link" : "Buat Link"}
          </span>
        </div>
        <div className="flex gap-1">
          {["youtube", "tiktok", "instagram"].map((p, i) => (
            <PlatformIcon
              key={i}
              name={p}
              className="h-3 w-3 text-brand-600/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function renderMockup(type: string) {
  switch (type) {
    case "links":
      return (
        <div className="relative h-[112px] overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-surface-soft p-2.5">
          <div className="space-y-1.5">
            {["youtube", "tiktok", "instagram", "vimeo"].map((p, i) => (
              <div
                key={i}
                className="flex h-6 items-center gap-1.5 rounded-full bg-white px-2.5"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <PlatformIcon name={p} className="h-2.5 w-2.5" />
                </span>
                <span className="h-1.5 w-12 rounded-full bg-ink/15" />
              </div>
            ))}
          </div>
        </div>
      );
    case "portfolio":
      return (
        <div className="relative h-[112px] overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-surface-soft p-2">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`aspect-square flex-1 rounded-md bg-gradient-to-br ${
                  i === 1
                    ? "from-brand-100 to-brand-50"
                    : i === 2
                      ? "from-brand-200 to-brand-100"
                      : "from-brand-300 to-brand-100"
                }`}
              />
            ))}
          </div>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-3/4 rounded-full bg-ink/15" />
            <div className="h-1.5 w-1/2 rounded-full bg-ink/8" />
          </div>
        </div>
      );
    case "username":
      return <UsernameMockup />;
    case "dashboard":
      return (
        <div className="relative h-[112px] overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-surface-soft p-2.5">
          <div className="flex h-full gap-2">
            <div className="flex w-1/2 flex-col gap-1.5">
              <div className="h-2 w-3/4 rounded-full bg-ink/15" />
              <div className="grid grid-cols-2 gap-1.5">
                <div className="aspect-square rounded-md bg-brand-100" />
                <div className="aspect-square rounded-md bg-brand-200" />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-2 w-1/2 rounded-full bg-ink/15" />
              <div className="flex-1 rounded-md bg-white p-1.5">
                <div className="space-y-1">
                  {[0.4, 0.65, 0.5, 0.8].map((w, i) => (
                    <div
                      key={i}
                      className="h-1 rounded-full bg-brand-500/30"
                      style={{ width: `${w * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case "analytics":
      return (
        <div className="relative h-[112px] overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-surface-soft p-2.5">
          <div className="flex items-end justify-between gap-1.5 h-full">
            {[0.4, 0.7, 0.55, 0.85, 0.6, 0.95, 0.75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-brand-700 to-brand-400"
                style={{ height: `${h * 100}%` }}
              />
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}