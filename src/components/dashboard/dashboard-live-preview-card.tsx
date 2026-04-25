"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const profileLink = `/creator/${username || "creator"}`;

  return (
    <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#655952]">Live Preview</p>
          <h2 className="font-display text-xl font-semibold text-[#201b18] sm:text-2xl">
            Preview halaman publik
          </h2>
        </div>
        <div className="inline-flex rounded-full border border-[#d7cec7] bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("desktop")}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
              mode === "desktop"
                ? "bg-[#1a1412] text-white"
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
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
              mode === "android"
                ? "bg-[#1a1412] text-white"
                : "text-[#5d514b] hover:bg-[#f3ece8]"
            }`}
            aria-label="Android preview"
          >
            <Smartphone className="h-3.5 w-3.5" />
            Android
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div
          className={`mx-auto rounded-[30px] border border-[#d8cec8] bg-gradient-to-br from-[#ffffff] via-[#f6f2ef] to-[#f2eae5] p-4 shadow-sm ${
            mode === "android" ? "max-w-[390px]" : "max-w-full"
          }`}
        >
          <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
            <p className="text-base font-semibold text-[#201b18]">{displayName || "Nama creator"}</p>
            <p className="mt-1 text-sm text-[#6a5d56]">{role || "Role / Profession"}</p>
            <p className="mt-3 max-h-[4.5rem] overflow-hidden text-sm leading-6 text-[#4f433d]">
              {bio || "Bio kamu akan tampil di sini saat diisi."}
            </p>
            <div className="mt-4 space-y-2">
              {visibleLinks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#d9cec7] bg-[#f8f4f1] px-3 py-2 text-xs text-[#6c6059]">
                  Belum ada link aktif.
                </p>
              ) : (
                visibleLinks.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-xl border border-[#e2d8d1] bg-[#fffaf8] px-3 py-2 text-sm font-medium text-[#2b241f]"
                  >
                    {link.title}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={profileLink} target="_blank">
          <Button size="sm">Buka Full Preview</Button>
        </Link>
      </div>
    </Card>
  );
}
