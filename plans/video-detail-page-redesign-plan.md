# Video Detail Page Redesign Plan (v2)

## Overview

Redesign the `VideoDetailPublicPage` component in `src/components/public/public-creator-pages.tsx` to match the Whenevr blog-style reference design with:
1. Soft blue gradient background (matching bio & portfolio pages) — **already present, keep as-is**
2. Portrait-style thumbnail for ALL videos (including landscape) — force `object-cover` so landscape thumbnails fill the portrait frame
3. Fully responsive layout
4. Clean, modern card-based design matching the reference

---

## Current State Analysis

The current `VideoDetailPublicPage` (lines 450-561) already has:
- ✅ Gradient background with animated blobs (matching bio & portfolio)
- ✅ Glassmorphism card styling
- ✅ Two-column responsive layout (content + sidebar)
- ✅ Portrait aspect ratio on `MediaPreviewCarousel` (`aspectRatio="portrait"`)
- ✅ Navigation buttons (back + open source)

### Issues to Fix:
1. **Landscape thumbnails use `object-contain`** in portrait mode → causes letterboxing (small image with bars). Need `object-cover` to fill the portrait frame by cropping sides.
2. **The portrait container `max-w-[360px]`** is too narrow for the detail page — should be wider to fill the card better.
3. **Overall layout refinement** needed to better match the Whenevr reference aesthetic.

---

## Implementation Plan

### File 1: `src/components/media-preview-carousel.tsx`

#### Change 1: Fix portrait thumbnail to use `object-cover` instead of `object-contain`

**Line 158** — Change the Image className:
```tsx
// FROM:
className={`... ${aspectRatio === "portrait" ? "object-contain" : "object-cover"} ${frameClass}`}

// TO:
className={`... object-cover ${frameClass}`}
```

This ensures landscape video thumbnails fill the portrait frame by cropping the sides, making all thumbnails aligned consistently.

#### Change 2: Update frameClass for portrait to allow wider display

**Lines 92-95** — Update the portrait frameClass:
```tsx
// FROM:
const frameClass =
  aspectRatio === "portrait"
    ? "mx-auto aspect-[9/16] h-auto max-h-[70vh] w-full max-w-[360px] object-contain"
    : "aspect-video w-full";

// TO:
const frameClass =
  aspectRatio === "portrait"
    ? "mx-auto aspect-[9/16] h-auto max-h-[70vh] w-full max-w-[420px]"
    : "aspect-video w-full";
```

Note: Removed `object-contain` from frameClass since we now use `object-cover` on the Image element. Also increased max-w from 360px to 420px for better visual presence on the detail page.

### File 2: `src/components/public/public-creator-pages.tsx`

#### Change 1: Update the MediaPreviewCarousel container in VideoDetailPublicPage

**Lines 497-503** — Update the video preview card to give more room:
```tsx
// FROM:
<Card className={`${glassCard} overflow-hidden rounded-[1.75rem] sm:rounded-[2rem]`}>
  <div className="flex items-center justify-center p-3 sm:p-4">
    <div className="w-full max-w-[400px]">
      <MediaPreviewCarousel ... aspectRatio="portrait" />
    </div>
  </div>
</Card>

// TO:
<Card className={`${glassCard} overflow-hidden rounded-[1.75rem] sm:rounded-[2rem]`}>
  <div className="flex items-center justify-center p-3 sm:p-4">
    <div className="w-full max-w-[440px]">
      <MediaPreviewCarousel ... aspectRatio="portrait" />
    </div>
  </div>
</Card>
```

Increase the container max-width from 400px to 440px for better visual balance.

---

## Summary of Changes

| # | File | Line(s) | Change |
|---|------|---------|--------|
| 1 | `media-preview-carousel.tsx` | 92-95 | Update `frameClass` for portrait: increase max-w to 420px, remove `object-contain` |
| 2 | `media-preview-carousel.tsx` | 158 | Change portrait images from `object-contain` to `object-cover` |
| 3 | `public-creator-pages.tsx` | 499 | Increase container max-w from 400px to 440px |

### No changes needed in:
- `src/app/globals.css` — already has `@keyframes portfolio-blob-move`
- `src/app/[slug]/page.tsx` — routing is correct
- Background gradient — already present and matching bio/portfolio pages

---

## After Implementation

Push changes to GitHub and deploy to Vercel:
```bash
git add -A
git commit -m "fix: landscape video thumbnails now display as portrait (object-cover) on detail page"
git push origin main
```

Vercel auto-deploys from main branch.

---

## Responsive Breakpoints (unchanged)

- **Mobile (< 640px)**: Single column, full-width cards, stacked layout
- **Tablet (640px - 1023px)**: Single column with wider cards
- **Desktop (≥ 1024px)**: Two-column grid layout (content + sidebar)
