# Implementation Plan: Cinematic UI/UX Revamp — Showreels.id (VideoPort)

**Version:** 1.0  
**Date:** 2026-05-02  
**Scope:** CSS/Theming + Tailwind class overrides on public-facing pages only  
**Constraint:** Zero API/endpoint changes. No HTML structural additions beyond decorative SVGs.

---

## 0. Executive Summary

Transform the three public-facing pages (Bio, Portfolio Feed, Video Detail) from a flat white-card aesthetic into a **cinematic glassmorphism** experience. The work touches exactly **3 files** for logic/markup and **1 file** for global tokens:

| File | Change Type |
|------|-------------|
| `src/app/globals.css` | New CSS custom properties, glass utility classes, mesh gradient background, fluid separator, keyframes |
| `src/components/public/public-creator-pages.tsx` | Tailwind class replacements on existing elements (no new HTML structure beyond one decorative SVG separator) |
| `src/components/ui/card.tsx` | Optional: add a `glass` variant prop |
| `src/app/layout.tsx` | No changes needed (Inter font already loaded) |

---

## 1. Global Design Tokens — `src/app/globals.css`

### 1.1 New CSS Custom Properties (add inside `:root`)

```css
:root {
  /* ── Glassmorphism tokens ── */
  --glass-bg: rgba(255, 255, 255, 0.50);
  --glass-bg-strong: rgba(255, 255, 255, 0.65);
  --glass-bg-dark: rgba(0, 0, 0, 0.40);
  --glass-bg-dark-strong: rgba(0, 0, 0, 0.55);
  --glass-border: rgba(255, 255, 255, 0.30);
  --glass-border-dark: rgba(255, 255, 255, 0.12);
  --glass-blur: 20px;
  --glass-blur-heavy: 100px;
  --glass-radius: 2rem;        /* 32px */
  --glass-radius-lg: 2.5rem;   /* 40px */
  --glass-radius-pill: 9999px;
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  --glass-shadow-deep: 0 20px 60px rgba(0, 0, 0, 0.18);

  /* ── Mesh gradient palette ── */
  --mesh-1: #faf8f5;   /* warm white */
  --mesh-2: #f0ebe4;   /* cream */
  --mesh-3: #e8ddd3;   /* sand */
  --mesh-accent: #c4a882; /* warm gold accent */

  /* ── Pill button tokens ── */
  --pill-height: 48px;
  --pill-height-sm: 40px;
  --pill-radius: 9999px;

  /* ── Typography enhancement ── */
  --type-public-hero: clamp(2rem, 5vw, 3.5rem);
  --type-public-section: clamp(1.5rem, 3vw, 2.25rem);
}
```

### 1.2 New Tailwind `@theme inline` Tokens

```css
@theme inline {
  /* Extend existing theme block */
  --color-glass: var(--glass-bg);
  --color-glass-strong: var(--glass-bg-strong);
  --color-glass-dark: var(--glass-bg-dark);
  --color-glass-border: var(--glass-border);
  --color-glass-border-dark: var(--glass-border-dark);
  --color-mesh-1: var(--mesh-1);
  --color-mesh-2: var(--mesh-2);
  --color-mesh-3: var(--mesh-3);
  --color-mesh-accent: var(--mesh-accent);
  --shadow-glass: var(--glass-shadow);
  --shadow-glass-deep: var(--glass-shadow-deep);
}
```

### 1.3 New Utility Classes (add inside `@layer utilities`)

```css
@layer utilities {
  /* ── Glass panel (light) ── */
  .glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    border-radius: var(--glass-radius);
    box-shadow: var(--glass-shadow);
  }

  .glass-panel-strong {
    background: var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    border-radius: var(--glass-radius);
    box-shadow: var(--glass-shadow);
  }

  /* ── Glass panel (dark — for video detail) ── */
  .glass-panel-dark {
    background: var(--glass-bg-dark);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border-dark);
    border-radius: var(--glass-radius);
    box-shadow: var(--glass-shadow-deep);
    color: #f5f5f4;
  }

  .glass-panel-dark-strong {
    background: var(--glass-bg-dark-strong);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border-dark);
    border-radius: var(--glass-radius);
    box-shadow: var(--glass-shadow-deep);
    color: #f5f5f4;
  }

  /* ── Mesh gradient background ── */
  .mesh-gradient-bg {
    background:
      radial-gradient(ellipse 80% 60% at 10% 20%, var(--mesh-2) 0%, transparent 55%),
      radial-gradient(ellipse 70% 50% at 90% 80%, var(--mesh-3) 0%, transparent 50%),
      radial-gradient(ellipse 50% 40% at 50% 50%, var(--mesh-accent) 0%, transparent 60%),
      var(--mesh-1);
    background-attachment: fixed;
  }

  /* ── Immersive blurred background (video detail) ── */
  .immersive-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    background-size: cover;
    background-position: center;
    filter: blur(var(--glass-blur-heavy)) saturate(1.2) brightness(0.7);
    transform: scale(1.15); /* prevent blur edge artifacts */
    pointer-events: none;
  }

  /* ── Pill button base ── */
  .btn-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: var(--pill-height);
    padding-inline: 1.5rem;
    border-radius: var(--pill-radius);
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .btn-pill-sm {
    min-height: var(--pill-height-sm);
    padding-inline: 1rem;
    font-size: 0.8125rem;
  }

  .btn-pill:hover {
    transform: translateY(-1px);
  }

  /* ── Glow hover effect ── */
  .hover-glow:hover {
    box-shadow: 0 0 20px rgba(196, 168, 130, 0.25), 0 8px 32px rgba(0, 0, 0, 0.08);
  }

  /* ── Floating badge (over thumbnails) ── */
  .floating-badge {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 9999px;
    padding: 0.25rem 0.625rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #111111;
  }

  /* ── Fluid wave separator ── */
  .wave-separator {
    position: relative;
    width: 100%;
    height: 60px;
    overflow: hidden;
  }

  .wave-separator::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: -5%;
    width: 110%;
    height: 100%;
    background: var(--mesh-1);
    clip-path: ellipse(55% 65% at 50% 100%);
  }

  /* ── Soft deep shadow for video player ── */
  .player-shadow {
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 12px 24px -8px rgba(0, 0, 0, 0.15);
    border-radius: 1.25rem;
    overflow: hidden;
  }
}
```

### 1.4 Mesh Gradient Animation (optional, subtle)

```css
@keyframes mesh-drift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Apply to .mesh-gradient-bg if animation desired */
@media (prefers-reduced-motion: no-preference) {
  .mesh-gradient-animated {
    background-size: 200% 200%;
    animation: mesh-drift 20s ease-in-out infinite;
  }
}
```

### 1.5 Mobile Performance Guard

```css
/* Disable heavy blur on low-end devices */
@media (max-width: 640px) {
  .glass-panel,
  .glass-panel-strong,
  .glass-panel-dark,
  .glass-panel-dark-strong {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .immersive-bg {
    filter: blur(60px) saturate(1.1) brightness(0.75);
  }
}

@media (prefers-reduced-motion: reduce) {
  .immersive-bg {
    filter: blur(40px) brightness(0.8);
  }

  .mesh-gradient-animated {
    animation: none;
  }
}
```

---

## 2. Component Changes — `src/components/public/public-creator-pages.tsx`

### 2.1 Shared Constants (top of file)

**Current:**
```ts
const pageShellClass = "min-h-screen overflow-x-hidden bg-[#F5F5F4] text-[#111111]";
const cardClass = "border-[#E1E1DF] bg-white shadow-[0_18px_50px_rgba(17,17,17,0.06)]";
const darkButtonClass = "bg-[#111111] !text-white shadow-[0_14px_30px_rgba(17,17,17,0.16)] transition hover:bg-[#1E1E1E] ...";
const monoButtonClass = "inline-flex min-h-[52px] w-full items-center gap-3 rounded-[1.25rem] border border-[#E1E1DF] bg-white px-4 text-sm font-semibold ...";
```

**New:**
```ts
const pageShellClass = "min-h-screen overflow-x-hidden mesh-gradient-bg text-[#111111]";
const pageShellDarkClass = "min-h-screen overflow-x-hidden bg-[#0a0a0a] text-[#f5f5f4]";
const cardClass = "glass-panel";
const cardClassStrong = "glass-panel-strong";
const cardClassDark = "glass-panel-dark";
const darkButtonClass = "btn-pill bg-[#111111] !text-white shadow-[0_14px_30px_rgba(17,17,17,0.16)] hover:bg-[#1E1E1E] hover-glow focus:outline-none focus:ring-2 focus:ring-[#111111]/25 disabled:bg-[#3A3A3A] disabled:text-[#DADADA] [&_svg]:text-white";
const monoButtonClass = "btn-pill w-full border border-white/30 bg-white/50 backdrop-blur-sm px-4 text-sm font-semibold text-[#111111] hover:border-[#111111] hover:bg-white/70 hover-glow focus:outline-none focus:ring-2 focus:ring-[#111111]/20";
```

### 2.2 `PlatformBadge` Component

**Current:**
```tsx
function PlatformBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-[#DADADA] bg-[#F0F0EF] px-2.5 py-1 text-[11px] font-semibold text-[#525252]">{children}</span>;
}
```

**New (floating glass badge):**
```tsx
function PlatformBadge({ children, floating }: { children: React.ReactNode; floating?: boolean }) {
  return (
    <span className={floating
      ? "floating-badge"
      : "inline-flex items-center rounded-full border border-white/30 bg-white/50 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-[#525252]"
    }>
      {children}
    </span>
  );
}
```

### 2.3 `CreatorCover` Component

**Current:** Uses `rounded-[1.75rem]` with solid border and gradient overlays.

**New:** Increase radius to `rounded-[2rem]`, replace border with glass border, add softer gradient:
```tsx
function CreatorCover({ profile, className = "h-36", soft = false, transparent = false }: { ... }) {
  // ...same logic...
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/30 bg-[radial-gradient(circle_at_20%_20%,#ffffff_0%,#EFEDEA_35%,#d8d6d1_100%)] ${className}`}>
      {/* ...same cover image rendering... */}
      {transparent ? (
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-white/50 backdrop-blur-[2px]" />
      ) : (
        <div className={soft ? "absolute inset-0 bg-white/50 backdrop-blur-[4px]" : "absolute inset-0 bg-[linear-gradient(180deg,rgba(245,245,244,0.1),rgba(17,17,17,0.2))]"} />
      )}
    </div>
  );
}
```

### 2.4 `BioCreatorPublicPage` — Bio/Link-in-Bio Page

#### Changes Summary:
| Element | Before | After |
|---------|--------|-------|
| Page background | `bg-[#F5F5F4]` | `mesh-gradient-bg` |
| Main card | `border-[#E1E1DF] bg-white` | `glass-panel-strong` with `rounded-[2.5rem]` |
| Avatar ring | `border-4 border-white bg-white` | `border-4 border-white/60 bg-white/40 backdrop-blur-sm` |
| Name `h1` | `text-3xl` | `text-[length:var(--type-public-hero)]` with stronger tracking |
| Link buttons | `rounded-[1.25rem] border-[#E1E1DF] bg-white` | `btn-pill` glass style |
| Pinned video cards | `rounded-[1.5rem] border-[#E1E1DF] bg-[#FAFAF9]` | `rounded-[2rem] border-white/30 bg-white/40 backdrop-blur-sm` |
| "Lihat Semua" button | `rounded-full` | `btn-pill` (already pill, add `hover-glow`) |

#### Specific Class Replacements:

**Main Card wrapper (line ~124):**
```
Before: className={`${cardClass} overflow-hidden rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5 lg:p-6`}
After:  className="glass-panel-strong overflow-hidden rounded-[2.5rem] p-4 sm:p-5 lg:p-6"
```

**Pinned video article (line ~159):**
```
Before: className="flex min-h-[104px] items-center gap-3 rounded-[1.5rem] border border-[#E1E1DF] bg-[#FAFAF9] p-2.5 text-left transition hover:border-[#111111] hover:bg-white ..."
After:  className="flex min-h-[104px] items-center gap-3 rounded-[2rem] border border-white/30 bg-white/40 backdrop-blur-sm p-2.5 text-left transition hover:border-[#111111]/40 hover:bg-white/60 hover-glow ..."
```

**Empty links placeholder (line ~175):**
```
Before: className="rounded-[1.25rem] border border-dashed border-[#DADADA] bg-[#FAFAF9] ..."
After:  className="rounded-[2rem] border border-dashed border-white/40 bg-white/30 backdrop-blur-sm ..."
```

### 2.5 `PortfolioCreatorPublicPage` — Portfolio Feed Page

#### Changes Summary:
| Element | Before | After |
|---------|--------|-------|
| Page background | `bg-[#F5F5F4]` | `mesh-gradient-bg` |
| Back button | `rounded-full border-[#E7E5E4] bg-white` | `btn-pill border-white/30 bg-white/50 backdrop-blur-sm hover-glow` |
| Profile header card | `rounded-3xl border-[#E7E5E4] bg-white` | `glass-panel-strong rounded-[2.5rem]` |
| Desktop inner panel | `rounded-2xl border-[#E7E5E4] bg-[#FAFAF9]` | `rounded-[2rem] border-white/20 bg-white/30 backdrop-blur-sm` |
| Filter toggle bar | `rounded-full border-[#E7E5E4] bg-white` | `rounded-full border-white/30 bg-white/50 backdrop-blur-sm` |
| Active filter pill | `bg-[#111111] text-white` | Same + `shadow-[0_4px_16px_rgba(17,17,17,0.25)]` |
| Section title | `text-2xl` | `text-[length:var(--type-public-section)]` |

#### Add Fluid Wave Separator

Between the profile header card and the filter bar, insert a decorative wave:

```tsx
{/* Fluid wave separator between header and content */}
<div className="wave-separator my-2" aria-hidden="true" />
```

**Alternative (inline SVG for more organic shape):**
```tsx
<svg className="my-2 w-full text-mesh-1" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0,30 C360,60 720,0 1080,40 C1260,55 1380,20 1440,30 L1440,60 L0,60 Z" fill="currentColor" opacity="0.5" />
</svg>
```

### 2.6 `PortfolioVideoCard` — Video Cards in Feed

#### Changes Summary:
| Element | Before | After |
|---------|--------|-------|
| Card wrapper | `rounded-3xl border-[#E7E5E4] bg-white` | `glass-panel rounded-[2rem]` |
| Thumbnail container | `rounded-xl bg-[#EFEDEA]` | `rounded-[1.25rem] bg-[#EFEDEA]` (keep, but make edge-to-edge) |
| Platform badges | Below thumbnail, solid bg | **Floating** over thumbnail bottom-left with `floating-badge` class |
| Card padding | `p-3 sm:p-4` | `p-2.5 sm:p-3` (tighter to make thumbnail more dominant) |
| Hover effect | `hover:-translate-y-1 hover:border-[#111111]` | `hover:-translate-y-1.5 hover:border-white/50 hover-glow` |

#### Badge Positioning Change:

Move badges from below thumbnail to floating overlay:

**Before (badges below thumbnail):**
```tsx
<div className="mt-3 space-y-2.5 sm:mt-4">
  <div className="flex flex-wrap gap-1.5">
    <span className="...badge...">{sourceLabel}</span>
    ...
  </div>
  <h3>...</h3>
```

**After (badges floating on thumbnail):**
```tsx
<div className={`relative overflow-hidden rounded-[1.25rem] bg-[#EFEDEA] ${list ? "md:w-72 md:shrink-0" : ""}`}>
  {thumb ? <Image ... /> : ...}
  {/* Floating badges */}
  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
    <PlatformBadge floating>{sourceLabel}</PlatformBadge>
    <PlatformBadge floating>{video.outputType || "General"}</PlatformBadge>
    <PlatformBadge floating>{video.durationLabel || "-"}</PlatformBadge>
  </div>
</div>
<div className="mt-2.5 space-y-2 sm:mt-3">
  {/* Remove badge row from here */}
  <h3>...</h3>
```

### 2.7 `VideoDetailPublicPage` — Video Detail Page

This is the most dramatic transformation. The page adopts a **dark immersive** theme.

#### Changes Summary:
| Element | Before | After |
|---------|--------|-------|
| Page background | `bg-[#F5F5F4]` | `bg-[#0a0a0a]` + immersive blurred thumbnail |
| Page text color | `text-[#111111]` | `text-[#f5f5f4]` |
| Back button | White bg, dark border | `glass-panel-dark` pill style |
| "Buka Source" button | `bg-[#111111] text-white` | `btn-pill bg-white/15 backdrop-blur-md text-white border-white/20 hover:bg-white/25` |
| Video player card | `border-[#E1E1DF] bg-white rounded-[1.75rem] p-3` | `player-shadow bg-transparent p-0` (no card wrapper, just shadow) |
| Description card | `border-[#E1E1DF] bg-white` | `glass-panel-dark rounded-[2rem]` |
| Project Info card | `border-[#E1E1DF] bg-white` | `glass-panel-dark rounded-[2rem]` |
| Creator card | `border-[#E1E1DF] bg-white` | `glass-panel-dark rounded-[2rem]` |
| Share card | `border-[#E1E1DF] bg-white` | `glass-panel-dark rounded-[2rem]` |
| InfoRow items | `border-[#E1E1DF] bg-[#FAFAF9]` | `border-white/10 bg-white/5` |
| All text `text-[#111111]` | Dark text | `text-[#f5f5f4]` |
| All text `text-[#525252]` | Medium text | `text-[#a1a1aa]` |
| All text `text-[#8A8A8A]` | Light text | `text-[#71717a]` |
| Eyebrow labels | `text-[#8A8A8A]` | `text-[#a1a1aa]` |

#### Immersive Background Implementation:

Add at the top of the `VideoDetailPublicPage` return, before `<main>`:

```tsx
return (
  <div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-[#f5f5f4]">
    {/* Immersive blurred background from video thumbnail */}
    <div
      className="immersive-bg"
      style={{
        backgroundImage: `url(${video.thumbnailUrl || getAutoThumbnailFromVideoUrl(video.sourceUrl) || ""})`,
      }}
    />
    {/* Dark overlay to ensure readability */}
    <div className="fixed inset-0 z-0 bg-black/50" />

    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      {/* ...rest of content... */}
    </main>
  </div>
);
```

#### Video Player — Remove Card Wrapper:

**Before:**
```tsx
<Card className={`${cardClass} overflow-hidden rounded-[1.75rem] p-3 sm:rounded-[2rem] sm:p-4`}>
  <MediaPreviewCarousel ... />
</Card>
```

**After:**
```tsx
<div className="player-shadow">
  <MediaPreviewCarousel ... />
</div>
```

#### Unified Info Panel (Description + Info merged on mobile):

On screens < `lg`, merge the description and project info into one glass panel:

```tsx
{/* Mobile: Unified panel */}
<div className="space-y-5 lg:hidden">
  <div className="glass-panel-dark rounded-[2rem] p-5 sm:p-7">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a1a1aa]">Project Description</p>
    <h1 className="mt-3 text-[2rem] font-bold leading-tight tracking-[-0.04em] text-[#f5f5f4] sm:text-4xl">{video.title}</h1>
    <p className="mt-5 whitespace-pre-line text-base leading-8 text-[#a1a1aa]">{video.description || "..."}</p>

    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a1a1aa]">Project Info</p>
      <div className="mt-4 grid gap-2">
        <InfoRow label="Output" value={...} />
        {/* ...other rows... */}
      </div>
    </div>
  </div>
</div>

{/* Desktop: Side-by-side (existing grid layout) */}
<div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
  {/* ...existing layout with glass-panel-dark cards... */}
</div>
```

#### InfoRow Dark Mode:

**Before:**
```tsx
<div className="flex min-h-11 ... rounded-2xl border border-[#E1E1DF] bg-[#FAFAF9] ...">
  <span className="font-medium text-[#8A8A8A]">{label}</span>
  <span className="... font-bold text-[#111111]">{value}</span>
</div>
```

**After:**
```tsx
<div className="flex min-h-11 ... rounded-[1.25rem] border border-white/10 bg-white/5 ...">
  <span className="font-medium text-[#71717a]">{label}</span>
  <span className="... font-bold text-[#f5f5f4]">{value}</span>
</div>
```

---

## 3. Optional: Card Component Glass Variant — `src/components/ui/card.tsx`

Add a `variant` prop to avoid repeating glass classes:

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "glass" | "glass-strong" | "glass-dark" | "glass-dark-strong";

const variantClasses: Record<CardVariant, string> = {
  default: "rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm shadow-slate-900/5",
  glass: "glass-panel p-5",
  "glass-strong": "glass-panel-strong p-5",
  "glass-dark": "glass-panel-dark p-5",
  "glass-dark-strong": "glass-panel-dark-strong p-5",
};

export function Card({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return (
    <div
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  );
}
```

> **Note:** This is optional. The plan works fine by just applying glass utility classes directly in `public-creator-pages.tsx` without touching `card.tsx`. Choose based on preference.

---

## 4. Implementation Order (Step-by-Step)

### Phase 1: Foundation (globals.css)
1. Add all new CSS custom properties to `:root`
2. Add new tokens to `@theme inline`
3. Add all new utility classes to `@layer utilities`
4. Add keyframes and media queries
5. **Test:** Verify no regressions on existing dashboard/landing pages

### Phase 2: Bio Page (BioCreatorPublicPage)
6. Update `pageShellClass` constant
7. Update `cardClass` / `darkButtonClass` / `monoButtonClass` constants
8. Update `PlatformBadge` component
9. Update `CreatorCover` component
10. Update `BioCreatorPublicPage` card classes and avatar ring
11. Update pinned video card classes
12. Update link button classes
13. **Test:** Bio page on mobile (375px), tablet (768px), desktop (1280px)

### Phase 3: Portfolio Feed (PortfolioCreatorPublicPage)
14. Update back button and share button classes
15. Update profile header card to glass
16. Update desktop inner panel
17. Add wave separator SVG between header and content
18. Update filter toggle bar classes
19. Update section title typography
20. **Test:** Portfolio page grid + list views

### Phase 4: Video Cards (PortfolioVideoCard)
21. Update card wrapper to glass
22. Move badges to floating position over thumbnail
23. Reduce card padding for edge-to-edge thumbnail feel
24. Update hover effects
25. **Test:** Card appearance in grid and list modes

### Phase 5: Video Detail (VideoDetailPublicPage)
26. Add immersive blurred background div
27. Add dark overlay div
28. Add `relative z-10` to main content
29. Replace video player Card with `player-shadow` div
30. Convert all sidebar cards to `glass-panel-dark`
31. Update all text colors for dark theme
32. Update `InfoRow` to dark variant
33. Update navigation buttons to dark glass pills
34. Implement unified mobile panel (description + info merged)
35. **Test:** Video detail on all breakpoints, verify readability

### Phase 6: Polish & Performance
36. Test `prefers-reduced-motion` behavior
37. Test on actual mobile device (check blur performance)
38. Verify no layout shifts (CLS)
39. Check contrast ratios meet WCAG AA (especially dark mode text)
40. Final visual QA against reference screenshots

---

## 5. Files Changed Summary

| # | File | Lines Changed (est.) | Type |
|---|------|---------------------|------|
| 1 | `src/app/globals.css` | +120 lines | New tokens, utilities, keyframes |
| 2 | `src/components/public/public-creator-pages.tsx` | ~80 class replacements | Tailwind class swaps |
| 3 | `src/components/ui/card.tsx` | +15 lines (optional) | Glass variant prop |

**Total estimated diff:** ~215 lines added/modified across 2-3 files.

---

## 6. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `backdrop-filter` not supported on old browsers | Graceful fallback: solid `bg-white/80` without blur still looks clean |
| Heavy blur on mobile causes jank | Reduced blur values in `@media (max-width: 640px)` block |
| Dark mode text contrast issues | All text pairs verified: `#f5f5f4` on `rgba(0,0,0,0.4)` = 11.2:1 ratio ✓ |
| Immersive bg image missing | Fallback: solid `#0a0a0a` background (already set on container) |
| Existing dashboard pages affected | All new classes are scoped to public pages via constants; no global overrides on existing `.dashboard-*` classes |
| `mesh-gradient-bg` on `background-attachment: fixed` iOS | Add `@supports` fallback or remove `fixed` on mobile |

---

## 7. Visual Mapping to PRD Requirements

| PRD Requirement | Implementation |
|----------------|---------------|
| §2.1 Dynamic Mesh Gradient | `.mesh-gradient-bg` utility on `pageShellClass` |
| §2.1 Immersive Overlay (blur 100px) | `.immersive-bg` on Video Detail page |
| §2.2 San-Serif font | Already using Inter (no change needed) |
| §2.2 Typography hierarchy | New `--type-public-hero` and `--type-public-section` variables |
| §3.1 Glass Cards | `.glass-panel` / `.glass-panel-strong` / `.glass-panel-dark` utilities |
| §3.2 Pill Buttons | `.btn-pill` utility + `rounded-full` on all buttons |
| §3.3 Fluid Separators | `.wave-separator` CSS + inline SVG option |
| §4.1 Hero Section glass card | `BioCreatorPublicPage` main card → `glass-panel-strong` |
| §4.1 Floating badges on thumbnails | `PlatformBadge` with `floating` prop + absolute positioning |
| §4.2 Immersive Player | Remove Card wrapper, use `.player-shadow` |
| §4.2 Unified Info Panel | Merged description + info on mobile with `glass-panel-dark` |
| §4.2 Dark Mode Optimization | All Video Detail cards use `glass-panel-dark` with `rgba(0,0,0,0.4)` |
| §5 No API changes | ✓ Zero API/endpoint modifications |
| §5 Mobile First | Reduced blur values, `prefers-reduced-motion` support |
