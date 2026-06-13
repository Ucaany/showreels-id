"use client";

import { useDashboardStore } from "@/stores/dashboard-store";

/**
 * ProfileTab - Menampilkan informasi profil publik dari Zustand store.
 * Instant render (0ms) karena data sudah ada di memory.
 */
export function ProfileTab() {
  const profile = useDashboardStore((s) => s.profile);

  if (!profile) {
    return (
      <div className="text-center text-neutral-500">
        <p>Data profil belum tersedia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          Profil Publik
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Informasi yang ditampilkan di halaman publik Anda
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName || profile.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-neutral-400">
                {(profile.fullName || profile.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900">
              {profile.fullName || "Belum diisi"}
            </h3>
            <p className="text-sm text-neutral-500">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Visibility Badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
              profile.profileVisibility === "public"
                ? "bg-green-50 text-green-700"
                : profile.profileVisibility === "semi_private"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {profile.profileVisibility === "public" && "🌍 Publik"}
            {profile.profileVisibility === "semi_private" && "🔑 Semi-Private"}
            {profile.profileVisibility === "private" && "🔒 Private"}
          </span>
        </div>
      </div>

      {/* Contact & Social */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Kontak & Sosial Media
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Email" value={profile.contactEmail || profile.email} />
          <InfoRow label="Website" value={profile.websiteUrl} />
          <InfoRow label="Instagram" value={profile.instagramUrl} />
          <InfoRow label="YouTube" value={profile.youtubeUrl} />
          <InfoRow label="Facebook" value={profile.facebookUrl} />
          <InfoRow label="Threads" value={profile.threadsUrl} />
          <InfoRow label="LinkedIn" value={profile.linkedinUrl} />
        </div>
      </div>
    </div>
  );
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className="truncate text-sm text-neutral-700">
        {value || <span className="italic text-neutral-300">—</span>}
      </span>
    </div>
  );
}
