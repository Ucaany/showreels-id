"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Link2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddLinkModal } from "@/components/build-link/add-link-modal/AddLinkModal";
import { cn } from "@/lib/cn";
import type { CustomLinkItem } from "@/lib/profile-utils";

type Props = {
  initialData: {
    name: string;
    email: string;
    username: string;
  };
};

type Step = "identity" | "bio" | "links" | "done";

const STEPS: Step[] = ["identity", "bio", "links", "done"];

const STEP_LABELS: Record<Step, string> = {
  identity: "Identitas",
  bio: "Bio",
  links: "Link",
  done: "Selesai",
};

export function OnboardingWizard({ initialData }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("identity");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [name, setName] = useState(initialData.name);
  const [username, setUsername] = useState(initialData.username);
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<CustomLinkItem[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goNext = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
      setError("");
    }
  }, [stepIndex]);

  const goBack = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
      setError("");
    }
  }, [stepIndex]);

  const handleNext = async () => {
    setError("");

    // Validation for identity step
    if (currentStep === "identity") {
      if (!name.trim()) {
        setError("Nama tidak boleh kosong");
        return;
      }
      if (!username.trim()) {
        setError("Username tidak boleh kosong");
        return;
      }
      if (!/^[a-z0-9_]+$/.test(username.trim())) {
        setError("Username hanya boleh huruf kecil, angka, dan underscore");
        return;
      }
      if (username.trim().length < 3) {
        setError("Username minimal 3 karakter");
        return;
      }
    }

    goNext();
  };

  const handleSkip = () => {
    goNext();
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error || "Gagal menyimpan profil. Coba lagi.");
        setSaving(false);
        return;
      }

      // Mark onboarding as complete
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});

      // Redirect to dashboard
      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setSaving(false);
    }
  };

  const handleLinkCreated = (newLinks: CustomLinkItem[]) => {
    setLinks((prev) => [...prev, ...newLinks]);
    setShowAddLink(false);
  };

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Progress Bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-zinc-100">
        <div
          className="h-full bg-zinc-900 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Indicator */}
      <div className="fixed inset-x-0 top-4 z-50 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-zinc-100/90 px-4 py-1.5 backdrop-blur-sm">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                  i < stepIndex
                    ? "bg-zinc-900 text-white"
                    : i === stepIndex
                      ? "bg-zinc-900 text-white ring-2 ring-zinc-900/20"
                      : "bg-zinc-200 text-zinc-500"
                )}
              >
                {i < stepIndex ? (
                  <Check className="h-3 w-3" />
                ) : (
                  i + 1
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-4 rounded-full transition-all",
                    i < stepIndex ? "bg-zinc-900" : "bg-zinc-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="w-full max-w-md">
          {/* Step 1: Identity (Name + Username) */}
          {currentStep === "identity" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <User className="h-6 w-6 text-zinc-700" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-950">
                  Buat profil kamu
                </h1>
                <p className="mt-2 text-sm text-zinc-500">
                  Isi nama dan pilih username untuk halaman publik kamu.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600">
                    Nama Lengkap
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap kamu"
                    className="h-12 rounded-xl border-zinc-200 text-base font-semibold"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600">
                    Username
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                      @
                    </span>
                    <Input
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                        )
                      }
                      placeholder="username_kamu"
                      className="h-12 rounded-xl border-zinc-200 pl-9 text-base font-semibold"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-400">
                    showreels.id/
                    <span className="font-semibold text-zinc-600">
                      {username || "username"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Bio */}
          {currentStep === "bio" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <span className="text-xl">✍️</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-950">
                  Tulis bio singkat
                </h1>
                <p className="mt-2 text-sm text-zinc-500">
                  Ceritakan sedikit tentang diri kamu. Bisa diubah nanti.
                </p>
              </div>

              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contoh: Video editor profesional dengan 5 tahun pengalaman di bidang wedding dan commercial..."
                className="min-h-36 rounded-xl border-zinc-200 text-sm leading-relaxed"
                maxLength={300}
                autoFocus
              />
              <p className="mt-2 text-right text-xs text-zinc-400">
                {bio.length}/300
              </p>
            </div>
          )}

          {/* Step 3: Links */}
          {currentStep === "links" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <Link2 className="h-6 w-6 text-zinc-700" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-950">
                  Tambah link
                </h1>
                <p className="mt-2 text-sm text-zinc-500">
                  Tambahkan link sosial media atau website kamu.
                </p>
              </div>

              {links.length > 0 && (
                <div className="mb-4 space-y-2">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                    >
                      <Link2 className="h-4 w-4 shrink-0 text-zinc-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {link.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {link.url}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLink(link.id)}
                        className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
                        aria-label="Hapus link"
                      >
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                className="w-full rounded-xl border-dashed"
                onClick={() => setShowAddLink(true)}
              >
                + Tambah Link
              </Button>

              <AddLinkModal
                open={showAddLink}
                onClose={() => setShowAddLink(false)}
                onCreated={handleLinkCreated}
                isLimitReached={false}
                maxLinksLabel="5"
                planName="free"
                draftMode
              />
            </div>
          )}

          {/* Step 4: Done */}
          {currentStep === "done" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-950">
                Semua siap! 🎉
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Profil kamu sudah dibuat. Kamu bisa langsung mulai menggunakan
                dashboard.
              </p>
              <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Profil kamu
                </p>
                <p className="mt-2 text-xl font-black text-zinc-950">{name}</p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  showreels.id/{username}
                </p>
                {bio && (
                  <p className="mt-3 text-xs leading-5 text-zinc-600 line-clamp-2">
                    {bio}
                  </p>
                )}
                {links.length > 0 && (
                  <p className="mt-2 text-xs text-zinc-400">
                    {links.length} link ditambahkan
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-4">
          {/* Back */}
          {stepIndex > 0 && currentStep !== "done" ? (
            <Button
              type="button"
              variant="ghost"
              className="gap-1.5 text-zinc-600"
              onClick={goBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {/* Skip / Next / Finish */}
          <div className="flex items-center gap-2">
            {/* Skip button - only for bio and links steps */}
            {(currentStep === "bio" || currentStep === "links") && (
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-500"
                onClick={handleSkip}
              >
                Skip
              </Button>
            )}

            {currentStep === "done" ? (
              <Button
                type="button"
                className="gap-1.5 rounded-xl bg-zinc-900 px-6 text-white hover:bg-zinc-800"
                onClick={handleFinish}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Masuk Dashboard"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="gap-1.5 rounded-xl bg-zinc-900 px-6 text-white hover:bg-zinc-800"
                onClick={handleNext}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
