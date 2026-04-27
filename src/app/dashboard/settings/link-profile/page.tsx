"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showFeedbackAlert } from "@/lib/feedback-alert";

type LinkProfilePayload = {
  slug: string;
  publicUrl: string;
  usernameChangeCount?: number;
  usernameChangeLimit?: number;
};

type SlugAvailabilityPayload = {
  available: boolean;
  reason: string;
  ownedByCurrentUser?: boolean;
};

type SlugAvailabilityState = SlugAvailabilityPayload & {
  checking: boolean;
};

function getSlugStatusCopy(state: SlugAvailabilityState) {
  if (state.checking) {
    return {
      text: "Mengecek ketersediaan slug...",
      tone: "text-[#5b7198]",
    };
  }

  if (state.reason === "owned_by_current_user") {
    return {
      text: "Slug ini sudah terhubung ke akun kamu.",
      tone: "text-emerald-700",
    };
  }

  if (state.reason === "available") {
    return {
      text: "Slug tersedia.",
      tone: "text-emerald-700",
    };
  }

  if (state.reason === "taken") {
    return {
      text: "Slug sudah dipakai creator lain.",
      tone: "text-rose-700",
    };
  }

  if (state.reason === "reserved") {
    return {
      text: "Slug ini tidak dapat digunakan.",
      tone: "text-rose-700",
    };
  }

  if (state.reason === "invalid") {
    return {
      text: "Format slug belum valid.",
      tone: "text-rose-700",
    };
  }

  return {
    text: "Slug belum bisa dipakai saat ini.",
    tone: "text-[#5b7198]",
  };
}

export default function SettingsLinkProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [initialSlug, setInitialSlug] = useState("");
  const [availability, setAvailability] = useState<SlugAvailabilityState | null>(null);
  const [usernameChangeCount, setUsernameChangeCount] = useState(0);
  const [usernameChangeLimit, setUsernameChangeLimit] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const response = await fetch("/api/settings/link-profile");
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const payload = (await response.json()) as LinkProfilePayload;
      if (cancelled) return;
      setSlug(payload.slug);
      setInitialSlug(payload.slug);
      setUsernameChangeCount(payload.usernameChangeCount || 0);
      setUsernameChangeLimit(payload.usernameChangeLimit || 0);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSlug = useMemo(() => slug.trim().toLowerCase(), [slug]);
  const publicUrl = `/creator/${normalizedSlug || "creator"}`;
  const effectiveAvailability = useMemo<SlugAvailabilityState | null>(() => {
    if (!normalizedSlug) {
      return null;
    }

    if (normalizedSlug === initialSlug) {
      return {
        available: true,
        reason: "owned_by_current_user",
        ownedByCurrentUser: true,
        checking: false,
      };
    }

    return availability;
  }, [availability, initialSlug, normalizedSlug]);
  const canSaveSlug =
    Boolean(normalizedSlug) &&
    normalizedSlug !== initialSlug &&
    Boolean(
      effectiveAvailability &&
        !effectiveAvailability.checking &&
        effectiveAvailability.available
    );

  useEffect(() => {
    if (!normalizedSlug || normalizedSlug === initialSlug) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setAvailability((prev) => ({
        available: prev?.available ?? false,
        reason: prev?.reason ?? "checking",
        ownedByCurrentUser: prev?.ownedByCurrentUser,
        checking: true,
      }));
      const response = await fetch(
        `/api/settings/check-slug?slug=${encodeURIComponent(normalizedSlug)}`
      );
      const payload = (await response.json().catch(() => null)) as SlugAvailabilityPayload | null;
      if (cancelled) return;

      if (!response.ok || !payload) {
        setAvailability({
          available: false,
          reason: "idle",
          checking: false,
        });
        return;
      }

      setAvailability({
        available: payload.available,
        reason: payload.reason,
        ownedByCurrentUser: payload.ownedByCurrentUser,
        checking: false,
      });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedSlug, initialSlug]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${publicUrl}`);
    await showFeedbackAlert({
      title: "Link profile berhasil disalin",
      icon: "success",
      timer: 1100,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const response = await fetch("/api/settings/link-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: normalizedSlug }),
    });
    setSaving(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal mengubah slug",
        text: payload?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }
    const payload = (await response.json()) as LinkProfilePayload;
    setSlug(payload.slug);
    setInitialSlug(payload.slug);
    setUsernameChangeCount(payload.usernameChangeCount || 0);
    setUsernameChangeLimit(payload.usernameChangeLimit || 0);
    setAvailability(null);
    await showFeedbackAlert({
      title: "Slug profile berhasil diperbarui",
      icon: "success",
      timer: 1200,
    });
  };

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <Link href="/dashboard/settings" className="inline-flex w-full sm:w-auto">
          <Button size="sm" variant="secondary" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Settings
          </Button>
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
          Link Profile
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18]">
          Atur username / slug publik
        </h1>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-[#5f524b]">Memuat data slug...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4f433d]">
                Username / Slug
              </label>
              <input
                value={slug}
                onChange={(event) =>
                  setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                className="h-11 w-full rounded-xl border border-[#d7cec7] bg-white px-3 text-sm text-[#201b18] outline-none focus:border-[#ef5f49] focus:ring-2 focus:ring-[#f1b8ad]"
              />
              <p className="mt-1 text-xs text-[#655850]">
                Hanya huruf kecil, angka, dash, dan underscore. Panjang 3-30 karakter.
              </p>
              {usernameChangeLimit > 0 ? (
                <p className="mt-1 text-xs text-[#655850]">
                  Limit ubah username: {usernameChangeCount}/{usernameChangeLimit} per 30 hari.
                </p>
              ) : null}
              {effectiveAvailability ? (
                <p className={`mt-1 text-xs ${getSlugStatusCopy(effectiveAvailability).tone}`}>
                  {getSlugStatusCopy(effectiveAvailability).text}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#e3d8d2] bg-white p-3">
              <p className="text-xs font-medium text-[#6c5f58]">Public URL</p>
              <p className="mt-1 text-sm font-semibold text-[#201b18]">{publicUrl}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !canSaveSlug}
                className="w-full sm:w-auto"
              >
                {saving ? "Menyimpan..." : "Simpan Slug"}
              </Button>
              <Button variant="secondary" onClick={handleCopy} className="w-full sm:w-auto">
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Link href={publicUrl} target="_blank" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Preview Profile
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
