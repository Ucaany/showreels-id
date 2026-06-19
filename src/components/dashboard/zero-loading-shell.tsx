"use client";

import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { ProfileTab } from "@/components/dashboard/tabs/profile-tab";
import { VideosTab } from "@/components/dashboard/tabs/videos-tab";
import { LinksTab } from "@/components/dashboard/tabs/links-tab";
import { VisibilityTab } from "@/components/dashboard/tabs/visibility-tab";
import { DashboardDataLoader } from "@/components/dashboard/dashboard-data-loader";

// ─── Tab Definitions ────────────────────────────────────────────────────────

type TabId = "profile" | "videos" | "links" | "visibility";

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "profile", label: "Profil Publik", icon: "👤" },
  { id: "videos", label: "Halaman Video", icon: "🎬" },
  { id: "links", label: "Custom Links", icon: "🔗" },
  { id: "visibility", label: "Kontrol Visibilitas", icon: "👁️" },
];

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
        <p className="mt-4 text-sm text-neutral-500">Memuat dashboard...</p>
      </div>
    </div>
  );
}

// ─── Zero-Loading Shell ─────────────────────────────────────────────────────

export function ZeroLoadingShell() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const isInitialLoading = useDashboardStore((s) => s.isInitialLoading);

  return (
    <>
      {/* Data loader - runs once on mount */}
      <DashboardDataLoader />

      {isInitialLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex h-full flex-col">
          {/* ─── Tab Navigation ─────────────────────────────────────────── */}
          <div className="border-b border-neutral-200 bg-white">
            <nav
              className="flex space-x-1 overflow-x-auto px-4 sm:space-x-6 sm:px-6"
              aria-label="Dashboard Tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors
                    ${
                      activeTab === tab.id
                        ? "border-neutral-900 text-neutral-900"
                        : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                    }
                  `}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* ─── Tab Content - Instant switch (0ms) ─────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "videos" && <VideosTab />}
            {activeTab === "links" && <LinksTab />}
            {activeTab === "visibility" && <VisibilityTab />}
          </div>
        </div>
      )}
    </>
  );
}
