"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showFeedbackAlert } from "@/lib/feedback-alert";

export default function SettingsSecurityPage() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    logoutAll: true,
  });

  const handleSave = async () => {
    setSaving(true);
    const response = await fetch("/api/settings/security/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal mengganti password",
        text: payload?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }
    await showFeedbackAlert({
      title: "Password berhasil diganti",
      text: form.logoutAll
        ? "Semua session lama sudah dikeluarkan."
        : "Perubahan keamanan sudah disimpan.",
      icon: "success",
      timer: 1200,
    });
    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      logoutAll: true,
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
          Security
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18]">
          Ganti password akun creator
        </h1>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <div className="rounded-2xl border border-[#e3d8d2] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#2f73ff]" />
            <p className="text-sm font-semibold text-[#201b18]">Password Security</p>
          </div>
          <div className="grid gap-3">
            <label className="text-sm text-[#4f433d]">
              Password Lama
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                }
                className="mt-1 h-11 w-full rounded-xl border border-[#d7cec7] bg-white px-3 text-sm text-[#201b18] outline-none focus:border-[#ef5f49] focus:ring-2 focus:ring-[#f1b8ad]"
              />
            </label>
            <label className="text-sm text-[#4f433d]">
              Password Baru
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, newPassword: event.target.value }))
                }
                className="mt-1 h-11 w-full rounded-xl border border-[#d7cec7] bg-white px-3 text-sm text-[#201b18] outline-none focus:border-[#ef5f49] focus:ring-2 focus:ring-[#f1b8ad]"
              />
            </label>
            <label className="text-sm text-[#4f433d]">
              Konfirmasi Password Baru
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                className="mt-1 h-11 w-full rounded-xl border border-[#d7cec7] bg-white px-3 text-sm text-[#201b18] outline-none focus:border-[#ef5f49] focus:ring-2 focus:ring-[#f1b8ad]"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[#5f524b]">
              <input
                type="checkbox"
                checked={form.logoutAll}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, logoutAll: event.target.checked }))
                }
                className="h-4 w-4 accent-[#2f73ff]"
              />
              Logout dari semua perangkat setelah ganti password
            </label>
          </div>
          <div className="mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
