# PRD Revisi — Dashboard Showreels.id UI/UX Improvements

## Ringkasan Revisi

Berdasarkan PRD revisi, ada 7 area perbaikan utama untuk dashboard yang sudah diimplementasi:

1. **Active Menu Readability** - Menu aktif harus lebih terbaca
2. **Public Link Card Compact** - Kurangi spacing dan optimalkan layout tombol
3. **Stats Mobile 4 Columns** - Grid statistik mobile tetap 4 kolom compact
4. **Collapsible Sidebar** - Sidebar desktop bisa ditutup/slide
5. **Logo Workspace** - Ganti icon dengan logo landing page
6. **Hero Buttons Compact** - CTA lebih kecil dan efisien
7. **Public Link Spacing** - Kurangi margin dan space kosong

## Gap Analysis

### 1. Active Menu Readability ✅ SUDAH BENAR
**Status Saat Ini**: Sudah menggunakan `bg-zinc-800 text-white`
**File**: [`dashboard-shell.tsx:162`](src/components/dashboard/dashboard-shell.tsx:162)
```typescript
active ? "bg-zinc-800 text-white" : "text-slate-900 hover:bg-slate-100"
```
**Icon**: Line 167 sudah `text-white` untuk active state
**Action**: ✅ No changes needed

### 2. Public Link Card Compact ❌ PERLU PERBAIKAN
**Status Saat Ini**: Card menggunakan spacing default
**File**: [`dashboard/page.tsx:116`](src/app/dashboard/page.tsx:116)
**Issues**:
- Spacing terlalu besar antara elemen
- Tombol ShareProfileActions bisa lebih compact
- Perlu optimasi layout

**Action Required**:
- Update spacing dari `space-y-6` ke `space-y-3`
- Buat tombol lebih compact: `h-9 px-3 text-sm`
- Optimalkan [`share-profile-actions.tsx`](src/components/dashboard/share-profile-actions.tsx:1)

### 3. Stats Mobile 4 Columns ❌ PERLU PERBAIKAN
**Status Saat Ini**: Grid menggunakan `grid-cols-2` di mobile
**File**: [`dashboard/page.tsx:166`](src/app/dashboard/page.tsx:166)
```typescript
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

**Action Required**:
- Change to: `grid grid-cols-4 gap-2 md:gap-4`
- Update card mobile: `p-2.5 rounded-xl min-h-[88px]` untuk mobile
- Hide badge di mobile atau buat sangat kecil
- Angka mobile: `text-xl` instead of `text-3xl`

### 4. Collapsible Sidebar ❌ BELUM ADA
**Status Saat Ini**: Sidebar fixed width, tidak bisa collapse
**File**: [`dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:1)

**Action Required**:
- Add state: `const [sidebarOpen, setSidebarOpen] = useState(true)`
- Update sidebar width: `${sidebarOpen ? 'w-72' : 'w-20'}`
- Add toggle button di header atau sidebar
- Hide labels saat collapsed
- Add transition: `transition-all duration-300 ease-in-out`

### 5. Logo Workspace ❌ PERLU PERBAIKAN
**Status Saat Ini**: Menggunakan icon Link2
**File**: [`dashboard-shell.tsx:174`](src/components/dashboard/dashboard-shell.tsx:174)

**Action Required**:
- Ganti dengan `<img src="/logo.png" />` atau path logo yang sesuai
- Add fallback ke icon jika image gagal load
- Maintain size: `h-8 w-8`

### 6. Hero Buttons Compact ❌ PERLU PERBAIKAN
**Status Saat Ini**: Button menggunakan size default
**File**: [`dashboard/page.tsx:96`](src/app/dashboard/page.tsx:96)

**Action Required**:
- Update button height: `h-10` instead of default
- Update padding: `px-3.5` instead of `px-4 py-2.5`
- Update font: `text-sm font-medium`
- Update hero card padding: `p-5 md:p-6` instead of `p-5 md:p-6` (sudah benar)

### 7. Public Link Spacing ❌ PERLU PERBAIKAN
**Status Saat Ini**: Card menggunakan spacing default
**File**: [`dashboard/page.tsx:124`](src/app/dashboard/page.tsx:124)

**Action Required**:
- Remove fixed height constraints
- Use `space-y-3` instead of `space-y-6`
- Compact button row
- Reduce padding if needed

## Implementation Plan

### Phase 1: Stats Grid Mobile Optimization
**Priority**: HIGH
**Files**: 
- [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:146)

**Changes**:
```typescript
// Update StatCard component
function StatCard({ item }: { item: MetricCard }) {
  const Icon = item.icon;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 md:rounded-2xl md:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400 md:text-xs md:tracking-[0.18em]">
          {item.label}
        </p>
        <span className="hidden h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600 md:flex">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950 md:text-3xl">
        {formatNumber(item.value)}
      </p>
      <span className="mt-1 hidden w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 md:inline-flex">
        {item.helper}
      </span>
    </div>
  );
}

// Update StatsGrid
function StatsGrid({ metricCards }: { metricCards: MetricCard[] }) {
  return (
    <section className="lg:col-span-3">
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {metricCards.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}
```

### Phase 2: Public Link Card Compact
**Priority**: HIGH
**Files**:
- [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:116)
- [`src/components/dashboard/share-profile-actions.tsx`](src/components/dashboard/share-profile-actions.tsx:148)

**Changes**:
```typescript
// Update PublicLinkCard
function PublicLinkCard({ profilePath, username }: { profilePath: string; username: string }) {
  return (
    <BentoCard className="lg:col-span-1">
      <div className="flex h-full flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Public Link
            </p>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-800 text-white shadow-sm">
              <Share2 className="h-4 w-4" />
            </span>
          </div>
          <h3 className="mt-3 truncate text-xl font-semibold text-slate-900">{profilePath}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            Bagikan profil creator, link penting, bio, dan portfolio video ke client.
          </p>
        </div>
        <ShareProfileActions username={username} iconOnlyOnMobile compact />
      </div>
    </BentoCard>
  );
}

// Update ShareProfileActions to accept compact prop
export function ShareProfileActions({ username, iconOnlyOnMobile = false, compact = false }: ShareProfileActionsProps & { compact?: boolean }) {
  // ... existing code ...
  
  const buttonClass = compact ? "h-9 px-3 text-sm" : ""; // Add compact styling
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={() => setIsOpen(true)} className={buttonClass}>
        <Share2 className="h-4 w-4" />
        <span className={iconOnlyOnMobile ? "sr-only sm:not-sr-only" : ""}>Share Link</span>
      </Button>
      {/* ... rest of buttons with compact class ... */}
    </div>
  );
}
```

### Phase 3: Collapsible Sidebar
**Priority**: MEDIUM
**Files**:
- [`src/components/dashboard/dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:1)

**Changes**:
```typescript
export function DashboardShell({ children, user, planName = "free", mode = "creator" }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // ... existing code ...
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all duration-300 ease-in-out md:block ${
        sidebarOpen ? 'w-72' : 'w-20'
      }`}>
        <div className="flex h-full flex-col bg-white px-4 py-5">
          {/* Logo with collapse state */}
          <div className={`flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Link2 className="h-4 w-4" />
            </div>
            {sidebarOpen && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">showreels.id</p>
                  <p className="text-xs text-slate-500">Creator workspace</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </>
            )}
          </div>
          
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mt-4 flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          >
            {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
          
          {/* Rest of sidebar with conditional rendering */}
          {/* ... */}
        </div>
      </aside>
      
      {/* Update main content offset */}
      <div className={`min-h-screen pt-16 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'md:pl-72' : 'md:pl-20'
      }`}>
        <main className="p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
```

### Phase 4: Logo Workspace
**Priority**: LOW
**Files**:
- [`src/components/dashboard/dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:174)

**Changes**:
```typescript
<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white overflow-hidden">
  <img
    src="/logo.png"
    alt="Showreels.id"
    className="h-5 w-5 object-contain"
    onError={(e) => {
      e.currentTarget.style.display = 'none';
      e.currentTarget.nextElementSibling?.classList.remove('hidden');
    }}
  />
  <Link2 className="h-4 w-4 hidden" />
</div>
```

### Phase 5: Hero Buttons Compact
**Priority**: MEDIUM
**Files**:
- [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:96)

**Changes**:
```typescript
<Button className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-800 px-3.5 text-sm font-medium text-white hover:bg-zinc-700">
  {canUseBuildLink ? <Wand2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
  {canUseBuildLink ? "Mulai Build Link" : "Unlock Build Link"}
</Button>
```

## Testing Checklist

- [ ] Active menu text readable (white on zinc-800)
- [ ] Public Link card compact dengan tombol rapi
- [ ] Stats grid 4 kolom di mobile dengan text readable
- [ ] Sidebar bisa collapse/expand di desktop
- [ ] Logo workspace tampil (atau fallback icon)
- [ ] Hero buttons compact dan proporsional
- [ ] Public Link spacing optimal
- [ ] Responsive di semua breakpoint (375px, 768px, 1024px, 1920px)
- [ ] Bottom nav tidak overlap dengan content
- [ ] Transisi sidebar smooth

## Timeline Estimasi

- Phase 1 (Stats Grid): 30 menit
- Phase 2 (Public Link): 45 menit
- Phase 3 (Collapsible Sidebar): 1 jam
- Phase 4 (Logo): 15 menit
- Phase 5 (Hero Buttons): 15 menit
- Testing & QA: 30 menit

**Total: ~3 jam**
