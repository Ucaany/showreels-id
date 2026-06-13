"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe2,
  Image as ImageIcon,
  Link2,
  Loader2,
  UploadCloud,
  UserRound,
  Video,
} from "lucide-react";
import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { normalizeSocialUrl } from "@/lib/profile-utils";
import {
  detectVideoSource,
  getAutoThumbnailFromVideoUrl,
  normalizeHttpUrl,
} from "@/lib/video-utils";
import { sanitizeUsername } from "@/lib/username-rules";

type SocialLinks = {
  instagram: string;
  tiktok: string;
  youtube: string;
  website: string;
};

type Props = {
  initialData: {
    name: string;
    email: string;
    username: string;
    bio: string;
    socialLinks: SocialLinks;
    currentStep: number;
    hasPortfolio: boolean;
    publicProfilePath: string;
  };
};

type Step = 1 | 2 | 3 | 4;
type PortfolioMode = "url" | "upload";
type UploadResult = {
  url: string;
  mediaType: "video" | "image";
  previewImage: string;
};

type UsernameAvailability = {
  checking: boolean;
  available: boolean;
  reason: "idle" | "invalid" | "available" | "taken" | "reserved" | "owned_by_current_user";
  suggestion?: string;
};

const STEPS = [
  { id: 1, label: "Bio", icon: UserRound },
  { id: 2, label: "Link", icon: Link2 },
  { id: 3, label: "Portfolio", icon: UploadCloud },
  { id: 4, label: "Finish", icon: Check },
] as const;

const SOCIAL_FIELDS = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "@username atau instagram.com/username",
    icon: FaInstagram,
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "@username atau tiktok.com/@username",
    icon: FaTiktok,
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "@channel atau youtube.com/@channel",
    icon: FaYoutube,
  },
  {
    id: "website",
    label: "Website/Portfolio",
    placeholder: "websitekamu.com",
    icon: Globe2,
  },
] as const;

function clampStep(value: number): Step {
  if (value >= 4) return 4;
  if (value <= 1) return 1;
  return value as Step;
}

function formatPlatformInput(platform: keyof SocialLinks, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();

  if (
    /^https?:\/\//i.test(trimmed) ||
    lower.includes("instagram.") ||
    lower.includes("tiktok.") ||
    lower.includes("youtube.") ||
    lower.includes("youtu.be") ||
    lower.startsWith("www.")
  ) {
    return normalizeSocialUrl(trimmed);
  }

  if (platform === "website") {
    return normalizeSocialUrl(trimmed);
  }

  const username = trimmed.replace(/^@+/, "").replace(/^\/+/, "");
  if (!username) return "";

  if (platform === "instagram") {
    return normalizeSocialUrl(`https://www.instagram.com/${username}`);
  }
  if (platform === "tiktok") {
    return normalizeSocialUrl(`https://www.tiktok.com/@${username}`);
  }

  const channel = username.startsWith("@") ? username : `@${username}`;
  return normalizeSocialUrl(`https://www.youtube.com/${channel}`);
}

function getPortfolioTitle(input: string) {
  const trimmed = input.trim();
  return trimmed.length >= 4 ? trimmed : "Portfolio Pertama";
}

async function readApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error || `Request gagal (HTTP ${response.status}).`;
}

function uploadPortfolioFile(
  file: File,
  onProgress: (progress: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      const payload = JSON.parse(xhr.responseText || "{}") as
        | (UploadResult & { error?: string })
        | { error?: string };
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(payload.error || `Upload gagal (HTTP ${xhr.status}).`));
        return;
      }
      if (!("url" in payload) || !payload.url) {
        reject(new Error("Upload berhasil tetapi URL file tidak tersedia."));
        return;
      }
      resolve({
        url: payload.url,
        mediaType: payload.mediaType === "image" ? "image" : "video",
        previewImage: payload.previewImage || "",
      });
    };

    xhr.onerror = () => reject(new Error("Koneksi upload gagal. Coba lagi."));
    xhr.open("POST", "/api/media/upload-portfolio");
    xhr.send(formData);
  });
}

export function OnboardingWizard({ initialData }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<Step>(
    initialData.hasPortfolio ? clampStep(initialData.currentStep) : clampStep(initialData.currentStep || 1)
  );
  const [name, setName] = useState(initialData.name);
  const [username, setUsername] = useState(initialData.username);
  const [bio, setBio] = useState(initialData.bio.slice(0, 120));
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(initialData.socialLinks);
  const [portfolioMode, setPortfolioMode] = useState<PortfolioMode>("url");
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioAspectRatio, setPortfolioAspectRatio] = useState<"landscape" | "portrait">(
    "landscape"
  );
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasPortfolio, setHasPortfolio] = useState(initialData.hasPortfolio);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [usernameState, setUsernameState] = useState<UsernameAvailability>({
    checking: false,
    available: Boolean(initialData.username),
    reason: initialData.username ? "available" : "idle",
  });

  const normalizedUsername = useMemo(() => sanitizeUsername(username), [username]);
  const resolvedUsernameState = useMemo<UsernameAvailability>(() => {
    if (!normalizedUsername || normalizedUsername.length < 3) {
      return {
        checking: false,
        available: false,
        reason: "invalid",
      };
    }
    return usernameState;
  }, [normalizedUsername, usernameState]);
  const progress = (step / STEPS.length) * 100;
  const currentStepIndex = step - 1;
  const detectedPortfolioSource = detectVideoSource(portfolioUrl);
  const publicProfilePath = normalizedUsername
    ? `/creator/${normalizedUsername}`
    : initialData.publicProfilePath;

  useEffect(() => {
    if (!normalizedUsername || normalizedUsername.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setUsernameState((current) => ({
        ...current,
        checking: true,
      }));

      void fetch(
        `/api/public/username-availability?username=${encodeURIComponent(
          normalizedUsername
        )}&current=1`,
        { signal: controller.signal }
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Username check failed");
          }
          return (await response.json()) as {
            available?: boolean;
            reason?: UsernameAvailability["reason"];
            suggestion?: string;
          };
        })
        .then((payload) => {
          setUsernameState({
            checking: false,
            available: Boolean(payload.available),
            reason: payload.reason || (payload.available ? "available" : "taken"),
            suggestion: payload.suggestion,
          });
        })
        .catch((checkError) => {
          if ((checkError as Error).name === "AbortError") return;
          setUsernameState({
            checking: false,
            available: false,
            reason: "idle",
          });
        });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedUsername]);

  const saveProgress = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/onboarding/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    return response.json();
  };

  const completeOnboarding = async () => {
    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstVideoUploaded: true }),
    });
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
  };

  const validateProfileStep = () => {
    if (name.trim().length < 3) {
      return "Full Name minimal 3 karakter.";
    }
    if (!normalizedUsername || normalizedUsername.length < 3) {
      return "Username wajib diisi dan minimal 3 karakter.";
    }
    if (resolvedUsernameState.checking) {
      return "Tunggu pengecekan username selesai.";
    }
    if (!resolvedUsernameState.available) {
      return resolvedUsernameState.reason === "taken"
        ? "Username sudah dipakai creator lain."
        : "Username belum valid.";
    }
    if (bio.length > 120) {
      return "Short Bio maksimal 120 karakter.";
    }
    return "";
  };

  const normalizeSocialLinks = () => {
    const normalized = SOCIAL_FIELDS.reduce((acc, field) => {
      acc[field.id] = formatPlatformInput(field.id, socialLinks[field.id]);
      return acc;
    }, {} as SocialLinks);

    const invalidField = SOCIAL_FIELDS.find((field) => {
      const raw = socialLinks[field.id].trim();
      return raw && !normalized[field.id];
    });

    return { normalized, invalidField };
  };

  const createPortfolio = async (sourceUrl: string, upload?: UploadResult) => {
    const normalizedSourceUrl = normalizeHttpUrl(sourceUrl);
    const source = detectVideoSource(normalizedSourceUrl);
    if (!normalizedSourceUrl || !source) {
      throw new Error("Gunakan link TikTok, Instagram, YouTube, Vimeo, atau file media langsung.");
    }

    const isImage = upload?.mediaType === "image" || /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(normalizedSourceUrl);
    const thumbnailUrl =
      upload?.previewImage ||
      (isImage ? normalizedSourceUrl : getAutoThumbnailFromVideoUrl(normalizedSourceUrl));

    const response = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: getPortfolioTitle(portfolioTitle),
        sourceUrl: normalizedSourceUrl,
        aspectRatio: portfolioAspectRatio,
        outputType: "Portfolio",
        durationLabel: "",
        thumbnailUrl,
        extraVideoUrls: [],
        imageUrls: isImage ? [normalizedSourceUrl] : [],
        tags: [],
        visibility: "public",
        description: "Portfolio pertama dari onboarding creator.",
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
  };

  const handleNext = async () => {
    setError("");
    setSaving(true);

    try {
      if (step === 1) {
        const validationError = validateProfileStep();
        if (validationError) {
          setError(validationError);
          return;
        }

        await saveProgress({
          currentStep: 2,
          profile: {
            fullName: name.trim(),
            username: normalizedUsername,
            bio: bio.trim(),
          },
        });
        setUsername(normalizedUsername);
        setStep(2);
        return;
      }

      if (step === 2) {
        const { normalized, invalidField } = normalizeSocialLinks();
        if (invalidField) {
          setError(`${invalidField.label} harus berupa URL yang valid.`);
          return;
        }

        await saveProgress({
          currentStep: 3,
          socialLinks: normalized,
          progressPayload: { socialLinks: normalized },
        });
        setSocialLinks(normalized);
        setStep(3);
        return;
      }

      if (step === 3) {
        if (!hasPortfolio) {
          if (portfolioMode === "upload") {
            if (!uploadResult?.url) {
              setError("Upload minimal satu portfolio terlebih dahulu.");
              return;
            }
            await createPortfolio(uploadResult.url, uploadResult);
          } else {
            const normalizedSourceUrl = normalizeHttpUrl(portfolioUrl);
            if (!normalizedSourceUrl || !detectVideoSource(normalizedSourceUrl)) {
              setError("Gunakan link TikTok, Instagram, YouTube, Vimeo, atau upload file.");
              return;
            }
            await createPortfolio(normalizedSourceUrl);
          }
          setHasPortfolio(true);
        }

        await completeOnboarding();
        setStep(4);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step <= 1 || step === 4) return;
    setError("");
    setStep((step - 1) as Step);
  };

  const handleSkip = async () => {
    setError("");
    setSaving(true);
    try {
      await fetch("/api/onboarding/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: `skip_step_${step}` }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Gagal skip onboarding. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);
    setPortfolioTitle((current) => current || file.name.replace(/\.[^.]+$/, ""));

    try {
      const result = await uploadPortfolioFile(file, setUploadProgress);
      setUploadResult(result);
      setUploadProgress(100);
    } catch (uploadError) {
      setUploadResult(null);
      setError(uploadError instanceof Error ? uploadError.message : "Upload gagal. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <UserRound className="h-5 w-5" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              Perkenalkan dirimu
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Buat profile kamu lebih menarik untuk dilihat
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Full Name
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama lengkap kamu"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  @
                </span>
                <Input
                  value={username}
                  onChange={(event) => setUsername(sanitizeUsername(event.target.value))}
                  placeholder="username_kamu"
                  className="pl-9"
                />
              </div>
              <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-xs">
                <span className="truncate text-slate-400">
                  showreels.id/{normalizedUsername || "username"}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-medium",
                    resolvedUsernameState.available ? "text-emerald-600" : "text-slate-500"
                  )}
                >
                  {resolvedUsernameState.checking
                    ? "Mengecek..."
                    : resolvedUsernameState.available
                      ? "Tersedia"
                      : resolvedUsernameState.reason === "taken"
                        ? "Sudah dipakai"
                        : "Belum valid"}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Short Bio
              </label>
              <Textarea
                value={bio}
                onChange={(event) => setBio(event.target.value.slice(0, 120))}
                placeholder="Contoh: Video editor untuk brand, wedding, dan konten sosial."
                className="min-h-28 rounded-[1rem] border-slate-200 text-slate-950 placeholder:text-slate-400 focus:border-zinc-900 focus:ring-zinc-200"
                maxLength={120}
              />
              <p className="mt-2 text-right text-xs text-slate-400">{bio.length}/120</p>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Link2 className="h-5 w-5" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              Tambahkan link sosial media
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Bantu orang menemukan profile kamu
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {SOCIAL_FIELDS.map((field) => {
              const Icon = field.icon;
              const preview = formatPlatformInput(field.id, socialLinks[field.id]);
              return (
                <div key={field.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <Icon className="h-4 w-4 text-slate-700" />
                    {field.label}
                  </label>
                  <Input
                    value={socialLinks[field.id]}
                    onBlur={() =>
                      setSocialLinks((current) => ({
                        ...current,
                        [field.id]: formatPlatformInput(field.id, current[field.id]),
                      }))
                    }
                    onChange={(event) =>
                      setSocialLinks((current) => ({
                        ...current,
                        [field.id]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="mt-2"
                  />
                  {preview ? (
                    <p className="mt-2 truncate text-xs text-slate-400">{preview}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <UploadCloud className="h-5 w-5" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              Upload karya terbaikmu
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Tampilkan portfolio pertama kamu
            </p>
          </div>

          {hasPortfolio ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              Portfolio pertama sudah terupload. Lanjut untuk menyelesaikan onboarding.
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setPortfolioMode("url")}
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-medium transition",
                    portfolioMode === "url"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  )}
                >
                  <Video className="h-4 w-4" />
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => setPortfolioMode("upload")}
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-medium transition",
                    portfolioMode === "upload"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  )}
                >
                  <ImageIcon className="h-4 w-4" />
                  Upload
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Judul Portfolio
                </label>
                <Input
                  value={portfolioTitle}
                  onChange={(event) => setPortfolioTitle(event.target.value)}
                  placeholder="Portfolio pertama"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["landscape", "portrait"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPortfolioAspectRatio(item)}
                      className={cn(
                        "h-10 rounded-xl border text-sm font-medium transition",
                        portfolioAspectRatio === item
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-600"
                      )}
                    >
                      {item === "landscape" ? "Landscape" : "Portrait"}
                    </button>
                  ))}
                </div>
              </div>

              {portfolioMode === "url" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Link Portfolio
                  </label>
                  <Input
                    value={portfolioUrl}
                    onChange={(event) => setPortfolioUrl(event.target.value)}
                    onBlur={() => setPortfolioUrl(normalizeHttpUrl(portfolioUrl))}
                    placeholder="TikTok, Instagram, YouTube, atau Vimeo"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    {detectedPortfolioSource
                      ? `Source terdeteksi: ${detectedPortfolioSource}`
                      : "Paste link konten publik yang langsung mengarah ke karya."}
                  </p>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0];
                    if (file) void handleFile(file);
                  }}
                  className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:bg-slate-100"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleFile(file);
                    }}
                  />
                  <UploadCloud className="h-8 w-8 text-slate-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {uploadedFileName || "Pilih atau drag file portfolio"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Video atau image, maksimal 100MB</p>
                  {uploading || uploadResult ? (
                    <div className="mt-4 w-full max-w-xs">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-950 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {uploading ? `${uploadProgress}%` : "Upload selesai"}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          Profile kamu siap digunakan
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Sekarang kamu bisa mulai membagikan portfolio
        </p>
        <div className="mt-8 space-y-3">
          <Button className="w-full" onClick={() => router.push("/dashboard")}>
            Masuk Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push(publicProfilePath)}
          >
            Lihat Profile Publik
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-950">
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-slate-100">
        <div
          className="h-full bg-slate-950 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="fixed inset-x-0 top-5 z-40 px-4">
        <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const active = item.id === step;
            const complete = item.id < step;
            return (
              <div key={item.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs transition",
                    complete || active
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-400"
                  )}
                  aria-label={item.label}
                >
                  {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {index < STEPS.length - 1 ? (
                  <span
                    className={cn(
                      "h-px w-4 rounded-full",
                      complete ? "bg-slate-950" : "bg-slate-200"
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-28">
        <section className="w-full max-w-md">
          {renderStepContent()}
          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}
        </section>
      </main>

      {step !== 4 ? (
        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-4">
            {currentStepIndex > 0 ? (
              <Button variant="ghost" onClick={handleBack} disabled={saving || uploading}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSkip} disabled={saving || uploading}>
                Skip
              </Button>
              <Button onClick={handleNext} disabled={saving || uploading || resolvedUsernameState.checking}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
