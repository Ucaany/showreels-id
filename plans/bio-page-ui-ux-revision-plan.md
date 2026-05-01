# Implementation Plan: Revisi UI/UX Halaman Bio Showreels.id

**Tanggal:** 2026-05-02  
**Referensi PRD:** prd.md  
**Stack:** Next.js (App Router), React Server Components, Drizzle ORM, Supabase Auth, Tailwind CSS

---

## Ringkasan Arsitektur Saat Ini

| Layer | File | Deskripsi |
|-------|------|-----------|
| Route (public bio) | `src/app/[slug]/page.tsx` | Server Component; memanggil `getCurrentUser()` & `getPublicProfile(slug, userId)` |
| Server data | `src/server/public-data.ts` → `getPublicProfile()` | Mengambil user + videos, menghitung `isOwner` |
| UI Component | `src/components/public/public-creator-pages.tsx` → `BioCreatorPublicPage` | Render cover, avatar, nama, bio, social links, pinned videos, custom links |
| Social Links | `src/components/social-links.tsx` → `SocialLinks` | Pill/icon-card variant, flexbox layout |
| Cover rendering | `src/lib/image-crop.ts` → `getBackgroundImageCropStyle()` | CSS background-image + position + size |
| Auth | `src/server/current-user.ts` → `getCurrentUser()` | Supabase session → synced DB user |
| Dashboard Build Link | `src/app/dashboard/link-builder/page.tsx` | Halaman editor link builder |

---

## 1. Cover Image Logic (PRD §2.1)

### Status Saat Ini
✅ **Sudah sebagian besar terimplementasi.** `CreatorCover` component di `public-creator-pages.tsx` (line 40-58) sudah:
- Menampilkan `profile.user.coverImageUrl` jika ada
- Fallback ke thumbnail video pertama (`autoCoverImage`)
- Menggunakan `getBackgroundImageCropStyle()` yang sudah menerapkan `background-size` dan `background-position`

### Perubahan yang Diperlukan

| # | Perubahan | File | Detail |
|---|-----------|------|--------|
| 1.1 | Perbaiki fallback default | `public-creator-pages.tsx` → `CreatorCover` | Jika `coverImage` kosong DAN tidak ada video, tampilkan gradient placeholder saja (sudah ada via `bg-[radial-gradient(...)]`). **Tidak perlu perubahan besar**, hanya pastikan tidak ada broken image. |
| 1.2 | Tambahkan `object-fit: cover` pada background | `src/lib/image-crop.ts` | Tambahkan `objectFit: 'cover'` di style output ATAU pastikan `backgroundSize` minimal `cover` ketika zoom = 100%. Saat ini menggunakan `backgroundSize: ${crop.zoom}%` yang bisa < 100% jika zoom default. **Fix:** Ubah minimum zoom menjadi `cover` equivalent. |
| 1.3 | Responsif aspect ratio | `public-creator-pages.tsx` | Sudah ada responsive height classes (`h-[132px] min-[375px]:h-[152px]...`). ✅ Tidak perlu perubahan. |

### Implementasi Teknis

```tsx
// src/lib/image-crop.ts — Perubahan pada getBackgroundImageCropStyle
export function getBackgroundImageCropStyle(
  imageUrl: string,
  values?: ImageCropValues | null,
  overlay?: string
): CSSProperties {
  const crop = normalizeImageCrop(values);
  const backgroundLayers = overlay ? `${overlay}, url(${imageUrl})` : `url(${imageUrl})`;
  
  // Gunakan 'cover' sebagai minimum agar gambar tidak gepeng
  const sizeValue = crop.zoom <= 100 ? "cover" : `${crop.zoom}%`;

  return {
    backgroundImage: backgroundLayers,
    backgroundPosition: `calc(50% + ${crop.x}%) calc(50% + ${crop.y}%)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: sizeValue,
  };
}
```

---

## 2. Verified Badge / Centang Biru Otomatis (PRD §2.2)

### Status Saat Ini
❌ **Belum ada implementasi.** Tidak ada logika verified badge di codebase.

### Arsitektur Desain

**Pendekatan: Computed at render-time (bukan stored in DB)**

Alasan: Badge ini bersifat derivatif (dihitung dari data yang sudah ada). Menyimpannya di DB akan memerlukan trigger/cron untuk sinkronisasi. Lebih sederhana dan akurat jika dihitung saat render.

### Data yang Dibutuhkan (sudah tersedia di `getPublicProfile` return)

| Kondisi | Field | Cek |
|---------|-------|-----|
| Bio terisi | `profile.user.bio` | `bio.trim().length > 0` |
| Skill ≥ 1 | `profile.user.skills` | `skills.length > 0` |
| Video ≥ 1 | `profile.videos` | `videos.length > 0` |

### File yang Perlu Diubah

| # | File | Perubahan |
|---|------|-----------|
| 2.1 | `src/lib/profile-utils.ts` | Tambah fungsi `isProfileVerified(profile)` |
| 2.2 | `src/components/public/public-creator-pages.tsx` | Render badge di samping nama |
| 2.3 | (Opsional) `src/components/verified-badge.tsx` | Komponen reusable untuk ikon centang biru |

### Implementasi Teknis

```tsx
// src/lib/profile-utils.ts — Tambahkan fungsi baru
export function isProfileVerified(profile: {
  user: { bio: string; skills: string[] };
  videos: unknown[];
}): boolean {
  const hasBio = profile.user.bio.trim().length > 0;
  const hasSkill = profile.user.skills.length > 0;
  const hasVideo = profile.videos.length > 0;
  return hasBio && hasSkill && hasVideo;
}
```

```tsx
// src/components/verified-badge.tsx — Komponen baru
import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <BadgeCheck
      className={`inline-block h-5 w-5 text-blue-500 ${className}`}
      aria-label="Verified Creator"
    />
  );
}
```

```tsx
// Di BioCreatorPublicPage — setelah <h1> nama
import { isProfileVerified } from "@/lib/profile-utils";
import { VerifiedBadge } from "@/components/verified-badge";

// Di dalam render:
<h1 className="mt-5 max-w-full text-3xl font-bold tracking-[-0.04em] text-[#111111] sm:text-4xl">
  {profile.user.name || "Creator"}
  {isProfileVerified(profile) && <VerifiedBadge className="ml-2 align-middle" />}
</h1>
```

---

## 3. Owner View Navigation (PRD §2.3)

### Status Saat Ini
⚠️ **Sebagian ada.** Di `src/app/[slug]/page.tsx` line 89, `currentUser.id` sudah dikirim ke `getPublicProfile(slug, currentUser?.id)`. Di server, `isOwner` sudah dihitung (line 459 `public-data.ts`). **TAPI** `isOwner` tidak dikembalikan ke client — hanya digunakan untuk visibility check.

### Arsitektur Desain

1. **Tambahkan `isOwner` ke return value `getPublicProfile()`**
2. **Pass `isOwner` ke `BioCreatorPublicPage` component**
3. **Render floating button "Edit Tampilan" hanya jika `isOwner === true`**

### File yang Perlu Diubah

| # | File | Perubahan |
|---|------|-----------|
| 3.1 | `src/server/public-data.ts` | Tambahkan `isOwner` ke return object `getPublicProfile()` |
| 3.2 | `src/components/public/public-creator-pages.tsx` | Terima prop `isOwner`, render floating button |
| 3.3 | `src/components/owner-edit-button.tsx` (baru) | Client component untuk floating button |

### Implementasi Teknis

```ts
// src/server/public-data.ts — Di dalam getPublicProfile(), ubah return:
return {
  user: { ...user, customLinks: normalizeCustomLinks(user.customLinks) },
  videos: profileVideos,
  pinnedVideos,
  whitelabelEnabled,
  businessPlanActive,
  isOwner, // ← TAMBAHKAN INI
};
```

```tsx
// src/components/owner-edit-button.tsx — Komponen baru (Client Component)
"use client";

import Link from "next/link";
import { PencilLine } from "lucide-react";

export function OwnerEditButton() {
  return (
    <Link
      href="/dashboard/link-builder"
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(17,17,17,0.2)] transition hover:bg-[#1E1E1E] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#111111]/30 sm:right-6 sm:top-6"
    >
      <PencilLine className="h-4 w-4" />
      Edit Tampilan
    </Link>
  );
}
```

```tsx
// Di BioCreatorPublicPage — tambahkan di awal <main>:
export function BioCreatorPublicPage({ profile }: { profile: PublicProfile }) {
  // ...
  return (
    <div className={pageShellClass}>
      {profile.isOwner && <OwnerEditButton />}
      <main>...</main>
    </div>
  );
}
```

**Type update:** `PublicProfile` type sudah otomatis ter-infer dari return type `getPublicProfile`, jadi setelah menambahkan `isOwner` ke return, type akan otomatis include field tersebut.

---

## 4. Real-Time Data Sync (PRD §2.4)

### Status Saat Ini
✅ **Sudah sebagian besar benar.** Arsitektur saat ini:
- Halaman bio (`/[slug]`) adalah **Server Component** yang fetch data fresh setiap request
- Next.js `unstable_cache` digunakan untuk landing stats (60s revalidate), tapi `getPublicProfile()` **TIDAK** di-cache → data selalu fresh

### Analisis

Karena `getPublicProfile()` dipanggil langsung tanpa cache wrapper, setiap kali user mengakses/refresh halaman bio, data terbaru dari DB akan ditampilkan. Ini sudah memenuhi requirement "langsung terefleksi saat halaman diakses/di-refresh".

### Perubahan yang Diperlukan

| # | Perubahan | Alasan |
|---|-----------|--------|
| 4.1 | Tidak ada perubahan server-side | Data sudah fresh per-request |
| 4.2 | (Opsional) Tambahkan `revalidatePath` di save actions | Jika ingin ISR/cache di masa depan |

### Rekomendasi Tambahan (Opsional, untuk UX lebih baik)

Jika di masa depan ingin menambahkan **instant preview tanpa refresh** saat owner melihat halaman bio sendiri setelah save di Build Link:

```ts
// Di server action save link-builder (src/server/link-builder-storage.ts)
import { revalidatePath } from "next/cache";

// Setelah save berhasil:
revalidatePath(`/${user.username}`);
```

Ini memastikan jika Next.js menambahkan caching di route tersebut, path akan di-invalidate.

---

## 5. Social Media Layout (PRD §3.1)

### Status Saat Ini
⚠️ **Sudah menggunakan flexbox + flex-wrap**, tapi styling bisa diperbaiki untuk konsistensi gap dan alignment.

Kode saat ini di `SocialLinks` (pill variant):
```tsx
<div className="flex flex-wrap gap-2 {className}">
```

Dan dipanggil dengan:
```tsx
<SocialLinks className="mt-5 justify-center" ... />
```

### Perubahan yang Diperlukan

| # | File | Perubahan |
|---|------|-----------|
| 5.1 | `src/components/social-links.tsx` | Perbaiki gap menjadi `gap-2.5` (10px), tambahkan consistent padding pada pill |
| 5.2 | `src/components/social-links.tsx` | Pastikan `justify-center` selalu diterapkan di pill variant untuk public page |

### Implementasi Teknis

```tsx
// src/components/social-links.tsx — Update baseLinkClass
const baseLinkClass =
  "inline-flex items-center gap-2 rounded-full border border-[#E1E1DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#525252] transition hover:border-[#111111] hover:text-[#111111] hover:shadow-sm";

// Update container div (pill variant):
<div
  className={`${
    balanced ? "grid grid-cols-2 gap-2.5" : "flex flex-wrap justify-center gap-2.5"
  } ${className}`.trim()}
>
```

Perubahan:
- `gap-2` → `gap-2.5` (10px) untuk jarak lebih lega
- `px-3` → `px-3.5` dan `py-1.5` → `py-2` untuk pill yang lebih proporsional
- Border color disesuaikan dengan design system monochrome (`#E1E1DF`)
- Default `justify-center` pada non-balanced mode

---

## 6. Tipografi & Spasi (PRD §3.2)

### Status Saat Ini
✅ **Sudah cukup baik.** Spacing vertikal di `BioCreatorPublicPage`:
- Cover → Avatar: `-mt-8` (overlap)
- Avatar → Nama: `mt-5`
- Nama → Username: `mt-1`
- Username → Role: `mt-2`
- Role → Bio: `mt-4`
- Bio → Social: `mt-5`
- Social → Links: `mt-7`

### Rekomendasi Minor

Tidak ada perubahan besar diperlukan. Spacing sudah konsisten dan proporsional.

---

## Ringkasan Perubahan per File

| File | Tipe | Perubahan |
|------|------|-----------|
| `src/lib/image-crop.ts` | Modify | Fix `backgroundSize` minimum ke `cover` |
| `src/lib/profile-utils.ts` | Modify | Tambah `isProfileVerified()` |
| `src/components/verified-badge.tsx` | **New** | Komponen ikon centang biru |
| `src/components/owner-edit-button.tsx` | **New** | Floating button "Edit Tampilan" |
| `src/server/public-data.ts` | Modify | Return `isOwner` dari `getPublicProfile()` |
| `src/components/public/public-creator-pages.tsx` | Modify | Render verified badge + owner button |
| `src/components/social-links.tsx` | Modify | Perbaiki gap, padding, dan alignment |

---

## Urutan Implementasi (Execution Order)

1. **`src/lib/image-crop.ts`** — Fix cover image sizing (low risk, isolated)
2. **`src/lib/profile-utils.ts`** — Tambah `isProfileVerified()` (pure function, no side effects)
3. **`src/components/verified-badge.tsx`** — Buat komponen baru
4. **`src/components/owner-edit-button.tsx`** — Buat komponen baru
5. **`src/server/public-data.ts`** — Tambah `isOwner` ke return
6. **`src/components/public/public-creator-pages.tsx`** — Integrasikan semua: badge, owner button, cover fix
7. **`src/components/social-links.tsx`** — Perbaiki layout pill buttons

---

## Acceptance Criteria Mapping

| AC# | Requirement | Solusi | Status |
|-----|-------------|--------|--------|
| 1 | Cover responsif tanpa distorsi | Fix `backgroundSize` minimum `cover` | Ready to implement |
| 2 | Centang biru hanya jika Bio + Skill + Video | `isProfileVerified()` computed at render | Ready to implement |
| 3 | Tombol edit hanya untuk owner | `isOwner` dari server + conditional render | Ready to implement |
| 4 | Social buttons wrap rapi | Flexbox `flex-wrap` + `gap-2.5` + `justify-center` | Ready to implement |
| 5 | Perubahan di Build Link langsung muncul | Sudah bekerja (no cache on `getPublicProfile`) | ✅ Already working |

---

## Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Type inference break setelah tambah `isOwner` | Build error | Type `PublicProfile` di-infer otomatis dari return type |
| `backgroundSize: cover` mengubah tampilan existing covers | Visual regression | Hanya berlaku jika zoom ≤ 100%, yang sebelumnya sudah default 100% |
| Owner button muncul di SSR (flash) | UX | Button adalah server-rendered conditional, tidak ada flash |
| Verified badge muncul/hilang saat data berubah | Confusion | Badge dihitung real-time, selalu akurat |
