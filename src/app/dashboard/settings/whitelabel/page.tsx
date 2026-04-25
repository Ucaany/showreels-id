"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showFeedbackAlert } from "@/lib/feedback-alert";

type WhitelabelPayload = {
  available: boolean;
  planName: string;
  enabled: boolean;
};

export default function SettingsWhitelabelPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<WhitelabelPayload>({
    available: false,
    planName: "free",
    enabled: false,
  });

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/settings/whitelabel");
    if (response.ok) {
      const payload = (await response.json()) as WhitelabelPayload;
      setState(payload);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const response = await fetch("/api/settings/whitelabel", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: state.enabled }),
    });
    setSaving(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal menyimpan whitelabel",
        text: payload?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }
    await showFeedbackAlert({
      title: "Whitelabel settings tersimpan",
      icon: "success",
      timer: 1100,
    });
    await load();
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
          Whitelabel
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18]">
          Kontrol branding Showreels.id
        </h1>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-[#5f524b]">Memuat data whitelabel...</p>
        ) : state.available ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e3d8d2] bg-white p-4">
              <p className="text-sm font-semibold text-[#201b18]">
                Plan aktif: <span className="capitalize">{state.planName}</span>
              </p>
              <p className="mt-1 text-sm text-[#5f524b]">
                Aktifkan opsi ini untuk menyembunyikan branding Showreels.id di halaman publik.
              </p>
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-[#e3d8d2] bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-[#201b18]">Hapus whitelabel Showreels.id</p>
                <p className="text-sm text-[#5f524b]">Terapkan ke profile dan link publik.</p>
              </div>
              <input
                type="checkbox"
                checked={state.enabled}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, enabled: event.target.checked }))
                }
                className="h-5 w-5 accent-[#2f73ff]"
              />
            </label>
            <div className="rounded-2xl border border-dashed border-[#d9cec7] bg-[#faf6f3] p-4">
              <p className="text-sm font-semibold text-[#201b18]">Ganti Tema</p>
              <p className="mt-1 text-sm text-[#5f524b]">
                Fitur ganti tema khusus Business sedang disiapkan (coming soon).
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Menyimpan..." : "Simpan Whitelabel"}
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-700">Fitur terkunci</p>
                <p className="text-sm text-amber-700">
                  Fitur hapus whitelabel tersedia di plan Business.
                </p>
              </div>
            </div>
            <Link href="/dashboard/billing" className="mt-3 inline-block w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4" />
                Upgrade Plan
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
