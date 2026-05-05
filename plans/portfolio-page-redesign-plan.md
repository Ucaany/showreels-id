# Portfolio Page Redesign — Implementation Plan

## Overview

Redesign halaman portofolio (`PortfolioCreatorPublicPage`) dengan style **Bento UI Monochrome**, background gradient animasi (opacity ≤ 40%), responsif di mobile & desktop.

---

## Reference Analysis

Dari gambar referensi yang dilampirkan:
- **Background**: Gradient lembut biru muda (light blue / sky blue) dengan efek blur/glow — mirip aurora/mesh gradient
- **Warna dominan**: `#B8E4F0`, `#C5E8F4`, `#D0ECF6`, putih, dengan aksen biru (`#3B82F6` / `#2563EB`)
- **Style**: Clean, minimalis, monochrome bento cards

---

## Changes Summary

### 1. Background
- Hapus `bg-[#F5F5F4]` solid background
- Tambahkan animated gradient background (CSS keyframe) dengan opacity ≤ 40%
- Warna gradient: light blue tones (`#B8E4F0`, `#87CEEB`, `#A5D8E8`, `#D0ECF6`, `#E0F4FF`) + aksen biru (`#3B82F6`)
- Background fixed, full-screen, dengan animasi slow-moving blobs

### 2. Hapus Tombol
- ❌ Hapus tombol "Kembali" (ArrowLeft + "Kembali")
- ❌ Hapus tombol "Share" (`PublicShareQrActions`)
- ❌ Hapus tombol "Copy"
- Seluruh top bar (`<div className="mb-5 flex items-center justify-between gap-3">`) dihapus

### 3. Urutan Element Baru

```
┌─────────────────────────────────────────────┐
│  [Animated Gradient Background - opacity 35%]│
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │         (a) Avatar                  │    │
│  │         (b) Nama + ✓ Verified       │    │
│  │         (c) Role • @username        │    │
│  │         (d) Deskripsi (centered)    │    │
│  │                                     │    │
│  │  [Back to Bio] [Dashboard*]         │    │
│  │  * only if isOwner                  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Title: "Karya Creator"             │    │
│  │  [Semua] [Grid] [List]              │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌───┐ ┌───┐ ┌───┐                         │
│  │Vid│ │Vid│ │Vid│  (Grid/List cards)       │
│  └───┘ └───┘ └───┘                         │
│                                             │
└─────────────────────────────────────────────┘
```

### 4. Detail Perubahan per Element

#### (a) Avatar
- Centered, dengan border putih dan shadow
- Sama seperti sekarang tapi tanpa cover image di portfolio page

#### (b) Nama + Centang Biru
- Hapus label "Portfolio Creator" (uppercase tracking text)
- Nama besar, bold, centered
- Verified badge langsung setelah nama

#### (c) Role dan Username (disatukan)
- Format: `{role} • @{username}` dalam satu baris
- Jika tidak ada role: hanya `@{username}`

#### (d) Deskripsi
- `text-center` dan `max-w-lg mx-auto`
- Pastikan rata tengah dan sejajar (rapi)

#### (e) Tombol "Back to Bio" + "Dashboard" (conditional)
- Tombol "Back to Bio": rounded-full, dark button style, teks putih
- Tombol "Kembali ke Dashboard": hanya muncul jika `profile.isOwner === true`
- Link ke `/dashboard`
- Kedua tombol sejajar horizontal (flex row, gap)

#### (f) Title: "Karya Creator"
- Section heading: "Karya Creator"
- Subtitle/eyebrow dihapus ("Video Portfolio" uppercase text dihapus)

#### (g) List/Grid Mode Toggle
- Hapus "Semua" filter button
- Hanya Grid dan List toggle
- Penempatan: sejajar kanan dari title, atau di bawah title di mobile
- Rapi dan clean

#### (h) Video Cards
- Grid: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`
- List: `grid-cols-1` dengan layout horizontal di md+
- Card style: bento monochrome (white card, subtle border, rounded-2xl)
- Informasi video rapi: title, badges, description, date

---

## 5. Animated Background Implementation

Tambahkan CSS keyframes di `globals.css`:

```css
@keyframes portfolio-blob-move {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -20px) scale(1.05); }
  50% { transform: translate(-20px, 30px) scale(0.95); }
  75% { transform: translate(20px, 20px) scale(1.02); }
}
```

Background element (di dalam `PortfolioCreatorPublicPage`):
```tsx
<div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.35]">
  <div className="absolute -left-1/4 -top-1/4 h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,#87CEEB_0%,transparent_70%)] animate-[portfolio-blob-move_20s_ease-in-out_infinite]" />
  <div className="absolute -right-1/4 top-1/3 h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle,#B8E4F0_0%,transparent_70%)] animate-[portfolio-blob-move_25s_ease-in-out_infinite_reverse]" />
  <div className="absolute bottom-0 left-1/3 h-[45vh] w-[45vh] rounded-full bg-[radial-gradient(circle,#3B82F6_0%,#87CEEB_40%,transparent_70%)] animate-[portfolio-blob-move_30s_ease-in-out_infinite]" />
</div>
```

---

## 6. Button Styling Rules

Semua button hitam (`bg-[#111111]`) HARUS memiliki:
- `text-white` (bukan inherit)
- `[&_svg]:text-white` untuk icon
- Contoh class: `bg-[#111111] text-white font-bold rounded-full px-5 py-2.5 shadow-[0_14px_30px_rgba(17,17,17,0.16)] hover:bg-[#1E1E1E]`

---

## 7. Video Card Grid Responsiveness

```
Mobile (< 640px):    1 column
Tablet (640-1279px): 2 columns  
Desktop (≥ 1280px):  3 columns
```

Card content layout:
- Thumbnail (aspect-video, rounded-xl)
- Badges row (source, type, duration)
- Title (line-clamp-2, bold)
- Description (line-clamp-2, muted)
- Date + "Lihat Detail" link

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/public/public-creator-pages.tsx` | Rewrite `PortfolioCreatorPublicPage` function |
| `src/app/globals.css` | Add `@keyframes portfolio-blob-move` animation |
| `src/app/[slug]/show/page.tsx` | No changes needed (already passes `profile` with `isOwner`) |

---

## Implementation Steps

1. **Add CSS animation** to `globals.css` — the blob movement keyframe
2. **Rewrite `PortfolioCreatorPublicPage`** in `public-creator-pages.tsx`:
   - Remove top bar (back, share, copy buttons)
   - Add animated gradient background div
   - Restructure profile header: Avatar → Name+Badge → Role•Username → Description → Buttons
   - Add conditional "Kembali ke Dashboard" button (only if `profile.isOwner`)
   - Change section title to "Karya Creator"
   - Simplify filter bar (remove "Semua", keep Grid/List only)
   - Keep video grid with proper responsive classes
3. **Ensure all dark buttons have white text** — audit `darkButtonClass` usage
4. **Test responsiveness** — mobile-first grid, centered layout

---

## Design Tokens (Bento UI Monochrome)

```
Background page:     transparent (gradient behind)
Card background:     #FFFFFF (white)
Card border:         #E7E5E4
Card radius:         1.5rem (rounded-3xl)
Card shadow:         0 18px 50px rgba(17,17,17,0.06)
Text primary:        #111111
Text secondary:      #525252
Text muted:          #8A8A8A
Button dark bg:      #111111
Button dark text:    #FFFFFF
Badge bg:            #F5F5F4
Badge border:        #E7E5E4
Badge text:          #525252
```

---

## Notes

- Background gradient bergerak (animated blobs) dengan opacity 35% — tidak mengganggu readability
- Warna sesuai showreels.id brand (light blue / sky blue tones)
- Semua teks pada button hitam HARUS putih
- Grid video cards berfungsi baik di mobile (1 col) dan desktop (3 col)
- Informasi video rapi dan terbaca
- Tidak ada library eksternal tambahan — pure CSS animation
