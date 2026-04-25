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

export default function SettingsLinkProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [initialSlug, setInitialSlug] = useState("");
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason: string;
  } | null>(null);
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

  useEffect(() => {
    if (!normalizedSlug || normalizedSlug === initialSlug) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const response = await fetch(
        `/api/settings/check-slug?slug=${encodeURIComponent(normalizedSlug)}`
      );
      if (!response.ok) return;
      const payload = (await response.json()) as {
        available: boolean;
        reason: string;
      };
      if (cancelled) return;
      setAvailability(payload);
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
              {normalizedSlug !== initialSlug && availability ? (
                <p
                  className={`mt-1 text-xs ${
                    availability.available ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {availability.available
                    ? "Slug tersedia."
                    : `Slug tidak tersedia (${availability.reason}).`}
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
                disabled={saving || normalizedSlug === initialSlug}
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
