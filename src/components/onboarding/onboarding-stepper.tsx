"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  UserRound,
} from "lucide-react";
import type { DbUserOnboarding } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { normalizeSocialUrl } from "@/lib/profile-utils";
import { sanitizeUsername } from "@/lib/username-rules";

type UsernameAvailability = {
  checking: boolean;
  available: boolean;
  reason: string;
  suggestion: string;
};

const STEP_ITEMS = [
  { id: 1, title: "Informasi akun" },
  { id: 2, title: "Buat link pertama" },
  { id: 3, title: "Preview halaman" },
  { id: 4, title: "Selesai" },
] as const;

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
  planName: "free" | "pro" | "business";
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
        })
      : {};
  const payloadFirstLink =
    payload.firstLink && typeof payload.firstLink === "object"
      ? (payload.firstLink as {
          title?: string;
          url?: string;
          platform?: string;
        })
      : {};

  const [step, setStep] = useState(Math.min(4, Math.max(1, initialStatus.currentStep || 1)));
  const [fullName, setFullName] = useState(payloadProfile.fullName || initialUser.fullName);
  const [username, setUsername] = useState(payloadProfile.username || initialUser.username);
  const [role, setRole] = useState(payloadProfile.role || initialUser.role);
  const [bio, setBio] = useState(payloadProfile.bio || initialUser.bio);
  const [firstLinkTitle, setFirstLinkTitle] = useState(payloadFirstLink.title || "");
  const [firstLinkUrl, setFirstLinkUrl] = useState(payloadFirstLink.url || "");
  const [firstLinkPlatform, setFirstLinkPlatform] = useState(payloadFirstLink.platform || "");
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
  }) => {
    const response = await fetch("/api/onboarding/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentStep: input.currentStep ?? step,
        createFirstLink: input.createFirstLink ?? false,
        profile: {
          fullName,
          username: normalizedUsername,
          role,
          bio,
        },
        firstLink: {
          title: firstLinkTitle,
          url: normalizeSocialUrl(firstLinkUrl),
          platform: firstLinkPlatform,
        },
        progressPayload: {
          profile: {
            fullName,
            username: normalizedUsername,
            role,
            bio,
          },
          firstLink: {
            title: firstLinkTitle,
            url: firstLinkUrl,
            platform: firstLinkPlatform,
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
    if (!firstLinkTitle.trim() || !normalizeSocialUrl(firstLinkUrl)) {
      await showFeedbackAlert({
        title: "Link pertama belum lengkap",
        text: "Isi judul dan URL link pertama untuk lanjut.",
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

    setBusy(true);
    const response = await saveProgress({
      currentStep: Math.min(4, step + 1),
      createFirstLink: step === 2,
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
        `/api/public/username-availability?username=${encodeURIComponent(normalizedUsername)}`
      );
      const payloadResponse = (await response.json().catch(() => null)) as
        | { available?: boolean; reason?: string; suggestion?: string }
        | null;

      setUsernameState({
        checking: false,
        available: Boolean(payloadResponse?.available),
        reason: payloadResponse?.reason || "unknown",
        suggestion: payloadResponse?.suggestion || "",
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
  }, [step, fullName, normalizedUsername, role, bio, firstLinkTitle, firstLinkUrl, firstLinkPlatform]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf3ff_0%,#f8fbff_50%,#f1f6ff_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <Card className="overflow-hidden border-[#cbddfd] bg-white/95 shadow-[0_24px_58px_rgba(33,78,149,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-[#dce8fb] bg-[#f4f8ff] p-4 lg:border-b-0 lg:border-r lg:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f77b4]">
                Onboarding
              </p>
              <h1 className="mt-2 text-xl font-semibold text-[#17305b]">
                Setup creator page
              </h1>
              <p className="mt-1 text-sm text-[#5e78a5]">
                Plan aktif: {planName.toUpperCase()} {typeof linkBuilderMax === "number" ? `· Maks ${linkBuilderMax} link` : "· Unlimited link"}
              </p>

              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
                {STEP_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className={`inline-flex min-w-[112px] items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      step === item.id
                        ? "border-[#2f73ff] bg-[#edf4ff] text-[#1f58e3]"
                        : step > item.id
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-[#d2dff7] bg-white text-[#6b83ad]"
                    }`}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                      {step > item.id ? <Check className="h-3.5 w-3.5" /> : item.id}
                    </span>
                    {item.title}
                  </div>
                ))}
              </div>

              <div className="mt-5 hidden space-y-2 lg:block">
                {STEP_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                      step === item.id
                        ? "border-[#2f73ff] bg-[#edf4ff]"
                        : step > item.id
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-[#d2dff7] bg-white"
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        step === item.id
                          ? "bg-[#2f73ff] text-white"
                          : step > item.id
                            ? "bg-emerald-600 text-white"
                            : "bg-[#edf4ff] text-[#4d6f9f]"
                      }`}
                    >
                      {step > item.id ? <Check className="h-4 w-4" /> : item.id}
                    </span>
                    <p className="text-sm font-semibold text-[#26406a]">{item.title}</p>
                  </div>
                ))}
              </div>
            </aside>

            <section className="p-4 pb-24 sm:p-5 sm:pb-24 lg:pb-6">
              <div className="flex items-start justify-between gap-3">
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
                </div>
              ) : null}

              {step === 2 ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-[#35598e]">Pilih jenis link</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        "Website",
                        "Instagram",
                        "YouTube",
                        "WhatsApp",
                        "Portfolio Video",
                        "Custom Link",
                      ].map((platform) => (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => {
                            setFirstLinkPlatform(platform);
                            if (!firstLinkTitle) {
                              setFirstLinkTitle(platform === "Portfolio Video" ? "Lihat Portfolio Video" : platform);
                            }
                          }}
                          className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                            firstLinkPlatform === platform
                              ? "border-[#2f73ff] bg-[#edf4ff] text-[#1f58e3]"
                              : "border-[#d4e3fb] bg-white text-[#3e6399] hover:border-[#a9c6f5]"
                          }`}
                        >
                          {platform}
                        </button>
                      ))}
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
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="mt-5 space-y-4">
                  <p className="text-sm text-[#5c79a8]">
                    Ini preview ringkas halaman bio kamu sebelum selesai onboarding.
                  </p>
                  <div className="mx-auto max-w-[340px] rounded-[28px] border-[8px] border-[#0f172a] bg-[#0f172a] p-3 shadow-[0_22px_44px_rgba(16,41,85,0.25)]">
                    <div className="rounded-[22px] bg-[#f8fbff] px-4 pb-5 pt-8">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2f73ff] text-white">
                        <UserRound className="h-6 w-6" />
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
                          {firstLinkTitle || "Link pertama kamu"}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#5f7ca8]">
                          {normalizeSocialUrl(firstLinkUrl) || "https://..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-[#d6e5fb] bg-[#f5f9ff] p-4">
                    <p className="text-sm font-semibold text-[#1f58e3]">Halaman creator kamu siap.</p>
                    <p className="mt-1 text-sm text-[#5e79a6]">
                      Kamu bisa langsung masuk dashboard atau lanjut edit halaman Build Link.
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
            </section>
          </div>
        </Card>
      </div>

      {step < 4 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d5e3fb] bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={busy || step === 1}
              className="min-h-11 flex-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => void handleNext()} disabled={busy || draftSaving} className="min-h-11 flex-1">
              {busy ? "Menyimpan..." : "Next"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {step < 4 ? (
        <div className="hidden lg:fixed lg:inset-x-0 lg:bottom-0 lg:block lg:border-t lg:border-[#d5e3fb] lg:bg-white/95 lg:p-3 lg:backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-2">
            <Button variant="secondary" onClick={handleBack} disabled={busy || step === 1}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => void handleNext()} disabled={busy || draftSaving}>
              {busy ? "Menyimpan..." : "Next"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
