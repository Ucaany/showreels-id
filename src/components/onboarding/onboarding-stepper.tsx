"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
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

type PlatformOption = {
  id: string;
  title: string;
  icon: LucideIcon | IconType;
  defaultTitle: string;
  inputLabel: string;
  inputPlaceholder: string;
  helperText: string;
  brandClassName?: string;
};

const PLATFORM_OPTIONS: PlatformOption[] = [
  { id: "Website", title: "Website", icon: Globe, defaultTitle: "Kunjungi Website", inputLabel: "URL Website", inputPlaceholder: "websitekamu.com", helperText: "Isi domain atau URL website. Contoh: websitekamu.com", brandClassName: "text-sky-600" },
  { id: "Instagram", title: "Instagram", icon: SiInstagram, defaultTitle: "Follow Instagram", inputLabel: "Username Instagram", inputPlaceholder: "username", helperText: "Cukup isi username tanpa @. Link otomatis menjadi instagram.com/username", brandClassName: "text-pink-600" },
  { id: "YouTube", title: "YouTube", icon: SiYoutube, defaultTitle: "Lihat YouTube", inputLabel: "Channel / Username YouTube", inputPlaceholder: "@channel atau channel URL", helperText: "Isi @handle, nama channel, atau URL YouTube.", brandClassName: "text-red-600" },
  { id: "WhatsApp", title: "WhatsApp", icon: MessageCircle, defaultTitle: "Hubungi WhatsApp", inputLabel: "Nomor WhatsApp", inputPlaceholder: "6281234567890", helperText: "Isi nomor dengan kode negara. Contoh: 6281234567890", brandClassName: "text-emerald-600" },
  { id: "TikTok", title: "TikTok", icon: SiTiktok, defaultTitle: "Lihat TikTok", inputLabel: "Username TikTok", inputPlaceholder: "username", helperText: "Cukup isi username tanpa @. Link otomatis menjadi tiktok.com/@username", brandClassName: "text-slate-950" },
  { id: "Custom Link", title: "Custom Link", icon: Link2, defaultTitle: "Buka Link", inputLabel: "URL Custom", inputPlaceholder: "https://...", helperText: "Isi URL lengkap atau domain custom.", brandClassName: "text-slate-700" },
  { id: "Portfolio Video", title: "Portfolio Video", icon: PlayCircle, defaultTitle: "Lihat Portfolio Video", inputLabel: "URL Portfolio Video", inputPlaceholder: "youtube.com/watch?v=...", helperText: "Isi link video portfolio dari YouTube, Vimeo, TikTok, atau website lain.", brandClassName: "text-violet-600" },
];

function getPlatformOption(platformId: string) {
  return PLATFORM_OPTIONS.find((platform) => platform.id === platformId) ?? null;
}

function sanitizeSocialHandle(input: string) {
  return input.trim().replace(/^@+/, "").replace(/^https?:\/\/(www\.)?/i, "").split(/[/?#]/)[0];
}

function buildPlatformUrl(platformId: string, rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (platformId === "Instagram") {
    const handle = sanitizeSocialHandle(value).replace(/^instagram\.com\//i, "");
    return handle ? `https://instagram.com/${handle}` : "";
  }

  if (platformId === "TikTok") {
    const handle = sanitizeSocialHandle(value).replace(/^tiktok\.com\/@?/i, "");
    return handle ? `https://www.tiktok.com/@${handle}` : "";
  }

  if (platformId === "YouTube") {
    const handle = value.trim();
    if (handle.startsWith("@")) return `https://www.youtube.com/${handle}`;
    const cleanHandle = sanitizeSocialHandle(handle).replace(/^youtube\.com\//i, "").replace(/^youtu\.be\//i, "");
    return cleanHandle ? `https://www.youtube.com/@${cleanHandle.replace(/^@+/, "")}` : "";
  }

  if (platformId === "WhatsApp") {
    const phone = value.replace(/[^0-9]/g, "");
    return phone ? `https://wa.me/${phone}` : "";
  }

  return normalizeSocialUrl(value);
}

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
  subscriptionStatus,
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
  subscriptionStatus?: "active" | "trial" | "expired" | "failed" | "pending";
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
  const selectedPlatform = getPlatformOption(firstLinkPlatform);
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
    const normalizedFirstLinkUrl = buildPlatformUrl(firstLinkPlatform, firstLinkUrl);
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

    const normalizedUrl = buildPlatformUrl(firstLinkPlatform, firstLinkUrl);
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
    <div className="min-h-screen bg-slate-50 px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="mx-auto h-full max-w-7xl">
        <div className="grid min-h-[calc(100vh-1.5rem)] gap-4 sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[340px_1fr]">
          <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="rounded-2xl bg-zinc-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Onboarding</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">Setup singkat halaman creator</h1>
              <p className="mt-2 text-sm leading-6 text-white/70">Lengkapi profil, tambah link pertama, lalu preview sebelum masuk dashboard.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white/80">
                <span className="rounded-full bg-white/10 px-2.5 py-1">{planName.toUpperCase()}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1">{typeof linkBuilderMax === "number" ? `Maks ${linkBuilderMax} link` : "Unlimited link"}</span>
                {planName === "creator" && subscriptionStatus === "trial" ? <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-100">Trial aktif</span> : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {STEP_ITEMS.map((item) => (
                <button key={item.id} type="button" onClick={() => item.id < step && setStep(item.id)} className={cn("flex min-h-16 items-center gap-3 rounded-2xl border p-3 text-left transition", step === item.id ? "border-zinc-900 bg-slate-50 text-slate-950" : step > item.id ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70" : "border-slate-200 bg-white text-slate-500")}>
                  <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold", step === item.id ? "bg-zinc-900 text-white" : step > item.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500")}>{step > item.id ? <Check className="h-4 w-4" /> : item.id}</span>
                  <span className="min-w-0"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block text-xs opacity-70">{step === item.id ? "Sedang diisi" : step > item.id ? "Selesai" : "Berikutnya"}</span></span>
                </button>
              ))}
            </div>

            <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Auto-save</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{lastDraftLabel}</p>
            </div>
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 lg:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Langkah {step} dari 4</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{STEP_ITEMS[stepIndex]?.title}</h2></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 sm:mt-3 sm:w-40"><div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${(step / STEP_ITEMS.length) * 100}%` }} /></div>
            </div>

            {step === 1 ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2"><p className="text-sm font-medium text-slate-700">Data akun sudah diisi otomatis. Rapikan bagian penting saja agar halaman publik siap dibagikan.</p></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Nama / Display Name</label><Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Username</label><Input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="username-kamu" /><p className="mt-1 text-xs text-slate-500">{resolvedUsernameState.checking ? "Mengecek username..." : resolvedUsernameState.reason === "owned_by_current_user" ? "Username ini sudah terhubung ke akun kamu." : resolvedUsernameState.available ? "Username tersedia." : resolvedUsernameState.reason === "taken" ? `Username dipakai. ${resolvedUsernameState.suggestion ? `Saran: ${resolvedUsernameState.suggestion}` : ""}` : "Username belum valid."}</p></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Role / Profesi</label><Input value={role} onChange={(event) => setRole(event.target.value)} /></div>
                <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Bio singkat</label><Textarea value={bio} maxLength={240} onChange={(event) => setBio(event.target.value)} placeholder="Ceritakan singkat tentang kamu." className="min-h-24" /></div>
                <div className="rounded-2xl border border-slate-200 bg-white lg:col-span-2"><button type="button" onClick={() => setOptionalMediaExpanded((prev) => !prev)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800"><span>Foto & Cover opsional</span><ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", optionalMediaExpanded ? "rotate-180" : "")} /></button>{optionalMediaExpanded ? <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Foto profile</label><Input value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://..." /></div><div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Cover image</label><Input value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="https://..." /></div></div> : null}</div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-900">Tambah link pertama?</p><p className="mt-1 text-sm leading-6 text-slate-500">Pilih satu link utama. Kamu tetap bisa melewati langkah ini dan menambahkannya nanti.</p><div className="mt-4 grid gap-2"><button type="button" onClick={() => setWantsToAddFirstLink(true)} className={cn("rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition", wantsToAddFirstLink ? "border-zinc-900 bg-white text-slate-950" : "border-slate-200 bg-white text-slate-600")}>Tambahkan link</button><button type="button" onClick={() => setWantsToAddFirstLink(false)} className={cn("rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition", !wantsToAddFirstLink ? "border-zinc-900 bg-white text-slate-950" : "border-slate-200 bg-white text-slate-600")}>Lewati dulu</button></div></div>
                {wantsToAddFirstLink ? <div className="space-y-4"><div className="grid gap-2 min-[360px]:grid-cols-2 lg:grid-cols-3">{PLATFORM_OPTIONS.map((platform) => { const Icon = platform.icon; const active = firstLinkPlatform === platform.id; return <button key={platform.id} type="button" onClick={() => { setWantsToAddFirstLink(true); setFirstLinkPlatform(platform.id); setFirstLinkTitle(platform.defaultTitle); }} className={cn("flex min-h-12 items-center gap-2 rounded-2xl border p-3 text-left text-sm font-semibold transition", active ? "border-zinc-900 bg-slate-50 text-slate-950" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200"><Icon className={cn("h-4 w-4", platform.brandClassName)} /></span><span className="truncate">{platform.title}</span></button>; })}</div><div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Judul tombol</label><Input value={firstLinkTitle} onChange={(event) => setFirstLinkTitle(event.target.value)} /></div><div><label className="mb-1.5 block text-sm font-semibold text-slate-700">{selectedPlatform?.inputLabel || "URL"}</label><Input value={firstLinkUrl} onChange={(event) => setFirstLinkUrl(event.target.value)} placeholder={selectedPlatform?.inputPlaceholder || "https://..."} /><p className="mt-1 text-xs text-slate-500">{selectedPlatform?.helperText || "Pilih platform agar format link otomatis disesuaikan."}</p>{firstLinkPlatform && firstLinkUrl.trim() ? <p className="mt-1 truncate text-xs font-medium text-slate-700">Preview: {buildPlatformUrl(firstLinkPlatform, firstLinkUrl) || "Belum valid"}</p> : null}</div></div><label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={firstLinkEnabled} onChange={(event) => setFirstLinkEnabled(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-zinc-900 focus:ring-zinc-900" />Aktifkan link ini</label></div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Link pertama dilewati. Kamu bisa lanjut ke preview.</div>}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="grid gap-3 sm:grid-cols-2">{[["Nama", fullName || "Display Name"], ["Username", normalizedUsername ? `showreels.id/${normalizedUsername}` : "Belum valid"], ["Role", role || "Role / profession"], ["Link", wantsToAddFirstLink ? firstLinkTitle || "Link pertama" : "Belum ada link"]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 truncate text-sm font-semibold text-slate-900">{value}</p></div>)}</div>
                <div className="mx-auto w-full max-w-[320px] rounded-[28px] border-[8px] border-zinc-950 bg-zinc-950 p-3 shadow-sm"><div className="overflow-hidden rounded-[22px] bg-slate-50"><div className="h-[92px] w-full bg-gradient-to-b from-slate-200 to-slate-300">{coverImageUrl ? <img src={coverImageUrl} alt="Cover preview" className="h-full w-full object-cover" /> : null}</div><div className="px-4 pb-5"><div className="-mt-8 mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-zinc-900 text-white">{image ? <img src={image} alt="Avatar preview" className="h-full w-full object-cover" /> : <UserRound className="h-6 w-6" />}</div><p className="mt-3 text-center text-lg font-semibold text-slate-900">{fullName || "Display Name"}</p><p className="mt-1 text-center text-sm text-slate-500">{role || "Role / profession"}</p><p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">{bio || "Bio singkat akan muncul di sini."}</p><div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2"><p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Link2 className="h-4 w-4" />{wantsToAddFirstLink ? firstLinkTitle || "Link pertama kamu" : "Belum ada link"}</p><p className="mt-1 truncate text-xs text-slate-500">{wantsToAddFirstLink ? buildPlatformUrl(firstLinkPlatform, firstLinkUrl) || "https://..." : "Tambahkan nanti dari dashboard."}</p></div></div></div></div>
              </div>
            ) : null}

            {step === 4 ? <div className="mt-4 grid gap-4 lg:grid-cols-3"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 lg:col-span-2"><span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Check className="h-5 w-5" /></span><h3 className="mt-4 text-xl font-semibold text-slate-950">Halaman creator kamu siap</h3><p className="mt-2 text-sm leading-6 text-slate-600">Lanjut ke dashboard untuk mengatur link, upload video, dan membaca analytics.</p></div><div className="grid content-start gap-2"><Button onClick={() => void handleComplete("dashboard")} disabled={busy} className="min-h-11">{busy ? "Memproses..." : "Masuk Dashboard"}</Button><Button variant="secondary" onClick={() => void handleComplete("build-link")} disabled={busy} className="min-h-11">Lanjut Edit Build Link</Button></div></div> : null}

            {step < 4 ? <div className="sticky bottom-0 z-10 mt-5 border-t border-slate-200 bg-white/95 pt-4 backdrop-blur"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2">{step > 1 ? <Button variant="secondary" onClick={handleBack} disabled={busy} className="min-h-10 px-3"><ChevronLeft className="h-4 w-4" />Back</Button> : null}<Button variant="ghost" onClick={() => void handleSkip()} disabled={busy} className="min-h-10 px-2 text-xs sm:text-sm">{step === 2 ? "Lewati langkah link" : "Saya mengisinya nanti"}</Button></div><Button onClick={() => void handleNext()} disabled={busy || draftSaving} className="min-h-11 w-full sm:w-auto">{busy ? "Menyimpan..." : "Next"}<ChevronRight className="h-4 w-4" /></Button></div></div> : null}
          </section>
        </div>
      </div>
    </div>
  );
}

