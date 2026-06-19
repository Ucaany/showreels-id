import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { UserProfile, VideoItem, CustomLinkEntry } from "@/lib/types";

// ─── State Types ────────────────────────────────────────────────────────────

export type DashboardProfile = Pick<
  UserProfile,
  | "id"
  | "username"
  | "fullName"
  | "bio"
  | "avatarUrl"
  | "profileVisibility"
  | "email"
  | "contactEmail"
  | "instagramUrl"
  | "youtubeUrl"
  | "facebookUrl"
  | "threadsUrl"
  | "linkedinUrl"
  | "websiteUrl"
>;

export type DashboardVideo = Pick<
  VideoItem,
  | "id"
  | "title"
  | "sourceUrl"
  | "visibility"
  | "thumbnailUrl"
  | "createdAt"
  | "source"
  | "publicSlug"
  | "tags"
>;

export type DashboardLink = CustomLinkEntry;

// ─── Store Interface ────────────────────────────────────────────────────────

interface DashboardState {
  // Data
  profile: DashboardProfile | null;
  videos: DashboardVideo[];
  customLinks: DashboardLink[];

  // Loading states
  isInitialLoading: boolean;
  isSyncing: boolean;
  syncingVideoId: string | null;

  // Actions
  setProfile: (profile: DashboardProfile) => void;
  setVideos: (videos: DashboardVideo[]) => void;
  setCustomLinks: (links: DashboardLink[]) => void;

  // Optimistic updates
  updateVideoVisibility: (
    videoId: string,
    visibility: VideoItem["visibility"]
  ) => void;
  toggleLinkActive: (linkId: string) => void;

  // Sync
  setInitialLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncingVideoId: (videoId: string | null) => void;

  // Initialize
  initializeDashboard: (data: {
    profile: DashboardProfile;
    videos: DashboardVideo[];
    customLinks: DashboardLink[];
  }) => void;

  // Reset
  resetStore: () => void;
}

// ─── Initial State ──────────────────────────────────────────────────────────

const initialState = {
  profile: null,
  videos: [] as DashboardVideo[],
  customLinks: [] as DashboardLink[],
  isInitialLoading: true,
  isSyncing: false,
  syncingVideoId: null,
};

// ─── Store ──────────────────────────────────────────────────────────────────

export const useDashboardStore = create<DashboardState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // ─── Actions ──────────────────────────────────────────────────────

        setProfile: (profile) => set({ profile }, false, "setProfile"),

        setVideos: (videos) => set({ videos }, false, "setVideos"),

        setCustomLinks: (customLinks) =>
          set({ customLinks }, false, "setCustomLinks"),

        // ─── Optimistic Updates ───────────────────────────────────────────

        updateVideoVisibility: (videoId, visibility) =>
          set(
            (state) => ({
              videos: state.videos.map((v) =>
                v.id === videoId ? { ...v, visibility } : v
              ),
            }),
            false,
            "updateVideoVisibility"
          ),

        toggleLinkActive: (linkId) =>
          set(
            (state) => ({
              customLinks: state.customLinks.map((link) =>
                link.id === linkId
                  ? { ...link, enabled: !link.enabled }
                  : link
              ),
            }),
            false,
            "toggleLinkActive"
          ),

        // ─── Sync ────────────────────────────────────────────────────────

        setInitialLoading: (loading) =>
          set({ isInitialLoading: loading }, false, "setInitialLoading"),

        setSyncing: (syncing) =>
          set({ isSyncing: syncing }, false, "setSyncing"),

        setSyncingVideoId: (videoId) =>
          set({ syncingVideoId: videoId }, false, "setSyncingVideoId"),

        // ─── Initialize ──────────────────────────────────────────────────

        initializeDashboard: (data) =>
          set(
            {
              profile: data.profile,
              videos: data.videos,
              customLinks: data.customLinks,
              isInitialLoading: false,
            },
            false,
            "initializeDashboard"
          ),

        // ─── Reset ───────────────────────────────────────────────────────

        resetStore: () => set(initialState, false, "resetStore"),
      }),
      {
        name: "dashboard-storage",
        partialize: (state) => ({
          // Only persist data, not loading/syncing states
          profile: state.profile,
          videos: state.videos,
          customLinks: state.customLinks,
        }),
      }
    ),
    { name: "DashboardStore" }
  )
);
