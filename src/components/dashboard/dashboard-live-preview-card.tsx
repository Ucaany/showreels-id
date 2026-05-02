"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Copy, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import type { CustomLinkItem } from "@/lib/profile-utils";

type DeviceMode = "desktop" | "android";

export function DashboardLivePreviewCard({
  username,
  displayName,
  role,
  bio,
  links,
}: {
  username: string;
  displayName: string;
  role: string;
  bio: string;
  links: CustomLinkItem[];
}) {
  const [mode, setMode] = useState<DeviceMode>("desktop");
  const visibleLinks = useMemo(
    () => links.filter((item) => item.enabled !== false).slice(0, 3),
    [links]
  );
  const profilePath = `/creator/${username || "creator"}`;

  const handleCopy = async () => {
    const url = `${window.location.origin}${profilePath}`;
    await navigator.clipboard.writeText(url);
    await showFeedbackAlert({
      title: "Link profile berhasil disalin",
      icon: "success",
      timer: 1100,
    });
  };

  return (
    <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#655952]">Link Publik Siap Dibagikan</p>
          <h2 className="font-display text-xl font-semibold text-[#201b18] sm:text-2xl">
            Preview live halaman creator
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-[#d7cec7] bg-white p-1">
            <button
              type="button"
              onClick={() => setMode("desktop")}
              className={`dashboard-tap-target inline-flex items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
                mode === "desktop"
                  ? "bg-[#111111] text-white"
                  : "text-[#5d514b] hover:bg-[#f3ece8]"
              }`}
              aria-label="Desktop preview"
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setMode("android")}
              className={`dashboard-tap-target inline-flex items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
                mode === "android"
                  ? "bg-[#111111] text-white"
                  : "text-[#5d514b] hover:bg-[#f3ece8]"
              }`}
              aria-label="Android preview"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Android
            </button>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Live
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_410px]">
        <div className="rounded-2xl border border-[#e3d8d2] bg-[#fbf7f4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6d6059]">
            Public URL
          </p>
          <p className="mt-2 inline-flex max-w-full items-center rounded-full border border-[#e0d5ce] bg-white px-3 py-2 text-sm font-semibold text-[#201b18]">
            {profilePath}
          </p>
          <p className="mt-2 text-sm text-[#5d5048]">
            Bagikan link ini ke Instagram bio, WhatsApp, atau email.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
            <Link href={profilePath} target="_blank">
              <Button size="sm" variant="secondary">
                Buka Full Preview
              </Button>
            </Link>
          </div>
        </div>

        {/* Phone preview - matches bio page style */}
        <div className="rounded-[28px] border border-[#E1E1DF] bg-[#F5F5F4] p-4">
          <div
            className={`mx-auto ${mode === "android" ? "max-w-[360px]" : "max-w-[430px]"} rounded-[38px] border-[9px] border-[#111111] bg-[#F5F5F4] p-4 shadow-xl`}
          >
            <div className="mx-auto h-5 w-24 rounded-full bg-[#111111]" />
            <div className="mt-4 rounded-[1.75rem] border border-[#E1E1DF] bg-white px-4 py-6 text-center shadow-[0_18px_50px_rgba(17,17,17,0.06)]">
              {/* Avatar */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#6d64ff] to-[#8f45e9] text-2xl font-semibold text-white shadow-[0_14px_34px_rgba(17,17,17,0.12)]">
                {(displayName || "C").slice(0, 1).toUpperCase()}
              </div>

              {/* Name */}
              <p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-[#111111]">
                {displayName || "Nama creator"}
              </p>

              {/* Role + Username — single line (matches bio page) */}
              <p className="mt-2 text-sm font-semibold text-[#525252]">
                {role ? <span className="text-base font-medium text-[#111111]">{role}</span> : null}
                {role ? <span className="mx-1.5 text-[#DADADA]">•</span> : null}
                <span>@{username || "username"}</span>
              </p>

              {/* Bio */}
              <p className="mx-auto mt-3 max-w-[300px] text-[15px] leading-tight text-[#525252]">
                {bio || "Bio kamu akan tampil di sini saat diisi."}
              </p>

              {/* Links - matches bio page monoButtonClass style */}
              <div className="mt-5 space-y-2.5 text-left">
                {visibleLinks.length === 0 ? (
                  <p className="rounded-[1.25rem] border border-dashed border-[#DADADA] bg-[#FAFAF9] px-4 py-3 text-center text-xs text-[#525252]">
                    Belum ada link aktif.
                  </p>
                ) : (
                  visibleLinks.map((link) => (
                    <div
                      key={link.id}
                      className="inline-flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[1.25rem] border border-[#E1E1DF] bg-white px-4 text-left text-sm font-semibold text-[#111111] transition hover:-translate-y-0.5 hover:border-[#111111] hover:shadow-[0_12px_28px_rgba(17,17,17,0.08)]"
                    >
                      <span className="min-w-0 truncate">{link.title}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[#525252]" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
