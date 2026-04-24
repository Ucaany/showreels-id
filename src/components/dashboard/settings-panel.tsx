"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { CopyProfileLinkButton } from "@/components/dashboard/copy-profile-link-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import { createClient } from "@/lib/supabase/client";
import type { ProfileVisibility } from "@/lib/types";

interface SettingsPanelProps {
  username: string;
  profileVisibility: ProfileVisibility;
}

export function SettingsPanel({ username, profileVisibility }: SettingsPanelProps) {
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [savedVisibility, setSavedVisibility] = useState<ProfileVisibility>(profileVisibility);
  const [visibility, setVisibility] = useState<ProfileVisibility>(profileVisibility);
  const supabase = createClient();

  const visibilityDescription =
    visibility === "public"
      ? "Profil creator dan video public akan tampil di beranda serta halaman publik."
      : visibility === "semi_private"
        ? "Profil tidak muncul di listing publik, tapi tetap bisa dibuka oleh yang punya link."
        : "Profil hanya bisa diakses creator sendiri (mode pribadi).";

  const handleSaveProfileVisibility = async () => {
    const confirmed = await confirmFeedbackAction({
      title: "Simpan privasi akun?",
      text: "Perubahan ini langsung memengaruhi akses profil dan discoverability video.",
      confirmButtonText: "Simpan",
    });

    if (!confirmed) {
      return;
    }

    setSavingVisibility(true);
    const response = await fetch("/api/profile/visibility", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profileVisibility: visibility }),
    });
    setSavingVisibility(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal menyimpan privasi akun",
        text: payload?.error || "Coba lagi dalam beberapa saat.",
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({
      title: "Privasi akun tersimpan",
      icon: "success",
      timer: 1200,
    });
    setSavedVisibility(visibility);
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirmFeedbackAction({
      title: "Hapus akun secara permanen?",
      text: "Semua data profil creator dan video akan ikut terhapus.",
      confirmButtonText: "Hapus akun",
      icon: "warning",
    });

    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    const response = await fetch("/api/profile", {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal menghapus akun",
        text: payload?.error || "Coba lagi dalam beberapa saat.",
        icon: "error",
      });
      setDeletingAccount(false);
      return;
    }

    await showFeedbackAlert({
      title: "Akun berhasil dihapus",
      icon: "success",
      timer: 1000,
    });
    await supabase.auth.signOut();
    window.location.replace("/");
  };

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e24f3b]">
            Settings
          </p>
          <h1 className="font-display text-2xl font-semibold text-[#201b18]">
            Pengaturan akun creator
          </h1>
          <p className="text-sm text-[#61554f]">
            Atur link profil publik dan penghapusan akun dari halaman terpisah agar tetap rapi.
          </p>
        </div>
      </Card>

      <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90">
        <h2 className="text-base font-semibold text-[#201b18]">Privasi akun creator</h2>
        <p className="mt-2 text-sm text-[#61554f]">
          Atur siapa yang bisa mengakses profil dan video melalui halaman publik.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4f433d]">
              Mode privasi akun
            </label>
            <Select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as ProfileVisibility)
              }
            >
              <option value="private">Private - hanya creator</option>
              <option value="semi_private">Semi Private - hanya via link</option>
              <option value="public">Public - tampil di seluruh website</option>
            </Select>
            <p className="mt-2 text-xs text-[#61554f]">{visibilityDescription}</p>
          </div>
          <Button
            type="button"
            onClick={handleSaveProfileVisibility}
            disabled={savingVisibility || visibility === savedVisibility}
          >
            {savingVisibility ? "Menyimpan..." : "Simpan Privasi"}
          </Button>
        </div>
      </Card>

      <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90">
        <h2 className="text-base font-semibold text-[#201b18]">Link profile creator</h2>
        <p className="mt-2 break-all text-sm text-[#61554f]">{`/creator/${username}`}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CopyProfileLinkButton username={username} />
          <Link href={`/creator/${username}`}>
            <Button variant="secondary">Lihat Profile</Button>
          </Link>
        </div>
      </Card>

      <Card className="dashboard-clean-card border-rose-200 bg-rose-50/60">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-600" />
          <div>
            <h2 className="text-base font-semibold text-rose-700">Hapus akun</h2>
            <p className="mt-1 text-sm text-rose-600">
              Tindakan ini permanen. Semua data profil creator dan video portfolio akan dihapus.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="danger"
          className="mt-4 w-full sm:w-auto"
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
        >
          {deletingAccount ? "Menghapus akun..." : "Hapus Account"}
        </Button>
      </Card>
    </div>
  );
}
