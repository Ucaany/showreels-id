"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Link2,
  MessageCircle,
  Music2,
  PlayCircle,
  UserRound,
  Video,
} from "lucide-react";
import type { DbUserOnboarding } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import { normalizeSocialUrl } from "@/lib/profile-utils";
import { sanitizeUsername } from "@/lib/username-rules";

type UsernameAvailability = {
  checking: boolean;
  available: boolean;
  reason: string;
  suggestion: string;
  ownedByCurrentUser?: boolean;
};

const STEP_ITEMS = [
  { id: 1, title: "Identitas Creator" },
  { id: 2, title: "Buat Link Pertama" },
  { id: 3, title: "Preview Halaman" },
  { id: 4, title: "Selesai" },
] as const;

const PLATFORM_OPTIONS: Array<{
  id: string;
  title: string;
  icon: LucideIcon;
  defaultTitle: string;
}> = [
  { id: "Website", title: "Website", icon: Globe, defaultTitle: "Kunjungi Website" },
  { id: "Instagram", title: "Instagram", icon: Camera, defaultTitle: "Follow Instagram" },
  { id: "YouTube", title: "YouTube", icon: Video, defaultTitle: "Lihat YouTube" },
  { id: "WhatsApp", title: "WhatsApp", icon: MessageCircle, defaultTitle: "Hubungi WhatsApp" },
  { id: "TikTok", title: "TikTok", icon: Music2, defaultTitle: "Lihat TikTok" },
  { id: "Custom Link", title: "Custom Link", icon: Link2, defaultTitle: "Buka Link" },
  { id: "Portfolio Video", title: "Portfolio Video", icon: PlayCircle, defaultTitle: "Lihat Portfolio Video" },
];

function getProgressPayload(status: DbUserOnboarding) {
  if (!status.progressPayload || typeof status.progressPayload !== "object") {
    return {};
  }
  return status.progressPayload;
}

export function OnboardingStepper({
  initialStatus,
  initialUser,
  linkBuilderMax,
  planName,
  embedded = false,
}: {
  initialStatus: DbUserOnboarding;
  initialUser: {
    fullName: string;
    username: string;
    role: string;
    bio: string;
    image: string;
    coverImageUrl: string;
  };
  linkBuilderMax: number | null;
  planName: "free" | "creator" | "pro" | "business";
  embedded?: boolean;
}) {
  const router = useRouter();
  const payload = getProgressPayload(initialStatus);
  const payloadProfile =
    payload.profile && typeof payload.profile === "object"
      ? (payload.profile as {
          fullName?: string;
          username?: string;
          role?: string;
          bio?: string;
          image?: string;
          coverImageUrl?: string;
        })
      : {};
  const payloadFirstLink =
    payload.firstLink && typeof payload.firstLink === "object"
      ? (payload.firstLink as {
          title?: string;
          url?: string;
          platform?: string;
          enabled?: boolean;
        })
      : {};
  const payloadOnboarding =
    payload.onboarding && typeof payload.onboarding === "object"
      ? (payload.onboarding as {
          wantsToAddFirstLink?: boolean;
        })
      : {};
  const hasFirstLinkDraft = Boolean(
    (payloadFirstLink.title || "").trim() ||
      (payloadFirstLink.url || "").trim() ||
      (payloadFirstLink.platform || "").trim()
  );

  const [step, setStep] = useState(Math.min(4, Math.max(1, initialStatus.currentStep || 1)));
  const [fullName, setFullName] = useState(payloadProfile.fullName || initialUser.fullName);
  const [username, setUsername] = useState(payloadProfile.username || initialUser.username);
  const [role, setRole] = useState(payloadProfile.role || initialUser.role);
  const [bio, setBio] = useState(payloadProfile.bio || initialUser.bio);
  const [image, setImage] = useState(payloadProfile.image || initialUser.image);
  const [coverImageUrl, setCoverImageUrl] = useState(
    payloadProfile.coverImageUrl || initialUser.coverImageUrl
  );
  const [firstLinkTitle, setFirstLinkTitle] = useState(payloadFirstLink.title || "");
  const [firstLinkUrl, setFirstLinkUrl] = useState(payloadFirstLink.url || "");
  const [firstLinkPlatform, setFirstLinkPlatform] = useState(payloadFirstLink.platform || "");
  const [firstLinkEnabled, setFirstLinkEnabled] = useState(
    payloadFirstLink.enabled !== false
  );
  const [wantsToAddFirstLink, setWantsToAddFirstLink] = useState(
    typeof payloadOnboarding.wantsToAddFirstLink === "boolean"
      ? payloadOnboarding.wantsToAddFirstLink
      : hasFirstLinkDraft
  );
  const [optionalMediaExpanded, setOptionalMediaExpanded] = useState(
    Boolean(payloadProfile.image || payloadProfile.coverImageUrl || initialUser.image || initialUser.coverImageUrl)
  );
  const [busy, setBusy] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [lastDraftLabel, setLastDraftLabel] = useState("Draft otomatis aktif.");
  const [usernameState, setUsernameState] = useState<UsernameAvailability>({
    checking: false,
    available: Boolean(username),
    reason: username ? "available" : "idle",
    suggestion: "",
  });

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);
  const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedUsername = useMemo(() => sanitizeUsername(username), [username]);
  const resolvedUsernameState = useMemo(() => {
    if (!normalizedUsername || normalizedUsername.length < 3) {
      return {
        checking: false,
        available: false,
        reason: "invalid",
        suggestion: "",
      } satisfies UsernameAvailability;
    }
    return usernameState;
  }, [normalizedUsername, usernameState]);
  const stepIndex = STEP_ITEMS.findIndex((item) => item.id === step);

  const saveProgress = async (input: {
    currentStep?: number;
    createFirstLink?: boolean;
    wantsToAddFirstLink?: boolean;
  }) => {
    const shouldCreateFirstLink = Boolean(input.createFirstLink);
    const resolvedWantsToAddFirstLink = input.wantsToAddFirstLink ?? wantsToAddFirstLink;
    const normalizedFirstLinkUrl = normalizeSocialUrl(firstLinkUrl);
    const firstLinkPayload = {
      title: firstLinkTitle,
      url: normalizedFirstLinkUrl,
      platform: firstLinkPlatform,
      enabled: firstLinkEnabled,
    };

    const response = await fetch("/api/onboarding/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentStep: input.currentStep ?? step,
        createFirstLink: shouldCreateFirstLink,
        wantsToAddFirstLink: resolvedWantsToAddFirstLink,
        profile: {
          fullName,
          username: normalizedUsername,
          role,
          bio,
          image,
          coverImageUrl,
        },
        ...(shouldCreateFirstLink ? { firstLink: firstLinkPayload } : {}),
        progressPayload: {
          profile: {
            fullName,
            username: normalizedUsername,
            role,
            bio,
            image,
            coverImageUrl,
          },
          onboarding: {
            wantsToAddFirstLink: resolvedWantsToAddFirstLink,
          },
          firstLink: {
            title: firstLinkTitle,
            url: firstLinkUrl,
            platform: firstLinkPlatform,
            enabled: firstLinkEnabled,
          },
        },
      }),
    });

    return response;
  };

  const validateStepOne = async () => {
    if (!fullName.trim()) {
      await showFeedbackAlert({
        title: "Nama wajib diisi",
        text: "Isi display name sebelum lanjut ke langkah berikutnya.",
        icon: "warning",
      });
      return false;
    }

    if (!normalizedUsername || normalizedUsername.length < 3) {
      await showFeedbackAlert({
        title: "Username belum valid",
        text: "Gunakan username minimal 3 karakter.",
        icon: "warning",
      });
      return false;
    }

    if (!resolvedUsernameState.available) {
      await showFeedbackAlert({
        title: "Username belum tersedia",
        text:
          resolvedUsernameState.reason === "taken"
            ? "Username sudah digunakan creator lain."
            : "Periksa format username terlebih dahulu.",
        icon: "warning",
      });
      return false;
    }

    return true;
  };

  const validateStepTwo = async () => {
    if (!wantsToAddFirstLink) {
      return true;
    }

    if (!firstLinkPlatform.trim()) {
      await showFeedbackAlert({
        title: "Pilih jenis link terlebih dahulu",
        text: "Tentukan platform link utama sebelum lanjut.",
        icon: "warning",
      });
      return false;
    }

    const normalizedUrl = normalizeSocialUrl(firstLinkUrl);
    if (!firstLinkTitle.trim() || !normalizedUrl) {
      await showFeedbackAlert({
        title: "Link pertama belum lengkap",
        text: "Isi judul dan URL jika ingin menambahkan link pertama.",
        icon: "warning",
      });
      return false;
    }

    if (!normalizedUrl.startsWith("http")) {
      await showFeedbackAlert({
        title: "URL belum valid",
        text: "Gunakan URL yang diawali http:// atau https://.",
        icon: "warning",
      });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (busy) return;

    if (step === 1) {
      const valid = await validateStepOne();
      if (!valid) return;
    }

    if (step === 2) {
      const valid = await validateStepTwo();
      if (!valid) return;
    }

    const createFirstLink = step === 2 && wantsToAddFirstLink;
    setBusy(true);
    const response = await saveProgress({
      currentStep: Math.min(4, step + 1),
      createFirstLink,
    });
    const payloadResponse = (await response.json().catch(() => null)) as
      | { error?: string; code?: string }
      | null;

    setBusy(false);

    if (!response.ok) {
      await showFeedbackAlert({
        title:
          payloadResponse?.code === "link_limit_exceeded"
            ? "Batas 5 link tercapai"
            : "Gagal menyimpan progress",
        text: payloadResponse?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }

    setStep((prev) => Math.min(4, prev + 1));
    setLastDraftLabel("Progress tersimpan.");
  };

  const handleBack = () => {
    if (busy || step <= 1) return;
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSkip = async () => {
    if (busy || step >= 4) return;

    if (step === 2) {
      setWantsToAddFirstLink(false);
      setBusy(true);
      const response = await saveProgress({
        currentStep: 3,
        createFirstLink: false,
        wantsToAddFirstLink: false,
      });
      const payloadResponse = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setBusy(false);

      if (!response.ok) {
        await showFeedbackAlert({
          title: "Gagal menyimpan langkah link",
          text: payloadResponse?.error || "Coba ulang beberapa saat lagi.",
          icon: "error",
        });
        return;
      }

      setStep(3);
      setLastDraftLabel("Langkah link dilewati. Progress tersimpan.");
      return;
    }

    const confirmed = await confirmFeedbackAction({
      title: "Lanjutkan nanti?",
      text: "Kamu bisa melengkapi halaman creator dari dashboard kapan saja.",
      icon: "question",
      confirmButtonText: "Ya, nanti saja",
      cancelButtonText: "Kembali",
    });
    if (!confirmed) return;

    setBusy(true);
    const response = await fetch("/api/onboarding/skip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "fill_later" }),
    });
    const payloadResponse = (await response.json().catch(() => null)) as
      | { error?: string; redirectTo?: string }
      | null;
    setBusy(false);

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Gagal melewati onboarding",
        text: payloadResponse?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({
      title: "Onboarding dilewati.",
      text: "Kamu bisa melanjutkan setup kapan saja dari dashboard.",
      icon: "success",
      timer: 1400,
    });
    router.replace(payloadResponse?.redirectTo || "/dashboard");
    router.refresh();
  };

  const handleComplete = async (goTo: "dashboard" | "build-link") => {
    setBusy(true);
    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goTo,
      }),
    });
    const payloadResponse = (await response.json().catch(() => null)) as
      | { error?: string; redirectTo?: string }
      | null;
    setBusy(false);

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Gagal menyelesaikan onboarding",
        text: payloadResponse?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }

    router.replace(payloadResponse?.redirectTo || "/dashboard");
  };

  useEffect(() => {
    if (!normalizedUsername || normalizedUsername.length < 3) {
      if (usernameCheckTimerRef.current) {
        clearTimeout(usernameCheckTimerRef.current);
      }
      return;
    }

    if (usernameCheckTimerRef.current) {
      clearTimeout(usernameCheckTimerRef.current);
    }

    usernameCheckTimerRef.current = setTimeout(async () => {
      setUsernameState((prev) => ({
        ...prev,
        checking: true,
      }));

      const response = await fetch(
        `/api/settings/check-slug?slug=${encodeURIComponent(normalizedUsername)}`
      );
      const payloadResponse = (await response.json().catch(() => null)) as
        | {
            available?: boolean;
            reason?: string;
            suggestion?: string;
            ownedByCurrentUser?: boolean;
          }
        | null;

      setUsernameState({
        checking: false,
        available: Boolean(payloadResponse?.available),
        reason: payloadResponse?.reason || "unknown",
        suggestion: payloadResponse?.suggestion || "",
        ownedByCurrentUser: payloadResponse?.ownedByCurrentUser,
      });
    }, 320);

    return () => {
      if (usernameCheckTimerRef.current) {
        clearTimeout(usernameCheckTimerRef.current);
      }
    };
  }, [normalizedUsername]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setDraftSaving(true);
    setLastDraftLabel("Menyimpan draft...");
    autoSaveTimerRef.current = setTimeout(async () => {
      const response = await saveProgress({});
      setDraftSaving(false);
      if (response.ok) {
        setLastDraftLabel("Draft tersimpan otomatis.");
      } else {
        setLastDraftLabel("Draft belum tersimpan. Coba lanjutkan lagi.");
      }
    }, 900);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    fullName,
    normalizedUsername,
    role,
    bio,
    image,
    coverImageUrl,
    firstLinkTitle,
    firstLinkUrl,
    firstLinkPlatform,
    firstLinkEnabled,
    wantsToAddFirstLink,
  ]);

  return (
    <div
      className={cn(
        embedded
          ? ""
          : "min-h-screen bg-[linear-gradient(180deg,#edf3ff_0%,#f8fbff_50%,#f1f6ff_100%)] px-4 py-6 sm:px-6 sm:py-8"
      )}
    >
      <div className={cn("mx-auto", embedded ? "max-w-none" : "max-w-6xl")}>
        <Card className="overflow-hidden border-[#cbddfd] bg-white/95 shadow-[0_24px_58px_rgba(33,78,149,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-[#dce8fb] bg-[#f4f8ff] p-4 lg:border-b-0 lg:border-r lg:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f77b4]">
                Onboarding
              </p>
              <h1 className="mt-2 text-xl font-semibold text-[#17305b]">Setup creator page</h1>
              <p className="mt-1 text-sm text-[#5e78a5]">
                Plan aktif: {planName.toUpperCase()}{" "}
                {typeof linkBuilderMax === "number"
                  ? `- Maks ${linkBuilderMax} link`
                  : "- Unlimited link"}
              </p>

              <div className="mt-4 grid grid-cols-4 gap-1.5 lg:hidden">
                {STEP_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "inline-flex min-w-0 items-center justify-center gap-1 rounded-full border px-2 py-1.5 text-[11px] font-semibold",
                      step === item.id
                        ? "border-[#2f73ff] bg-[#edf4ff] text-[#1f58e3]"
                        : step > item.id
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-[#d2dff7] bg-white text-[#6b83ad]"
                    )}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                      {step > item.id ? <Check className="h-3.5 w-3.5" /> : item.id}
                    </span>
                    <span className="hidden min-[360px]:inline">{item.title}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-[#4f77b4] lg:hidden">
                {STEP_ITEMS[stepIndex]?.title}
              </p>

              <div className="mt-5 hidden space-y-2 lg:block">
                {STEP_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2",
                      step === item.id
                        ? "border-[#2f73ff] bg-[#edf4ff]"
                        : step > item.id
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-[#d2dff7] bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                        step === item.id
                          ? "bg-[#2f73ff] text-white"
                          : step > item.id
                            ? "bg-emerald-600 text-white"
                            : "bg-[#edf4ff] text-[#4d6f9f]"
                      )}
                    >
                      {step > item.id ? <Check className="h-4 w-4" /> : item.id}
                    </span>
                    <p className="text-sm font-semibold text-[#26406a]">{item.title}</p>
                  </div>
                ))}
              </div>
            </aside>

            <section className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b79ab]">
                    Langkah {step} dari 4
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#17305b]">
                    {STEP_ITEMS[stepIndex]?.title}
                  </h2>
                </div>
                <p className="text-xs font-medium text-[#6380ad]">{lastDraftLabel}</p>
              </div>

              {step === 1 ? (
                <div className="mt-5 grid gap-3">
                  <div className="rounded-xl border border-[#d8e5fb] bg-[#f6f9ff] px-3 py-2 text-sm text-[#50709f]">
                    Data dari akun kamu sudah kami isi otomatis. Kamu bisa mengubahnya jika perlu.
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#35598e]">Nama / Display Name</label>
                    <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#35598e]">Username</label>
                    <Input
                      value={username}
                      onChange={(event) => setUsername(event.target.value.toLowerCase())}
                      placeholder="username-kamu"
                    />
                    <p className="mt-1 text-xs text-[#5f7da9]">
                      {resolvedUsernameState.checking
                        ? "Mengecek username..."
                        : resolvedUsernameState.reason === "owned_by_current_user"
                          ? "Username ini sudah terhubung ke akun kamu."
                          : resolvedUsernameState.available
                          ? "Username tersedia."
                          : resolvedUsernameState.reason === "taken"
                            ? `Username dipakai. ${resolvedUsernameState.suggestion ? `Saran: ${resolvedUsernameState.suggestion}` : ""}`
                            : "Username belum valid."}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#35598e]">Role / Profesi</label>
                    <Input value={role} onChange={(event) => setRole(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#35598e]">Bio singkat</label>
                    <Textarea
                      value={bio}
                      maxLength={240}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Ceritakan singkat tentang kamu."
                    />
                  </div>
                  <div className="rounded-xl border border-[#d8e5fb] bg-[#f9fbff]">
                    <button
                      type="button"
                      onClick={() => setOptionalMediaExpanded((prev) => !prev)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-[#35598e]"
                    >
                      <span>Foto & Cover (opsional)</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-[#4f73a8] transition-transform",
                          optionalMediaExpanded ? "rotate-180" : ""
                        )}
                      />
                    </button>
                    {optionalMediaExpanded ? (
                      <div className="grid gap-3 border-t border-[#d8e5fb] px-3 py-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-[#35598e]">
                            Foto profile
                          </label>
                          <Input
                            value={image}
                            onChange={(event) => setImage(event.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-[#35598e]">
                            Cover image
                          </label>
                          <Input
                            value={coverImageUrl}
                            onChange={(event) => setCoverImageUrl(event.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-[#35598e]">Mau tambahkan link pertama sekarang?</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setWantsToAddFirstLink(true)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                          wantsToAddFirstLink
                            ? "border-[#2f73ff] bg-[#edf4ff] text-[#1f58e3]"
                            : "border-[#d4e3fb] bg-white text-[#466692] hover:border-[#a9c6f5]"
                        )}
                      >
                        Tambahkan link pertama
                      </button>
                      <button
                        type="button"
                        onClick={() => setWantsToAddFirstLink(false)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                          !wantsToAddFirstLink
                            ? "border-[#2f73ff] bg-[#edf4ff] text-[#1f58e3]"
                            : "border-[#d4e3fb] bg-white text-[#466692] hover:border-[#a9c6f5]"
                        )}
                      >
                        Lewati dulu
                      </button>
                    </div>
                  </div>
                  {wantsToAddFirstLink ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-[#35598e]">
                          Pilih satu link utama yang ingin kamu tampilkan.
                        </p>
                        <div className="mt-2 grid gap-2 min-[360px]:grid-cols-2 lg:grid-cols-3">
                          {PLATFORM_OPTIONS.map((platform) => {
                            const Icon = platform.icon;
                            const active = firstLinkPlatform === platform.id;
                            return (
                              <button
                                key={platform.id}
                                type="button"
                                onClick={() => {
                                  setWantsToAddFirstLink(true);
                                  setFirstLinkPlatform(platform.id);
                                  if (!firstLinkTitle) {
                                    setFirstLinkTitle(platform.defaultTitle);
                                  }
                                }}
                                className={cn(
                                  "flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                                  active
                                    ? "border-[#2f73ff] bg-[#edf4ff] text-[#1f58e3]"
                                    : "border-[#d4e3fb] bg-white text-[#3e6399] hover:border-[#a9c6f5]"
                                )}
                              >
                                <span className="inline-flex min-w-0 items-center gap-2">
                                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2f73ff]">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <span className="truncate">{platform.title}</span>
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex h-4 w-4 shrink-0 rounded-full border",
                                    active ? "border-[#2f73ff] bg-[#2f73ff]" : "border-[#b9ccec]"
                                  )}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-[#35598e]">Judul tombol</label>
                          <Input value={firstLinkTitle} onChange={(event) => setFirstLinkTitle(event.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-[#35598e]">URL</label>
                          <Input
                            value={firstLinkUrl}
                            onChange={(event) => setFirstLinkUrl(event.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-[#3a5f98]">
                          <input
                            type="checkbox"
                            checked={firstLinkEnabled}
                            onChange={(event) => setFirstLinkEnabled(event.target.checked)}
                            className="h-4 w-4 rounded border-[#b8caea] text-[#2f73ff] focus:ring-[#2f73ff]"
                          />
                          Aktifkan link ini
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#b8cff4] bg-[#f8fbff] px-3 py-3 text-sm text-[#5d7da9]">
                      Kamu bisa lanjut ke preview tanpa menambahkan link sekarang.
                    </div>
                  )}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="mt-5 space-y-4">
                  <p className="text-sm text-[#5c79a8]">
                    Lihat tampilan awal halaman creator kamu sebelum masuk dashboard.
                  </p>
                  <div className="mx-auto max-w-[360px] rounded-[28px] border-[8px] border-[#0f172a] bg-[#0f172a] p-3 shadow-[0_22px_44px_rgba(16,41,85,0.25)]">
                    <div className="overflow-hidden rounded-[22px] bg-[#f8fbff]">
                      <div className="h-[104px] w-full bg-gradient-to-b from-[#dae8ff] to-[#a3c5ff]">
                        {coverImageUrl ? (
                          <img
                            src={coverImageUrl}
                            alt="Cover preview"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="px-4 pb-5">
                        <div className="-mt-8 mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#2f73ff] text-white">
                          {image ? (
                            <img src={image} alt="Avatar preview" className="h-full w-full object-cover" />
                          ) : (
                            <UserRound className="h-6 w-6" />
                          )}
                        </div>
                        <p className="mt-3 text-center text-lg font-semibold text-[#17305b]">
                          {fullName || "Display Name"}
                        </p>
                        <p className="mt-1 text-center text-sm text-[#5f7ca8]">
                          {role || "Role / profession"}
                        </p>
                        <p className="mt-3 rounded-xl border border-[#d5e3fb] bg-white px-3 py-2 text-sm font-medium text-[#23457b]">
                          {bio || "Bio singkat akan muncul di sini."}
                        </p>
                        <div className="mt-3 rounded-xl border border-[#d5e3fb] bg-white px-3 py-2">
                          <p className="flex items-center gap-2 text-sm font-semibold text-[#23457b]">
                            <Link2 className="h-4 w-4 text-[#2f73ff]" />
                            {wantsToAddFirstLink
                              ? firstLinkTitle || "Link pertama kamu"
                              : "Belum ada link pertama"}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#5f7ca8]">
                            {wantsToAddFirstLink
                              ? normalizeSocialUrl(firstLinkUrl) || "https://..."
                              : "Kamu bisa menambahkannya nanti dari dashboard."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-[#d6e5fb] bg-[#f5f9ff] p-4">
                    <p className="text-sm font-semibold text-[#1f58e3]">Halaman creator kamu siap</p>
                    <p className="mt-1 text-sm text-[#5e79a6]">
                      Kamu bisa lanjut mengatur link, upload video, atau melihat dashboard.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button onClick={() => void handleComplete("dashboard")} disabled={busy}>
                      {busy ? "Memproses..." : "Masuk Dashboard"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void handleComplete("build-link")}
                      disabled={busy}
                    >
                      Lanjut Edit Build Link
                    </Button>
                  </div>
                </div>
              ) : null}

              {step < 4 ? (
                <div className="sticky bottom-0 z-10 mt-6 border-t border-[#d5e3fb] bg-white/95 pt-3 backdrop-blur">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {step > 1 ? (
                        <Button
                          variant="secondary"
                          onClick={handleBack}
                          disabled={busy}
                          className="min-h-10 px-3"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Back
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        onClick={() => void handleSkip()}
                        disabled={busy}
                        className="min-h-10 px-2 text-xs sm:text-sm"
                      >
                        {step === 2 ? "Lewati langkah link" : "Saya mengisinya nanti"}
                      </Button>
                    </div>
                    <Button
                      onClick={() => void handleNext()}
                      disabled={busy || draftSaving}
                      className="min-h-11 w-full sm:w-auto"
                    >
                      {busy ? "Menyimpan..." : "Next"}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
