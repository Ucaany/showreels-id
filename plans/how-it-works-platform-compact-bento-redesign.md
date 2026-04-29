# Redesign Plan: How It Works (Compact) & Platform (Bento Grid)

## Tujuan
1. **Section "Cara Kerja"**: Buat lebih compact agar tidak terlalu besar/mendominasi halaman
2. **Section "Platform"**: Redesign menjadi Bento Grid layout yang lebih menarik

---

## 1. Section "Cara Kerja" - Compact Version

### Current State (Lines 1364-1485)
- Section padding: `py-16 sm:py-20 lg:py-24` (terlalu besar)
- Heading: `text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem]` (besar)
- Description: `text-[0.9375rem]` dengan `mt-5`
- Card padding: `p-5 sm:p-6 lg:p-8` (besar)
- Icon circle: `h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20` (besar)
- Illustration area: `h-28 sm:h-32` dengan `my-6 sm:my-7 lg:my-8`
- Title: `text-[1rem] sm:text-[1.125rem] lg:text-[1.25rem]`
- Description: `text-[0.8125rem] sm:text-[0.875rem]`

### Redesign - Compact Version

#### Section Container
```tsx
<section className="relative overflow-hidden bg-gradient-to-b from-[#fafbfc] to-white py-10 sm:py-12 lg:py-14">
```
- Kurangi padding dari `py-16 sm:py-20 lg:py-24` → `py-10 sm:py-12 lg:py-14`

#### Header
```tsx
<h2 className="mt-3 font-display text-[1.55rem] sm:text-[1.8rem] lg:text-[2rem] font-extrabold leading-[1.12] tracking-tight text-[#0f1419]">
```
- Kurangi heading dari `text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem]` → `text-[1.55rem] sm:text-[1.8rem] lg:text-[2rem]`

```tsx
<p className="mx-auto mt-3 max-w-[620px] text-[0.8125rem] leading-relaxed text-[#4a5568] sm:text-[0.875rem]">
```
- Kurangi margin top dari `mt-5` → `mt-3`
- Kurangi font dari `text-[0.9375rem]` → `text-[0.8125rem] sm:text-[0.875rem]`

#### Grid Container
```tsx
<div className="relative mt-8 grid gap-5 lg:grid-cols-3 lg:gap-6">
```
- Kurangi margin top dari `mt-12` → `mt-8`
- Kurangi gap dari `gap-8 lg:gap-10 lg:gap-x-16` → `gap-5 lg:gap-6`

#### Card
```tsx
<m.article className="relative rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
```
- Kurangi padding dari `p-5 sm:p-6 lg:p-8` → `p-4 sm:p-5`
- Kurangi shadow dari `shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)]` → `shadow-sm`

#### Badge & Icon
```tsx
<span className="inline-flex items-center gap-2 rounded-lg bg-[#2f73ff] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white shadow-sm sm:px-3 sm:py-1.5">
  {step.label}
</span>
<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e8f0ff] to-[#d5e5ff] sm:h-12 sm:w-12">
  <StepIcon className="h-5 w-5 text-[#2f66e4] sm:h-6 sm:w-6" strokeWidth={2} />
</div>
```
- Kurangi badge padding dan font
- Kurangi icon circle dari `h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20` → `h-11 w-11 sm:h-12 sm:w-12`
- Kurangi icon size dari `h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10` → `h-5 w-5 sm:h-6 sm:w-6`

#### Illustration Area
```tsx
<div className="mx-auto my-4 flex h-20 w-full items-center justify-center sm:my-5 sm:h-24">
```
- Kurangi height dari `h-28 sm:h-32` → `h-20 sm:h-24`
- Kurangi margin dari `my-6 sm:my-7 lg:my-8` → `my-4 sm:my-5`

#### Title & Description
```tsx
<h3 className="mt-2 text-center text-[0.9375rem] font-bold tracking-tight text-[#1d1714] sm:mt-3 sm:text-[1rem]">
  {step.title}
</h3>
<p className="mt-1.5 text-center text-[0.75rem] leading-relaxed text-[#5c514b] sm:mt-2 sm:text-[0.8125rem]">
  {step.description}
</p>
```
- Kurangi title dari `text-[1rem] sm:text-[1.125rem] lg:text-[1.25rem]` → `text-[0.9375rem] sm:text-[1rem]`
- Kurangi description dari `text-[0.8125rem] sm:text-[0.875rem]` → `text-[0.75rem] sm:text-[0.8125rem]`

---

## 2. Section "Platform" - Bento Grid Layout

### Current State (Lines 1313-1362)
- Grid 5 kolom dengan cards seragam
- Setiap platform dalam card terpisah dengan icon, nama, dan "Didukung"

### Redesign - Bento Grid Concept

#### Layout Structure
```
Desktop (lg):
┌─────────────┬─────────────┬─────────────┐
│   YouTube   │  Instagram  │   Vimeo     │
│   (2x2)     │             │             │
│             ├─────────────┼─────────────┤
│             │   Drive     │  Facebook   │
└─────────────┴─────────────┴─────────────┘

Mobile/Tablet: Stack vertically atau 2 kolom
```

#### Section Container
```tsx
<section className="border-y border-[#e0e7ef] bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] py-10 sm:py-12 lg:py-14">
```
- Kurangi padding dari `py-16 sm:py-20 lg:py-24` → `py-10 sm:py-12 lg:py-14`

#### Header (Compact)
```tsx
<h2 className="mt-3 font-display text-[1.55rem] sm:text-[1.8rem] lg:text-[2rem] font-extrabold leading-[1.12] tracking-tight text-[#0f1419]">
```
- Sama seperti How It Works, buat lebih kecil

#### Bento Grid Container
```tsx
<div className="mx-auto mt-8 grid max-w-[960px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
```

#### Platform Cards

**Card 1: YouTube (Hero - 2x2)**
```tsx
<m.div className="bg-white rounded-2xl p-5 shadow-md transition-all hover:shadow-lg sm:col-span-2 sm:row-span-2 lg:col-span-1 lg:row-span-2">
  <div className="flex h-full flex-col items-center justify-center gap-4">
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFE5E5]">
      <SiYoutube className="h-10 w-10 text-[#FF0000]" />
    </div>
    <div className="text-center">
      <h3 className="text-lg font-bold text-slate-800">YouTube</h3>
      <p className="mt-1 text-xs text-slate-500">Platform video terpopuler</p>
    </div>
    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5">
      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span className="text-[0.7rem] font-semibold text-emerald-700">Didukung Penuh</span>
    </div>
  </div>
</m.div>
```

**Card 2-5: Platform Lainnya (Standard)**
```tsx
<m.div className="bg-white rounded-2xl p-4 shadow-md transition-all hover:shadow-lg">
  <div className="flex flex-col items-center gap-3">
    <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: platform.lightBg }}>
      <PlatformIcon className="h-7 w-7" style={{ color: platform.brandColor }} />
    </div>
    <div className="text-center">
      <h3 className="text-sm font-bold text-slate-800">{platform.name}</h3>
      <p className="mt-0.5 text-[0.7rem] text-slate-500">Didukung</p>
    </div>
  </div>
</m.div>
```

#### Platform Order & Spanning
1. **YouTube** - `sm:col-span-2 sm:row-span-2 lg:col-span-1 lg:row-span-2` (Hero)
2. **Instagram** - Standard
3. **Vimeo** - Standard
4. **Google Drive** - Standard
5. **Facebook** - Standard

---

## Implementation Steps

### Step 1: Compact "Cara Kerja" Section
1. Update section padding: `py-10 sm:py-12 lg:py-14`
2. Update heading sizes: smaller fonts
3. Update card padding: `p-4 sm:p-5`
4. Update icon sizes: `h-11 w-11 sm:h-12 sm:w-12`
5. Update illustration area: `h-20 sm:h-24`
6. Update text sizes: smaller fonts
7. Update spacing: reduce margins and gaps

### Step 2: Bento Grid "Platform" Section
1. Update section padding: `py-10 sm:py-12 lg:py-14`
2. Update heading sizes: match How It Works
3. Replace grid layout: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
4. Create YouTube hero card with `row-span-2`
5. Create 4 standard platform cards
6. Add proper responsive behavior
7. Update animations and hover effects

### Step 3: Testing & Deployment
1. Test responsive behavior (mobile, tablet, desktop)
2. Verify animations work smoothly
3. Check spacing and alignment
4. Build and test
5. Commit and push to GitHub
6. Verify Vercel deployment

---

## Design Tokens

### Colors
- Background: `bg-white`, `bg-slate-50`
- Borders: `border-slate-200`
- Text: `text-slate-800`, `text-slate-500`
- Blue accent: `#2f73ff`
- Platform brand colors: YouTube red, Instagram pink, etc.

### Spacing (Compact)
- Section padding: `py-10 sm:py-12 lg:py-14`
- Card padding: `p-4 sm:p-5`
- Gap: `gap-3 lg:gap-4` (grid), `gap-5 lg:gap-6` (cards)
- Margins: `mt-3`, `mt-8`

### Typography (Compact)
- Badge: `text-[0.6rem]`
- Heading: `text-[1.55rem] sm:text-[1.8rem] lg:text-[2rem]`
- Description: `text-[0.8125rem] sm:text-[0.875rem]`
- Card title: `text-[0.9375rem] sm:text-[1rem]`
- Card description: `text-[0.75rem] sm:text-[0.8125rem]`

### Sizing (Compact)
- Icon circle: `h-11 w-11 sm:h-12 sm:w-12`
- Icon: `h-5 w-5 sm:h-6 sm:w-6`
- Illustration area: `h-20 sm:h-24`
- Platform icon (Bento): `h-14 w-14` (standard), `h-20 w-20` (hero)

---

## Expected Outcome

1. **Section "Cara Kerja"** akan terlihat lebih compact dan tidak mendominasi halaman
2. **Section "Platform"** akan memiliki layout Bento Grid yang lebih menarik dengan YouTube sebagai hero card
3. Kedua section tetap responsive dan smooth animations
4. Konsisten dengan design system yang sudah ada
