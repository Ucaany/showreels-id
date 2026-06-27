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
import { signOut } from "next-auth/react";

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
  disabled = false,
}: {
  href?: string;
  title: string;
  description: string;
  meta?: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
  disabled?: boolean;
}) {
  const Icon = icon;
  const body = (
    <div
      className={`group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition ${
        disabled ? "opacity-60" : "hover:bg-muted/50 hover:shadow-sm"
      }`}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        {meta && <p className="mt-1 text-xs font-medium text-muted-foreground">{meta}</p>}
      </div>
      {!disabled && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </div>
  );

  if (!href) return body;

  return (
    <Link href={href} target={external ? "_blank" : undefined} className="block">
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
  planName: "free" | "creator" | "business";
  entitlements: SettingsHubEntitlements;
  creatorGroupLink: string;
  supportLink: string;
}) {
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const planLabel =
    planName === "business" ? "Business" : planName === "creator" ? "Creator" : "Free";
  const planBadge =
    planName === "business"
      ? "Business"
      : planName === "creator"
        ? "Creator"
        : "Free";

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
    await signOut({ redirect: false });
    window.location.replace("/auth/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atur privasi, profil, payment, keamanan, dan penghapusan akun.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            <Wrench className="mr-1.5 h-3.5 w-3.5" />
            Plan: {planLabel}
          </span>
          <span className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Analytics: {entitlements.analyticsMaxDays} hari
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SettingsNavCard
          href="/dashboard/settings/privacy"
          icon={Shield}
          title="Privasi Creator"
          description="Public profile, indexing, email publik, sosial, dan statistik publik."
        />
        <SettingsNavCard
          href="/dashboard/settings/link-profile"
          icon={Link2}
          title="Link Profile"
          description="Ganti slug, cek ketersediaan username, dan URL publik profile."
          meta={`/creator/${username}`}
        />
        <SettingsNavCard
          href="/dashboard/settings/payment"
          icon={CreditCard}
          title="Payment"
          description="Billing email, payment method default, tax info, dan invoice note."
        />
        <SettingsNavCard
          href="/dashboard/settings/whitelabel"
          icon={Palette}
          title="Whitelabel"
          description="Aktifkan/nonaktifkan branding Showreels.id sesuai plan."
          meta={entitlements.whitelabelEnabled ? "Business unlocked" : "Business only"}
        />
        <SettingsNavCard
          icon={Sparkles}
          title="Ganti Tema"
          description="Fitur coming soon khusus plan Business."
          meta="Coming Soon"
          disabled
        />
        <SettingsNavCard
          href="/dashboard/settings/security"
          icon={KeyRound}
          title="Security"
          description="Ganti password akun dan logout dari semua perangkat."
        />
        {entitlements.creatorGroupEnabled && creatorGroupLink ? (
          <SettingsNavCard
            href={creatorGroupLink}
            external
            icon={Users}
            title="Grup Khusus Creator"
            description="Akses komunitas creator untuk update produk dan networking."
          />
        ) : null}
        {entitlements.supportEnabled && supportLink ? (
          <SettingsNavCard
            href={supportLink}
            external
            icon={Shield}
            title="Contact Support"
            description="Hubungi support tim Showreels untuk bantuan akun creator."
          />
        ) : null}
      </div>

      <Card className="border-destructive/30 bg-destructive/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-background text-destructive">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-destructive">Hapus Akun</h2>
            <p className="mt-1 text-sm text-destructive/80">
              Ketik <span className="font-semibold">HAPUS AKUN</span> untuk melanjutkan penghapusan permanen.
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="Ketik HAPUS AKUN"
            className="h-10 w-full rounded-lg border border-destructive/30 bg-background px-3 text-sm outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20"
          />
          <Button
            variant="destructive"
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

