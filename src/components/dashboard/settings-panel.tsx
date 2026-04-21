"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ShieldAlert } from "lucide-react";
import { CopyProfileLinkButton } from "@/components/dashboard/copy-profile-link-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SettingsPanelProps {
  username: string;
}

export function SettingsPanel({ username }: SettingsPanelProps) {
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Yakin ingin menghapus akun secara permanen? Semua data profil dan video akan ikut terhapus."
    );
    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    const response = await fetch("/api/profile", {
      method: "DELETE",
    });

    if (!response.ok) {
      window.alert("Gagal menghapus akun. Coba lagi.");
      setDeletingAccount(false);
      return;
    }

    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-border bg-surface">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
            Settings
          </p>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            Pengaturan akun creator
          </h1>
          <p className="text-sm text-slate-600">
            Atur link profil publik dan penghapusan akun dari halaman terpisah agar tetap rapi.
          </p>
        </div>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface">
        <h2 className="text-base font-semibold text-slate-900">Link profile creator</h2>
        <p className="mt-2 break-all text-sm text-slate-600">{`/creator/${username}`}</p>
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
