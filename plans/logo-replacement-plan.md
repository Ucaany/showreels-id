# Rencana Penggantian Logo Showreels.id

## 📋 Overview

Mengganti logo di seluruh aplikasi dari ikon `Link2` (lucide-react) menjadi gambar logo baru [`1.png`](../1.png:1) dengan memastikan ukuran dan penempatan yang konsisten di semua halaman.

## 🎯 Tujuan

1. Mengganti semua instance logo dengan file gambar [`1.png`](../1.png:1)
2. Memastikan ukuran logo konsisten dan proporsional
3. Menjaga responsive behavior di berbagai ukuran layar
4. Menghilangkan variasi dark/light mode (menggunakan satu logo untuk semua)

## 📍 Lokasi Logo Saat Ini

Berdasarkan analisis kode, logo saat ini digunakan di komponen [`AppLogo`](../src/components/app-logo.tsx:1) yang dipanggil di:

1. **Landing Page** - [`landing-page.tsx`](../src/components/landing-page.tsx:719)
2. **Auth Pages** - [`auth-shell.tsx`](../src/components/auth/auth-shell.tsx:59)
3. **Dashboard** - [`dashboard-shell.tsx`](../src/components/dashboard/dashboard-shell.tsx:232)
4. **Public Video Page** - [`public-video-client-page.tsx`](../src/app/v/[slug]/public-video-client-page.tsx:67)
5. **Public Mobile Header** - [`public-mobile-header.tsx`](../src/components/public-mobile-header.tsx:22)
6. **Site Maintenance Gate** - [`site-maintenance-gate.tsx`](../src/components/site-maintenance-gate.tsx:50)

## 🔧 Implementasi Detail

### 1. Persiapan File Logo

**File Source:** [`1.png`](../1.png:1) (905 KB, blue chain link icon)

**Action:**
- Pindahkan `1.png` ke direktori `public/` dengan nama `logo.png`
- Pertimbangkan optimasi ukuran file jika diperlukan (compress tanpa mengurangi kualitas)

**Lokasi Final:** `public/logo.png`

### 2. Update Komponen AppLogo

**File:** [`src/components/app-logo.tsx`](../src/components/app-logo.tsx:1)

**Perubahan:**

#### Before (Current):
```tsx
import Link from "next/link";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function AppLogo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const darkTone = tone === "dark";

  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "inline-flex h-[2.15rem] w-[2.15rem] items-center justify-center rounded-full border sm:h-9 sm:w-9",
          darkTone
            ? "border-brand-200 bg-white text-brand-600"
            : "border-white/25 bg-white/15 text-white"
        )}
      >
        <Link2 className="h-4 w-4" />
      </span>
      <span
        className={cn(
          "text-[1rem] font-semibold tracking-[-0.02em] sm:text-[1.04rem]",
          darkTone ? "text-[#1f1a17]" : "text-[#f6f3f0]"
        )}
      >
        showreels.id
      </span>
    </Link>
  );
}
```

#### After (Proposed):
```tsx
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

export function AppLogo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const darkTone = tone === "dark";

  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <div className="relative h-[2.15rem] w-[2.15rem] sm:h-9 sm:w-9">
        <Image
          src="/logo.png"
          alt="Showreels.id Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      <span
        className={cn(
          "text-[1rem] font-semibold tracking-[-0.02em] sm:text-[1.04rem]",
          darkTone ? "text-[#1f1a17]" : "text-[#f6f3f0]"
        )}
      >
        showreels.id
      </span>
    </Link>
  );
}
```

**Key Changes:**
- ✅ Hapus import `Link2` dari lucide-react
- ✅ Tambah import `Image` dari next/image
- ✅ Ganti icon wrapper dengan container Image
- ✅ Hapus styling border dan background (tidak diperlukan untuk gambar)
- ✅ Gunakan `fill` prop dengan `object-contain` untuk menjaga aspect ratio
- ✅ Tambah `priority` untuk logo di above-the-fold content
- ✅ Pertahankan ukuran yang sama: `h-[2.15rem] w-[2.15rem]` mobile, `h-9 w-9` desktop
- ✅ Hapus conditional styling berdasarkan tone (logo sama untuk semua)

### 3. Ukuran dan Penempatan

**Ukuran Standar:**
- **Mobile:** 34.4px × 34.4px (`h-[2.15rem] w-[2.15rem]`)
- **Desktop (sm+):** 36px × 36px (`h-9 w-9`)

**Spacing:**
- Gap antara logo dan teks: `gap-2.5` (10px)

**Alignment:**
- Vertical: `items-center`
- Display: `inline-flex`

### 4. Optimasi Logo (Optional)

Jika ukuran file 905 KB terlalu besar, pertimbangkan:

1. **Compress PNG:**
   - Tool: TinyPNG, ImageOptim, atau sharp
   - Target: < 100 KB tanpa kehilangan kualitas visual

2. **Convert ke WebP:**
   - Format lebih efisien
   - Next.js Image otomatis serve WebP jika browser support

3. **Multiple Sizes:**
   - Buat versi 1x (72px) dan 2x (144px) untuk retina display
   - Next.js Image akan otomatis pilih yang sesuai

## 📱 Responsive Behavior

### Breakpoints
- **Mobile (< 640px):** Logo 34.4px
- **Desktop (≥ 640px):** Logo 36px

### Testing Points
1. ✅ Landing page header (sticky/fixed)
2. ✅ Auth pages (centered layout)
3. ✅ Dashboard sidebar (collapsed/expanded)
4. ✅ Mobile menu overlay
5. ✅ Public video page header

## 🎨 Visual Consistency

### Background Compatibility
Logo harus terlihat baik di:
- ✅ Background putih (landing page, dashboard)
- ✅ Background gelap (hero section, mobile menu)
- ✅ Background gradient (auth pages)
- ✅ Background transparan (overlay)

**Note:** Logo [`1.png`](../1.png:1) memiliki background putih/light gray. Jika perlu tampil di background gelap, pertimbangkan:
- Tambah subtle shadow atau outline
- Atau buat versi dengan background transparan

## 🧪 Testing Checklist

### Functional Testing
- [ ] Logo muncul di semua halaman yang menggunakan `AppLogo`
- [ ] Link ke homepage (`/`) berfungsi
- [ ] Image loading dengan benar (tidak broken)
- [ ] Alt text accessible untuk screen readers

### Visual Testing
- [ ] Ukuran proporsional di mobile (34.4px)
- [ ] Ukuran proporsional di desktop (36px)
- [ ] Spacing konsisten dengan teks "showreels.id"
- [ ] Alignment vertikal center
- [ ] Tidak ada distorsi atau stretching

### Performance Testing
- [ ] Logo load dengan cepat (< 1s)
- [ ] Next.js Image optimization aktif
- [ ] Priority loading untuk above-the-fold
- [ ] Tidak ada layout shift (CLS)

### Cross-browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (desktop & mobile)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

## 📦 Deliverables

1. ✅ File `public/logo.png` (optimized)
2. ✅ Updated [`src/components/app-logo.tsx`](../src/components/app-logo.tsx:1)
3. ✅ Verified di semua 6+ lokasi penggunaan
4. ✅ Dokumentasi perubahan (file ini)

## ⚠️ Potential Issues & Solutions

### Issue 1: Logo terlalu besar (file size)
**Solution:** Compress dengan TinyPNG atau convert ke WebP

### Issue 2: Logo tidak terlihat di background gelap
**Solution:** 
- Tambah `drop-shadow` CSS
- Atau edit logo untuk tambah outline/stroke

### Issue 3: Logo blur di retina display
**Solution:** Pastikan logo minimal 2x ukuran display (72px untuk 36px display)

### Issue 4: Layout shift saat loading
**Solution:** Gunakan `priority` prop dan fixed dimensions

## 🚀 Deployment Notes

1. Pastikan `public/logo.png` ter-commit ke repository
2. Verify build production (`npm run build`)
3. Test di staging environment sebelum production
4. Monitor Core Web Vitals (LCP, CLS) setelah deploy

## 📝 Future Considerations

1. **Favicon:** Update favicon untuk match logo baru
2. **OG Image:** Update Open Graph image untuk social sharing
3. **PWA Icons:** Update app icons jika ada PWA manifest
4. **Email Templates:** Update logo di email notifications (jika ada)

---

**Created:** 2026-04-29  
**Status:** Ready for Implementation  
**Estimated Complexity:** Low-Medium
