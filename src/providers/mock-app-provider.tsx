"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { seedState, storageKey } from "@/lib/mock-seed";
import type { AppState, ServiceResult, UserProfile, VideoItem } from "@/lib/types";
import type { SignupInput } from "@/services/auth-service";
import {
  profileService,
  type ProfileUpdateInput,
} from "@/services/profile-service";
import { videoService, type CreateVideoInput } from "@/services/video-service";
import { detectVideoSource } from "@/lib/video-utils";

interface MockAppContextValue extends AppState {
  ready: boolean;
  currentUser: UserProfile | null;
  login: (
    input: { email: string; password: string }
  ) => Promise<ServiceResult<{ notice: string }>>;
  signup: (
    input: SignupInput
  ) => Promise<ServiceResult<{ notice: string }>>;
  requestPasswordReset: (
    email: string
  ) => Promise<ServiceResult<{ notice: string }>>;
  resetPassword: (password: string) => Promise<ServiceResult<{ notice: string }>>;
  logout: () => void;
  updateProfile: (
    payload: ProfileUpdateInput
  ) => Promise<ServiceResult<{ profile: UserProfile }>>;
  createVideo: (
    payload: Omit<CreateVideoInput, "userId">
  ) => Promise<ServiceResult<{ video: VideoItem }>>;
  generateDescription: (input: {
    title: string;
    tags: string[];
    sourceUrl: string;
  }) => Promise<ServiceResult<{ description: string }>>;
}

const MockAppContext = createContext<MockAppContextValue | undefined>(undefined);

function readPersistedState(): AppState {
  if (typeof window === "undefined") {
    return seedState;
  }
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return seedState;
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    return {
      session: parsed.session ?? null,
      users: parsed.users ?? [],
      videos: parsed.videos ?? [],
    };
  } catch {
    return seedState;
  }
}

export function MockAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => readPersistedState());
  const ready = true;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const currentUser =
    state.users.find((user) => user.id === state.session?.userId) ?? null;

  const login = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<ServiceResult<{ notice: string }>> => {
    // Mock login: validate against local state.users
    const user = state.users.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user) {
      return { ok: false, error: "Email atau password salah." };
    }
    // In mock mode we skip password verification
    void password;
    const mockSession = {
      token: "mock-token-" + user.id,
      userId: user.id,
      email: user.email,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    setState((prev) => ({ ...prev, session: mockSession }));
    return { ok: true, data: { notice: "Login berhasil." } };
  };

  const signup = async (
    input: SignupInput
  ): Promise<ServiceResult<{ notice: string }>> => {
    // Mock signup: check duplicate email locally
    const exists = state.users.some(
      (u) => u.email?.toLowerCase() === input.email.trim().toLowerCase()
    );
    if (exists) {
      return { ok: false, error: "Email sudah terdaftar." };
    }
    const newUserId = crypto.randomUUID();
    const newUser: UserProfile = {
      id: newUserId,
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName,
      username: input.username,
      role: "creator",
      avatarUrl: "",
      bio: "",
      experience: "",
      birthDate: "",
      city: "",
      contactEmail: "",
      phoneNumber: "",
      websiteUrl: "",
      instagramUrl: "",
      youtubeUrl: "",
      facebookUrl: "",
      threadsUrl: "",
      linkedinUrl: "",
      customLinks: [],
      skills: [],
      profileVisibility: "public",
      createdAt: new Date().toISOString(),
    };
    const mockSession = {
      token: "mock-token-" + newUserId,
      userId: newUserId,
      email: input.email.trim().toLowerCase(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    setState((prev) => ({
      ...prev,
      session: mockSession,
      users: [newUser, ...prev.users],
    }));
    return { ok: true, data: { notice: "Akun berhasil dibuat." } };
  };

  const requestPasswordReset = async (
    _email: string
  ): Promise<ServiceResult<{ notice: string }>> => {
    // Mock: always return success
    return {
      ok: true,
      data: { notice: "Jika email terdaftar, kami akan mengirim tautan reset password." },
    };
  };

  const resetPassword = async (
    _password: string
  ): Promise<ServiceResult<{ notice: string }>> => {
    // Mock: always return success
    return { ok: true, data: { notice: "Password berhasil diubah." } };
  };

  const logout = () => {
    setState((prev) => ({ ...prev, session: null }));
  };

  const updateProfile = async (
    payload: ProfileUpdateInput
  ): Promise<ServiceResult<{ profile: UserProfile }>> => {
    if (!state.session?.userId) {
      return { ok: false, error: "Kamu harus login dulu." };
    }

    const result = await profileService.updateProfile(
      state.session.userId,
      state.users,
      payload
    );
    if (!result.ok || !result.data) {
      return { ok: false, error: result.error };
    }

    setState((prev) => ({
      ...prev,
      users: result.data?.users ?? prev.users,
    }));
    return {
      ok: true,
      data: { profile: result.data.profile },
    };
  };

  const createVideo = async (
    payload: Omit<CreateVideoInput, "userId">
  ): Promise<ServiceResult<{ video: VideoItem }>> => {
    if (!state.session?.userId) {
      return { ok: false, error: "Kamu harus login untuk submit video." };
    }

    const result = await videoService.createVideo(
      { ...payload, userId: state.session.userId },
      state.videos
    );

    if (!result.ok || !result.data) {
      return { ok: false, error: result.error };
    }

    setState((prev) => ({
      ...prev,
      videos: result.data?.videos ?? prev.videos,
    }));
    return { ok: true, data: { video: result.data.video } };
  };

  const generateDescription = async ({
    title,
    tags,
    sourceUrl,
  }: {
    title: string;
    tags: string[];
    sourceUrl: string;
  }): Promise<ServiceResult<{ description: string }>> => {
    const source = detectVideoSource(sourceUrl);
    if (!source) {
      return { ok: false, error: "Sumber video belum dikenali." };
    }
    return videoService.generateDescription({ title, tags, source });
  };

  const value: MockAppContextValue = {
    ready,
    session: state.session,
    users: state.users,
    videos: state.videos,
    currentUser,
    login,
    signup,
    requestPasswordReset,
    resetPassword,
    logout,
    updateProfile,
    createVideo,
    generateDescription,
  };

  return <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>;
}

export function useMockApp() {
  const context = useContext(MockAppContext);
  if (!context) {
    throw new Error("useMockApp harus dipakai di dalam MockAppProvider.");
  }
  return context;
}
