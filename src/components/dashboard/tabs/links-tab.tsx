"use client";

import { useDashboardStore } from "@/stores/dashboard-store";
import { useState } from "react";

/**
 * LinksTab - Menampilkan daftar custom links dari Zustand store.
 * Instant render (0ms) karena data sudah ada di memory.
 */
export function LinksTab() {
  const customLinks = useDashboardStore((s) => s.customLinks);
  const toggleLinkActive = useDashboardStore((s) => s.toggleLinkActive);
  const setSyncing = useDashboardStore((s) => s.setSyncing);
  const [syncingLinkId, setSyncingLinkId] = useState<string | null>(null);

  const handleToggleLink = async (linkId: string) => {
    // Optimistic update
    toggleLinkActive(linkId);
    setSyncingLinkId(linkId);
    setSyncing(true);

    try {
      const res = await fetch(`/api/links/${linkId}/toggle`, {
        method: "PATCH",
      });

      if (!res.ok) {
        // Rollback on error
        toggleLinkActive(linkId);
      }
    } catch {
      // Rollback on network error
      toggleLinkActive(linkId);
    } finally {
      setSyncingLinkId(null);
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          Custom Links
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {customLinks.length} link terdaftar •{" "}
          {customLinks.filter((l) => l.enabled).length} aktif
        </p>
      </div>

      {/* Links List */}
      {customLinks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">
            Belum ada custom link. Tambahkan link dari halaman Link Builder.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {customLinks.map((link) => (
            <div
              key={link.id}
              className={`flex items-center justify-between rounded-xl border bg-white p-4 transition-all ${
                link.enabled
                  ? "border-neutral-200"
                  : "border-neutral-100 opacity-60"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Icon / Platform */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-lg">
                  {link.platform ? getPlatformEmoji(link.platform) : "🔗"}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-neutral-900">
                    {link.title}
                  </h3>
                  <p className="truncate text-xs text-neutral-400">
                    {link.url}
                  </p>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => handleToggleLink(link.id)}
                disabled={syncingLinkId === link.id}
                className={`
                  relative ml-3 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors
                  ${link.enabled ? "bg-neutral-900" : "bg-neutral-200"}
                  ${syncingLinkId === link.id ? "opacity-50" : ""}
                `}
                aria-label={`Toggle ${link.title}`}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${link.enabled ? "translate-x-6" : "translate-x-1"}
                  `}
                />
                {syncingLinkId === link.id && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-blue-400" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function getPlatformEmoji(platform: string): string {
  const map: Record<string, string> = {
    instagram: "📷",
    youtube: "▶️",
    tiktok: "🎵",
    twitter: "🐦",
    facebook: "📘",
    linkedin: "💼",
    github: "🐙",
    website: "🌐",
    whatsapp: "💬",
    email: "📧",
  };
  return map[platform.toLowerCase()] ?? "🔗";
}
