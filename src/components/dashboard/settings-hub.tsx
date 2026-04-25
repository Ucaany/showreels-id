"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import { createClient } from "@/lib/supabase/client";

export function SettingsHub({ username }: { username: string }) {
  const supabase = createClient();
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteText.trim().toUpperCase() !== "HAPUS AKUN") {
      await showFeedbackAlert({
        title: "Konfirmasi belum sesuai",
        text: "Ketik HAPUS AKUN untuk melanjutkan.",
        icon: "warning",
      });
      return;
    }

    const firstConfirm = await confirmFeedbackAction({
      title: "Akun akan dihapus permanen",
      text: "Data profile, link, analytics, dan billing history tidak bisa dikembalikan.",
      confirmButtonText: "Lanjut",
      icon: "warning",
    });
    if (!firstConfirm) return;

    const secondConfirm = await confirmFeedbackAction({
      title: "Yakin ingin hapus akun?",
      text: "Ini aksi permanen dan tidak dapat di-undo.",
      confirmButtonText: "Ya, hapus akun",
      icon: "warning",
    });
    if (!secondConfirm) return;

    setDeleting(true);
    const response = await fetch("/api/profile", { method: "DELETE" });
    setDeleting(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      await showFeedbackAlert({
        title: "Gagal menghapus akun",
        text: payload?.error || "Coba ulang beberapa saat lagi.",
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({
      title: "Akun berhasil dihapus",
      icon: "success",
      timer: 1000,
    });
    await supabase?.auth.signOut();
    window.location.replace("/auth/login");
  };

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
          Settings
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18] sm:text-3xl">
          Pengaturan Akun Creator
        </h1>
        <p className="mt-2 text-sm text-[#60534c]">
          Atur privasi, slug profil, payment, whitelabel, keamanan, dan penghapusan akun.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/dashboard/settings/privacy">
          <Card className="dashboard-clean-card border-border bg-surface p-4">
            <h2 className="text-base font-semibold text-[#201b18]">Privasi Creator</h2>
            <p className="mt-1 text-sm text-[#5e514a]">
              Public profile, indexing, email publik, sosial, statistik publik.
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/settings/link-profile">
          <Card className="dashboard-clean-card border-border bg-surface p-4">
            <h2 className="text-base font-semibold text-[#201b18]">Link Profile</h2>
            <p className="mt-1 text-sm text-[#5e514a]">
              Ganti slug, cek ketersediaan username, dan URL publik profile.
            </p>
            <p className="mt-2 text-xs text-[#6f625a]">{`/creator/${username}`}</p>
          </Card>
        </Link>
        <Link href="/dashboard/settings/payment">
          <Card className="dashboard-clean-card border-border bg-surface p-4">
            <h2 className="text-base font-semibold text-[#201b18]">Payment</h2>
            <p className="mt-1 text-sm text-[#5e514a]">
              Billing email, payment method default, tax info, dan invoice note.
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/settings/whitelabel">
          <Card className="dashboard-clean-card border-border bg-surface p-4">
            <h2 className="text-base font-semibold text-[#201b18]">Whitelabel</h2>
            <p className="mt-1 text-sm text-[#5e514a]">
              Aktifkan/nonaktifkan branding Showreels.id sesuai plan.
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/settings/security">
          <Card className="dashboard-clean-card border-border bg-surface p-4">
            <h2 className="text-base font-semibold text-[#201b18]">Security</h2>
            <p className="mt-1 text-sm text-[#5e514a]">
              Ganti password akun dan logout dari semua perangkat.
            </p>
          </Card>
        </Link>
      </div>

      <Card className="dashboard-clean-card border-rose-200 bg-rose-50 p-4 sm:p-5">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-600" />
          <div>
            <h2 className="text-base font-semibold text-rose-700">Hapus Account</h2>
            <p className="mt-1 text-sm text-rose-700">
              Ketik <span className="font-semibold">HAPUS AKUN</span> untuk melanjutkan penghapusan permanen.
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            placeholder="Ketik HAPUS AKUN"
            className="h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-sm text-[#201b18] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
          />
          <Button variant="danger" onClick={handleDeleteAccount} disabled={deleting}>
            {deleting ? "Menghapus..." : "Hapus Account"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
