# Rencana Implementasi Final — Dashboard Monochrome Redesign

## Ringkasan Keputusan

**Pendekatan**: Penggantian komponen lengkap dengan versi PRD
- ✅ Ganti komponen existing dengan komponen dari PRD
- ✅ Gunakan data hardcoded sesuai PRD (Fauzan Al Anshari, @ucaany)
- ✅ Sederhanakan fitur untuk fokus pada desain ultra-clean
- ✅ Hapus kompleksitas yang tidak perlu (onboarding stepper, trial banner, dll)

## Strategi Implementasi

### Fase 1: Komponen Inti Dashboard (PRIORITAS TINGGI)

#### 1.1 Ganti DashboardShell Sepenuhnya
**File**: [`src/components/dashboard/dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:1)

**Aksi**: Ganti seluruh file dengan komponen dari PRD yang sudah disesuaikan

**Komponen Baru**:
- `Sidebar()` - Desktop sidebar dengan logo chip, plan badge, menu
- `TopHeader()` - Header dengan breadcrumb dan user info
- `BottomNavigation()` - Mobile bottom nav (4 items)
- `DashboardShell()` - Main wrapper component

**Data Hardcoded**:
```typescript
const navItems = [
  { label: "Overview", icon: Home, active: true },
  { label: "Build Link", icon: Link2 },
  { label: "Videos", icon: Film },
  { label: "Analytics", icon: BarChart3 },
  { label: "Billing", icon: CreditCard },
  { label: "Profile", icon: User },
  { label: "Settings", icon: Settings },
];
```

**Hapus**:
- Integrasi Supabase auth
- Language switcher
- Dynamic plan detection
- Onboarding logic
- Mobile menu drawer (ganti dengan bottom nav)

#### 1.2 Buat Dashboard Overview Page Baru
**File**: [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:1)

**Aksi**: Ganti dengan komponen `ShowreelsDashboard` dari PRD

**Komponen Baru**:
- `StatusBadge()` - Badge untuk status (Public/Draft)
- `StatCard()` - Card untuk metrics (Total Views, Total Video, dll)
- `VideoCard()` - Card untuk video list
- `HeroCard` - Welcome card dengan CTA
- `PublicLinkCard` - Card untuk public creator page
- `QuickActionsCard` - Card untuk aksi cepat

**Data Hardcoded**:
```typescript
const stats = [
  { label: "Total Views", value: "18", delta: "+12%" },
  { label: "Total Video", value: "1", delta: "+1" },
  { label: "Public Video", value: "1", delta: "Ready" },
  { label: "Total Click", value: "0", delta: "0%" },
];

const videos = [
  {
    title: "The Capsule Hotel",
    date: "24 Apr 2026",
    source: "Google Drive",
    status: "Public",
  },
  {
    title: "Brand Story — Opening Scene",
    date: "Draft preview",
    source: "Portfolio Script",
    status: "Draft",
  },
];
```

**User Info Hardcoded**:
```typescript
const user = {
  name: "Fauzan Al Anshari",
  username: "ucaany",
  role: "Script Writer",
};
```

**Hapus**:
- Database queries
- Dynamic data fetching
- Onboarding reminder card
- Trial banner
- Complex metric calculations

---

### Fase 2: Halaman Dashboard Lainnya (PRIORITAS SEDANG)

#### 2.1 Videos Page - Simplified
**File**: [`src/app/dashboard/videos/page.tsx`](src/app/dashboard/videos/page.tsx:1)

**Konten**: Halaman sederhana dengan:
- Hero section dengan CTA "Upload Video"
- List video hardcoded (sama seperti dashboard overview)
- Styling monochrome sesuai design system

#### 2.2 Analytics Page - Simplified
**File**: [`src/app/dashboard/analytics/page.tsx`](src/app/dashboard/analytics/page.tsx:1)

**Konten**: Halaman sederhana dengan:
- Summary metrics (hardcoded)
- Placeholder untuk chart
- Tips card

#### 2.3 Billing Page - Simplified
**File**: [`src/app/dashboard/billing/page.tsx`](src/app/dashboard/billing/page.tsx:1)

**Konten**: Halaman sederhana dengan:
- Current plan card (Free plan aktif)
- Upgrade options
- Pricing comparison

#### 2.4 Profile Page - Simplified
**File**: [`src/app/dashboard/profile/page.tsx`](src/app/dashboard/profile/page.tsx:1)

**Konten**: Form sederhana untuk:
- Name
- Username
- Bio
- Avatar upload placeholder

#### 2.5 Settings Page - Simplified
**File**: [`src/app/dashboard/settings/page.tsx`](src/app/dashboard/settings/page.tsx:1)

**Konten**: List settings sederhana:
- Account settings
- Privacy settings
- Notification settings

---

### Fase 3: Komponen UI Dasar (PRIORITAS RENDAH)

#### 3.1 Update Button Component
**File**: [`src/components/ui/button.tsx`](src/components/ui/button.tsx:1)

**Variants Baru**:
```typescript
// Primary - Zinc dark
bg-zinc-800 text-white hover:bg-zinc-700

// Secondary - Slate light
border-slate-200 bg-white text-slate-900 hover:bg-slate-100
```

**Hapus**: Semua variant blue

#### 3.2 Update Badge Component
**File**: [`src/components/ui/badge.tsx`](src/components/ui/badge.tsx:1)

**Variants Baru**:
```typescript
// Success/Positive - Emerald
bg-emerald-50 text-emerald-600

// Neutral - Slate
bg-slate-100 text-slate-500
```

**Hapus**: Semua variant blue

#### 3.3 Update Card Component
**File**: [`src/components/ui/card.tsx`](src/components/ui/card.tsx:1)

**Default Style**:
```typescript
border-slate-200 bg-white rounded-2xl
```

---

## Struktur File Baru

```
src/
├── app/
│   └── dashboard/
│       ├── page.tsx (GANTI TOTAL - Komponen dari PRD)
│       ├── layout.tsx (UPDATE - Gunakan DashboardShell baru)
│       ├── videos/
│       │   └── page.tsx (SEDERHANAKAN)
│       ├── analytics/
│       │   └── page.tsx (SEDERHANAKAN)
│       ├── billing/
│       │   └── page.tsx (SEDERHANAKAN)
│       ├── profile/
│       │   └── page.tsx (SEDERHANAKAN)
│       └── settings/
│           └── page.tsx (SEDERHANAKAN)
│
└── components/
    ├── dashboard/
    │   └── dashboard-shell.tsx (GANTI TOTAL - Komponen dari PRD)
    │
    └── ui/
        ├── button.tsx (UPDATE VARIANTS)
        ├── badge.tsx (UPDATE VARIANTS)
        └── card.tsx (UPDATE DEFAULTS)
```

---

## Checklist Implementasi

### ✅ Fase 1: Komponen Inti (Hari 1)
- [ ] Backup file existing ke folder `/backup`
- [ ] Ganti [`dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:1) dengan komponen PRD
- [ ] Ganti [`dashboard/page.tsx`](src/app/dashboard/page.tsx:1) dengan komponen PRD
- [ ] Test navigasi desktop dan mobile
- [ ] Verifikasi bottom navigation muncul di mobile
- [ ] Verifikasi sidebar muncul di desktop

### ✅ Fase 2: Halaman Lainnya (Hari 2)
- [ ] Sederhanakan Videos page
- [ ] Sederhanakan Analytics page
- [ ] Sederhanakan Billing page
- [ ] Sederhanakan Profile page
- [ ] Sederhanakan Settings page
- [ ] Test navigasi antar halaman

### ✅ Fase 3: UI Components (Hari 2)
- [ ] Update Button variants
- [ ] Update Badge variants
- [ ] Update Card defaults
- [ ] Search & replace sisa warna blue
- [ ] Test semua komponen

### ✅ Fase 4: QA & Polish (Hari 3)
- [ ] Visual testing desktop (1920px, 1366px, 1024px)
- [ ] Visual testing mobile (375px, 414px, 768px)
- [ ] Test semua navigasi
- [ ] Test responsive breakpoints
- [ ] Verifikasi tidak ada warna blue
- [ ] Verifikasi semua card pakai slate-200 border
- [ ] Verifikasi active state pakai zinc-800

---

## Data Hardcoded yang Digunakan

### User Profile
```typescript
{
  name: "Fauzan Al Anshari",
  username: "ucaany",
  email: "fauzan@example.com",
  role: "Script Writer",
  avatar: "/placeholder-avatar.jpg",
}
```

### Statistics
```typescript
{
  totalViews: 18,
  totalVideos: 1,
  publicVideos: 1,
  totalClicks: 0,
}
```

### Videos
```typescript
[
  {
    id: 1,
    title: "The Capsule Hotel",
    date: "24 Apr 2026",
    source: "Google Drive",
    status: "Public",
    thumbnail: "/placeholder-video.jpg",
  },
  {
    id: 2,
    title: "Brand Story — Opening Scene",
    date: "Draft preview",
    source: "Portfolio Script",
    status: "Draft",
    thumbnail: "/placeholder-video.jpg",
  },
]
```

### Plan Info
```typescript
{
  planName: "Free",
  status: "active",
  features: ["1 Video", "Public Profile", "Basic Analytics"],
}
```

---

## Fitur yang Dihapus (Simplifikasi)

### Dari DashboardShell:
- ❌ Supabase authentication integration
- ❌ Language switcher (usePreferences)
- ❌ Dynamic plan detection
- ❌ Auth status alerts
- ❌ Mobile drawer menu (diganti bottom nav)
- ❌ Logout functionality (sementara)
- ❌ Help center link

### Dari Dashboard Overview:
- ❌ Database queries (videos, visitorEvents)
- ❌ Onboarding stepper
- ❌ Onboarding reminder card
- ❌ Trial banner
- ❌ Dynamic metrics calculation
- ❌ Real-time data fetching
- ❌ Subscription policy checks

### Dari Child Pages:
- ❌ Form submissions
- ❌ File uploads
- ❌ API integrations
- ❌ Real-time updates
- ❌ Complex state management

---

## Acceptance Criteria (dari PRD)

- [x] Desktop menggunakan sidebar kiri dan top header
- [x] Mobile menggunakan bottom navigation, bukan sidebar
- [x] Semua card memakai `bg-white border border-slate-200 rounded-2xl`
- [x] Active menu dan primary button memakai `bg-zinc-800 text-white`
- [x] Status positif memakai emerald pastel
- [x] Grid responsif: desktop bento, mobile satu kolom
- [x] Tidak ada gradient mencolok atau warna biru dominan
- [x] Komponen dapat langsung dipakai di Next.js dengan Tailwind dan lucide-react

---

## Timeline Estimasi

### Hari 1 (4-5 jam)
- Backup files existing
- Implementasi DashboardShell baru
- Implementasi Dashboard Overview baru
- Testing navigasi dasar

### Hari 2 (4-5 jam)
- Sederhanakan semua child pages
- Update UI components
- Testing antar halaman

### Hari 3 (2-3 jam)
- QA menyeluruh
- Responsive testing
- Bug fixes
- Polish final

**Total: 10-13 jam kerja**

---

## Catatan Penting

1. **Backup**: Semua file existing akan di-backup ke folder `/backup` sebelum diganti
2. **Git Branch**: Buat branch baru `feature/dashboard-prd-implementation`
3. **Incremental Testing**: Test setelah setiap fase selesai
4. **Rollback Ready**: Simpan commit setelah setiap fase untuk rollback mudah
5. **Documentation**: Update README dengan perubahan yang dilakukan

---

## Next Steps

1. ✅ **Review plan ini** - Pastikan sesuai ekspektasi
2. ✅ **Konfirmasi untuk mulai** - Siap switch ke Code mode
3. 🚀 **Mulai implementasi** - Fase 1: Komponen Inti
4. 🧪 **Testing bertahap** - Test setelah setiap fase
5. 🎉 **Deploy** - Setelah semua QA pass

---

## Siap untuk Implementasi?

Plan sudah lengkap dan siap dieksekusi. Ketika Anda siap, saya akan:
1. Switch ke **Code mode**
2. Mulai dengan **Fase 1** (backup + ganti komponen inti)
3. Test setiap perubahan
4. Lanjut ke fase berikutnya

Apakah Anda ingin saya mulai implementasi sekarang?
