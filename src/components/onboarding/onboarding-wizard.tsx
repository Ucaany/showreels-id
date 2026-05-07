"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Link2, Sparkles, User } from "lucide-react";
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

type Step = "name" | "role" | "username" | "bio" | "links" | "done";

const STEPS: Step[] = ["name", "role", "username", "bio", "links", "done"];

const ROLE_OPTIONS = [
  "Video Editor",
  "Videografer",
  "Content Creator",
  "Motion Designer",
  "Filmmaker",
  "Animator",
  "Photographer",
  "Graphic Designer",
  "UI/UX Designer",
  "Social Media Manager",
  "Lainnya",
];

export function OnboardingWizard({ initialData }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("name");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [name, setName] = useState(initialData.name);
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
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

    // Validation per step
    if (currentStep === "name" && !name.trim()) {
      setError("Nama tidak boleh kosong");
      return;
    }
    if (currentStep === "username" && !username.trim()) {
      setError("Username tidak boleh kosong");
      return;
    }
    if (currentStep === "username" && !/^[a-z0-9_]+$/.test(username.trim())) {
      setError("Username hanya boleh huruf kecil, angka, dan underscore");
      return;
    }

    goNext();
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");

    try {
      const finalRole = role === "Lainnya" ? customRole : role;
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          role: finalRole.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        setError(data?.error || "Gagal menyimpan profil. Coba lagi.");
        setSaving(false);
        return;
      }

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

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Progress Bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-zinc-100">
        <div
          className="h-full bg-zinc-900 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Counter */}
      <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2">
        <p className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
          {stepIndex + 1} / {STEPS.length}
        </p>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-5 py-20">
        <div className="w-full max-w-md">
          {/* Step: Name */}
          {currentStep === "name" && (
            <div className="animate-in fade-in duration-200">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <User className="h-6 w-6 text-zinc-700" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-950">Siapa nama kamu?</h1>
                <p className="mt-2 text-sm text-zinc-500">Nama ini akan ditampilkan di profil publik kamu.</p>
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                className="h-12 rounded-xl border-zinc-200 text-center text-lg font-semibold"
                autoFocus
              />
            </div>
          )}

          {/* Step: Role */}
          {currentStep === "role" && (
            <div className="animate-in fade-in duration-200">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <Sparkles className="h-6 w-6 text-zinc-700" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-950">Apa peran kamu?</h1>
                <p className="mt-2 text-sm text-zinc-500">Pilih yang paling menggambarkan pekerjaan kamu.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
                      role === option
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {role === "Lainnya" && (
                <Input
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Tulis peran kamu..."
                  className="mt-3 h-11 rounded-xl"
                  autoFocus
                />
              )}
            </div>
          )}

          {/* Step: Username */}
          {currentStep === "username" && (
            <div className="animate-in fade-in duration-200">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <span className="text-lg font-black text-zinc-700">@</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-950">Pilih username</h1>
                <p className="mt-2 text-sm text-zinc-500">URL profil kamu: showreels.id/<span className="font-semibold">{username || "username"}</span></p>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">@</span>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="username_kamu"
                  className="h-12 rounded-xl border-zinc-200 pl-9 text-lg font-semibold"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step: Bio */}
          {currentStep === "bio" && (
            <div className="animate-in fade-in duration-200">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <Sparkles className="h-6 w-6 text-zinc-700" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-950">Tulis bio singkat</h1>
                <p className="mt-2 text-sm text-zinc-500">Ceritakan sedikit tentang diri kamu (opsional).</p>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contoh: Video editor profesional dengan 5 tahun pengalaman di bidang wedding dan commercial..."
                className="min-h-32 rounded-xl border-zinc-200 text-sm"
                maxLength={300}
                autoFocus
              />
              <p className="mt-2 text-right text-xs text-zinc-400">{bio.length}/300</p>
            </div>
          )}

          {/* Step: Links */}
          {currentStep === "links" && (
            <div className="animate-in fade-in duration-200">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <Link2 className="h-6 w-6 text-zinc-700" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-950">Tambah link</h1>
                <p className="mt-2 text-sm text-zinc-500">Tambahkan link sosial media atau website kamu (opsional).</p>
              </div>

              {links.length > 0 && (
                <div className="mb-4 space-y-2">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <Link2 className="h-4 w-4 shrink-0 text-zinc-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900">{link.title}</p>
                        <p className="truncate text-xs text-zinc-500">{link.url}</p>
                      </div>
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

          {/* Step: Done */}
          {currentStep === "done" && (
            <div className="animate-in fade-in duration-200 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-950">Semua siap! 🎉</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Profil kamu sudah dibuat. Kamu bisa langsung mulai menggunakan dashboard untuk mengelola portfolio dan bio link.
              </p>
              <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-semibold text-zinc-500">Profil kamu</p>
                <p className="mt-1 text-lg font-black text-zinc-950">{name}</p>
                <p className="text-sm text-zinc-600">{role === "Lainnya" ? customRole : role}</p>
                <p className="mt-1 text-xs text-zinc-400">showreels.id/{username}</p>
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
            {currentStep !== "done" && currentStep !== "name" && currentStep !== "username" && (
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-500"
                onClick={goNext}
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
