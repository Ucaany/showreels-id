"use client";

import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { DashboardProfile, DashboardVideo, DashboardLink } from "@/stores/dashboard-store";

/**
 * DashboardDataLoader
 *
 * Fetches all dashboard data in parallel from API routes and stores in Zustand.
 * Runs only once on mount. Renders nothing visible.
 */
export function DashboardDataLoader() {
  const { initializeDashboard, isInitialLoading } = useDashboardStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!isInitialLoading || hasFetched.current) return;
    hasFetched.current = true;

    async function loadDashboardData() {
      try {
        // Fetch all data in parallel from API routes
        const [profileRes, videosRes, linksRes] = await Promise.all([
          fetch("/api/dashboard/profile"),
          fetch("/api/dashboard/videos"),
          fetch("/api/links"),
        ]);

        // Parse responses
        const [profileData, videosData, linksData] = await Promise.all([
          profileRes.json(),
          videosRes.json(),
          linksRes.json(),
        ]);

        // Map profile data
        const profile: DashboardProfile = {
          id: profileData.id ?? "",
          username: profileData.username ?? "",
          fullName: profileData.fullName ?? "",
          bio: profileData.bio ?? "",
          avatarUrl: profileData.avatarUrl ?? "",
          profileVisibility: profileData.profileVisibility ?? "public",
          email: profileData.email ?? "",
          contactEmail: profileData.contactEmail ?? "",
          instagramUrl: profileData.instagramUrl ?? "",
          youtubeUrl: profileData.youtubeUrl ?? "",
          facebookUrl: profileData.facebookUrl ?? "",
          threadsUrl: profileData.threadsUrl ?? "",
          linkedinUrl: profileData.linkedinUrl ?? "",
          websiteUrl: profileData.websiteUrl ?? "",
        };

        // Map videos data (API returns array or { videos: [...] })
        const rawVideos: DashboardVideo[] = (
          Array.isArray(videosData) ? videosData : videosData.videos ?? []
        ).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (v: any): DashboardVideo => ({
            id: v.id,
            title: v.title ?? "",
            sourceUrl: v.sourceUrl ?? "",
            visibility: v.visibility ?? "private",
            thumbnailUrl: v.thumbnailUrl ?? "",
            createdAt: v.createdAt ?? "",
            source: v.source ?? "youtube",
            publicSlug: v.publicSlug ?? "",
            tags: v.tags ?? [],
          })
        );

        // Map links data (API returns { links: [...] })
        const rawLinks: DashboardLink[] = (
          linksData.links ?? []
        ).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (l: any): DashboardLink => ({
            id: l.id,
            title: l.title ?? "",
            url: l.url ?? "",
            description: l.description ?? "",
            platform: l.platform ?? "",
            badge: l.badge ?? "",
            thumbnailUrl: l.thumbnailUrl ?? "",
            enabled: l.enabled ?? true,
            order: l.order ?? 0,
          })
        );

        initializeDashboard({
          profile,
          videos: rawVideos,
          customLinks: rawLinks,
        });
      } catch (error) {
        console.error("[DashboardDataLoader] Failed to load data:", error);
        // Even on error, stop loading state to prevent infinite spinner
        initializeDashboard({
          profile: {
            id: "",
            username: "",
            fullName: "",
            bio: "",
            avatarUrl: "",
            profileVisibility: "public",
            email: "",
            contactEmail: "",
            instagramUrl: "",
            youtubeUrl: "",
            facebookUrl: "",
            threadsUrl: "",
            linkedinUrl: "",
            websiteUrl: "",
          },
          videos: [],
          customLinks: [],
        });
      }
    }

    loadDashboardData();
  }, [isInitialLoading, initializeDashboard]);

  // This component renders nothing
  return null;
}
