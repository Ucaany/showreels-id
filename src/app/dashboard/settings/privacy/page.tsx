"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showFeedbackAlert } from "@/lib/feedback-alert";

type PrivacyState = {
  publicProfile: boolean;
  searchIndexing: boolean;
  showPublicEmail: boolean;
  showSocialLinks: boolean;
  showPublicStats: boolean;
};

export default function SettingsPrivacyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<PrivacyState>({
    publicProfile: true,
    searchIndexing: true,
    showPublicEmail: false,
    showSocialLinks: true,
    showPublicStats: false,
  });

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      const response = await fetch("/api/settings/privacy");
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const payload = (await response.json()) as PrivacyState;
      if (isCancelled) return;
      setState(payload);
      setLoading(false);
    };
    void load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const response = await fetch("/api/settings/privacy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setSaving(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal menyimpan privasi",
        text: payload?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }
    await showFeedbackAlert({
      title: "Privasi berhasil diperbarui",
      icon: "success",
      timer: 1100,
    });
  };

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <Link href="/dashboard/settings">
          <Button size="sm" variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Settings
          </Button>
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
          Privasi Creator
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18]">
          Kontrol visibilitas akun publik
        </h1>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-[#5f524b]">Memuat pengaturan privasi...</p>
        ) : (
          <div className="space-y-3">
            {[
              {
                key: "publicProfile",
                title: "Public profile",
                desc: "Izinkan profil creator tampil di halaman publik.",
              },
              {
                key: "searchIndexing",
                title: "Search indexing",
                desc: "Izinkan mesin pencari mengindeks profil publik.",
              },
              {
                key: "showPublicEmail",
                title: "Tampilkan email publik",
                desc: "Email contact akan muncul di halaman profil publik.",
              },
              {
                key: "showSocialLinks",
                title: "Tampilkan social links",
                desc: "Tampilkan link sosial media di profil publik.",
              },
              {
                key: "showPublicStats",
                title: "Tampilkan statistik publik",
                desc: "Tampilkan ringkasan statistik traffic secara publik.",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-start justify-between gap-3 rounded-2xl border border-[#e5dbd6] bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[#201b18]">{item.title}</p>
                  <p className="text-sm text-[#5f524b]">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={state[item.key as keyof PrivacyState]}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      [item.key]: event.target.checked,
                    }))
                  }
                  className="mt-1 h-5 w-5 accent-[#2f73ff]"
                />
              </label>
            ))}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Privasi"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
