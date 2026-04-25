"use client";

import { type ComponentType, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CreditCard,
  KeyRound,
  Link2,
  Palette,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import { createClient } from "@/lib/supabase/client";

type SettingsHubEntitlements = {
  usernameChangesPer30Days: number;
  analyticsMaxDays: number;
  customThumbnailEnabled: boolean;
  whitelabelEnabled: boolean;
  creatorGroupEnabled: boolean;
  supportEnabled: boolean;
  themeSwitchComingSoon: boolean;
};

function SettingsNavCard({
  href,
  title,
  description,
  meta,
  icon,
  external = false,
  emoji,
  disabled = false,
}: {
  href?: string;
  title: string;
  description: string;
  meta?: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
  emoji?: string;
  disabled?: boolean;
}) {
  const Icon = icon;
  const body = (
    <Card
      className={`dashboard-clean-card h-full border-[#d6e2f7] bg-white p-4 transition ${
        disabled ? "opacity-80" : "hover:-translate-y-0.5 hover:border-[#bfd6ff] hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d5e1f4] bg-[#edf4ff] text-[#2f73ff]">
          <Icon className="h-5 w-5" />
        </span>
        <ChevronRight className="h-4 w-4 text-[#7d95bd]" />
      </div>
      <h2 className="mt-3 text-base font-semibold text-[#1b2e4f]">
        {emoji ? `${emoji} ` : ""}
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-[#4f658f]">{description}</p>
      {meta ? <p className="mt-2 text-xs font-medium text-[#5f78a3]">{meta}</p> : null}
    </Card>
  );

  if (!href) {
    return body;
  }

  return (
    <Link href={href} target={external ? "_blank" : undefined} className="group block h-full">
      {body}
    </Link>
  );
}

export function SettingsHub({
  username,
  planName,
  entitlements,
  creatorGroupLink,
  supportLink,
}: {
  username: string;
  planName: "free" | "pro" | "business";
  entitlements: SettingsHubEntitlements;
  creatorGroupLink: string;
  supportLink: string;
}) {
  const supabase = createClient();
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const planLabel = planName === "business" ? "Business" : planName === "pro" ? "Pro" : "Free";
  const planBadge =
    planName === "business" ? "💼 Business" : planName === "pro" ? "⚡ Pro" : "🆓 Free";

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
    <div className="space-y-6">
      <Card className="dashboard-clean-card border-[#d6e2f7] bg-gradient-to-b from-[#ffffff] to-[#f6faff] p-4 sm:p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d5e1f4] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f73ff]">
          <Sparkles className="h-3.5 w-3.5" />
          Settings
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-[#1b2e4f] sm:text-3xl">
          Pengaturan Akun Creator
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4f658f]">
          Atur privasi, slug profil, payment, whitelabel, keamanan, dan penghapusan akun dalam
          satu halaman yang rapi.
        </p>
        <div className="mt-4 grid gap-3 rounded-2xl border border-[#d6e2f7] bg-white p-3 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#cde0ff] bg-[#edf4ff] px-3 py-1 text-sm font-semibold text-[#1f58e3]">
            <Wrench className="h-4 w-4" />
            {planBadge}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#d6e2f7] bg-[#f8fbff] px-2.5 py-1 text-xs font-medium text-[#5b7198]">
              Username: {entitlements.usernameChangesPer30Days}x / 30 hari
            </span>
            <span className="rounded-full border border-[#d6e2f7] bg-[#f8fbff] px-2.5 py-1 text-xs font-medium text-[#5b7198]">
              Analytics: {entitlements.analyticsMaxDays} hari
            </span>
            <span className="rounded-full border border-[#d6e2f7] bg-[#f8fbff] px-2.5 py-1 text-xs font-medium text-[#5b7198]">
              Plan aktif: {planLabel}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SettingsNavCard
          href="/dashboard/settings/privacy"
          icon={Shield}
          emoji="🔒"
          title="Privasi Creator"
          description="Public profile, indexing, email publik, sosial, dan statistik publik."
        />
        <SettingsNavCard
          href="/dashboard/settings/link-profile"
          icon={Link2}
          emoji="🔗"
          title="Link Profile"
          description="Ganti slug, cek ketersediaan username, dan URL publik profile."
          meta={`/creator/${username}`}
        />
        <SettingsNavCard
          href="/dashboard/settings/payment"
          icon={CreditCard}
          emoji="💳"
          title="Payment"
          description="Billing email, payment method default, tax info, dan invoice note."
        />
        <SettingsNavCard
          href="/dashboard/settings/whitelabel"
          icon={Palette}
          emoji="🎨"
          title="Whitelabel"
          description="Aktifkan/nonaktifkan branding Showreels.id sesuai plan."
          meta={entitlements.whitelabelEnabled ? "Business unlocked" : "Business only"}
        />
        <SettingsNavCard
          icon={Sparkles}
          emoji="✨"
          title="Ganti Tema"
          description={
            entitlements.themeSwitchComingSoon
              ? "Fitur coming soon tersedia untuk plan Business."
              : "Fitur coming soon khusus plan Business."
          }
          meta="Coming Soon"
          disabled
        />
        <SettingsNavCard
          href="/dashboard/settings/security"
          icon={KeyRound}
          emoji="🛡️"
          title="Security"
          description="Ganti password akun dan logout dari semua perangkat."
        />
        {entitlements.creatorGroupEnabled && creatorGroupLink ? (
          <SettingsNavCard
            href={creatorGroupLink}
            external
            icon={Users}
            emoji="👥"
            title="Grup Khusus Creator"
            description="Akses komunitas creator untuk update produk dan networking."
          />
        ) : null}
        {entitlements.supportEnabled && supportLink ? (
          <SettingsNavCard
            href={supportLink}
            external
            icon={Shield}
            emoji="🤝"
            title="Contact Support"
            description="Hubungi support tim Showreels untuk bantuan akun creator."
          />
        ) : null}
      </div>

      <Card className="dashboard-clean-card border-rose-200 bg-gradient-to-b from-rose-50 to-white p-4 sm:p-5">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-rose-700">🚨 Hapus Akun</h2>
            <p className="mt-1 text-sm leading-6 text-rose-700">
              Ketik <span className="font-semibold">HAPUS AKUN</span> untuk melanjutkan
              penghapusan permanen.
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
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full sm:w-auto"
          >
            {deleting ? "Menghapus..." : "Hapus Akun"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

