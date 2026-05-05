# Portfolio Page — Bento UI Redesign Plan

## Objective
Redesign the **Portfolio public page** (`PortfolioCreatorPublicPage`) with a clean, aligned Bento UI style that is fully responsive and looks great on mobile. Remove the "Edit Tampilan" button from the portfolio page.

---

## Current Issues (from screenshot analysis)

1. **"Edit Tampilan" button** — floating button visible on portfolio page, should be removed
2. **Mobile alignment** — cards and elements not perfectly aligned on small screens
3. **Button visibility** — some buttons have colors that blend with background (invisible buttons)
4. **Layout not Bento-style** — current layout is standard card-based, not a modern Bento grid
5. **Spacing inconsistencies** — gaps between sections are uneven on mobile

---

## Files to Modify

### 1. `src/components/public/public-creator-pages.tsx`
**Main file** — contains `PortfolioCreatorPublicPage` component (lines 206-267)

**Changes:**
- **Remove `<OwnerEditButton />`** from `PortfolioCreatorPublicPage` (line 213)
- **Redesign the profile header card** (lines 220-238) into a Bento grid layout:
  - On desktop: 2-column bento grid with profile info on left, cover image on right
  - On mobile: single column, stacked vertically with consistent padding
- **Redesign the video filter bar** (lines 241-251):
  - Make it a clean pill-style toggle that's properly centered on mobile
  - Ensure buttons have visible borders/contrast on all backgrounds
- **Redesign the video grid** (lines 260-263):
  - Mobile: single column, full-width cards with consistent 16px padding
  - Tablet: 2 columns
  - Desktop: 3 columns
  - All cards same height with proper alignment
- **Redesign `PortfolioVideoCard`** (lines 270-289):
  - Clean bento card style with consistent border-radius
  - Proper spacing between thumbnail, badges, title, description, and footer
  - Ensure all text is readable and badges are visible on mobile

### 2. `src/components/owner-edit-button.tsx`
**No changes to this file** — we just stop rendering it in the portfolio page.

### 3. `src/components/public/public-share-qr-actions.tsx`
**Minor adjustments:**
- Ensure Share/Copy buttons have visible borders and proper contrast
- Buttons should be clearly visible on the light background

---

## Detailed Design Specifications

### Color Palette (unchanged monochrome)
- Background: `#F5F5F4` (warm light gray)
- Card background: `#FFFFFF`
- Card border: `#E7E5E4` (slightly warmer than current `#E1E1DF`)
- Text primary: `#111111`
- Text secondary: `#525252`
- Text muted: `#8A8A8A`
- Accent/active: `#111111` (dark buttons)
- Badge bg: `#F5F5F4`, badge border: `#E7E5E4`

### Border Radius System (Bento)
- Outer card: `rounded-3xl` (24px)
- Inner elements: `rounded-2xl` (16px)
- Badges/pills: `rounded-full`
- Thumbnails: `rounded-xl` (12px)

### Spacing System
- Page padding mobile: `px-4` (16px)
- Page padding desktop: `px-6` (24px)
- Card internal padding mobile: `p-4` (16px)
- Card internal padding desktop: `p-6` (24px)
- Gap between bento cards: `gap-4` (16px)
- Gap between sections: `gap-6` (24px)

### Bento Grid Layout

#### Profile Header Section
```
Mobile (< 768px):
┌─────────────────────────┐
│  Cover Image (h-40)     │
│  rounded-2xl            │
├─────────────────────────┤
│  Avatar + Name + Bio    │
│  centered, clean        │
└─────────────────────────┘

Desktop (≥ 1024px):
┌────────────────────┬──────────────┐
│  Avatar            │              │
│  Name + Badge      │  Cover Image │
│  @username • Role  │  (fill)      │
│  Bio text          │              │
└────────────────────┴──────────────┘
```

#### Video Filter Bar
```
Mobile:
┌─────────────────────────┐
│ VIDEO PORTFOLIO          │
│ Karya public terbaru     │
├─────────────────────────┤
│ [Semua] [■ Grid] [≡ List]│  ← full width, centered
└─────────────────────────┘

Desktop:
┌──────────────────────────────────────────┐
│ VIDEO PORTFOLIO                          │
│ Karya public terbaru    [Semua][Grid][List]│
└──────────────────────────────────────────┘
```

#### Video Cards Grid
```
Mobile (< 640px):     1 column, full width
Tablet (640-1024px):  2 columns
Desktop (≥ 1280px):   3 columns

Each card:
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │   Thumbnail       │  │
│  │   aspect-video    │  │
│  └───────────────────┘  │
│                         │
│  [Source] [Type] [Dur]  │
│                         │
│  Title (bold, 2 lines)  │
│  Description (3 lines)  │
│                         │
│  📅 Date    Lihat Detail│
└─────────────────────────┘
```

---

## Implementation Steps

### Step 1: Remove OwnerEditButton from Portfolio Page
In `PortfolioCreatorPublicPage`, remove line:
```tsx
{profile.isOwner && <OwnerEditButton />}
```
**Note:** Keep it in `BioCreatorPublicPage` — only remove from portfolio.

### Step 2: Redesign Profile Header Card
Replace the current profile card (lines 220-238) with a cleaner Bento layout:
- Use CSS Grid with `lg:grid-cols-[1fr_0.8fr]`
- Profile info section: clean white background, proper padding
- Cover section: rounded image with subtle overlay
- Mobile: stack vertically, cover on top, info below
- Ensure avatar has proper shadow and border

### Step 3: Redesign Filter/Toggle Bar
Replace current filter bar (lines 241-251):
- Wrap in a clean container with proper mobile alignment
- Title section and toggle should stack on mobile (`flex-col`)
- Toggle pills should have clear borders and visible active state
- Active pill: `bg-[#111111] text-white` with visible shadow
- Inactive pill: `bg-white text-[#525252] border border-[#E7E5E4]`

### Step 4: Redesign Video Cards
Update `PortfolioVideoCard` component:
- Consistent padding: `p-3` on mobile, `p-4` on desktop
- Thumbnail with `rounded-xl` and proper aspect ratio
- Badges row with consistent spacing
- Title with `line-clamp-2`
- Description with `line-clamp-2` (reduced from 3)
- Footer with date and "Lihat Detail" properly aligned
- Hover effect: subtle lift + border color change

### Step 5: Ensure Mobile Responsiveness
- All elements must be properly aligned with consistent `px-4` on mobile
- No horizontal overflow
- Buttons must have visible borders (no invisible buttons)
- Touch targets minimum 44px height
- Cards should have equal spacing

### Step 6: Back Button & Share Actions
- Back button: clean pill with visible border
- Share/Copy buttons: ensure proper contrast and visibility
- On mobile, buttons should be full-width or properly sized

---

## Key Principles

1. **Alignment** — Every element aligns to the same grid. No orphaned margins.
2. **Visibility** — All interactive elements have visible borders/backgrounds. No "invisible" buttons.
3. **Consistency** — Same border-radius, same spacing, same color tokens everywhere.
4. **Mobile-first** — Design for 375px width first, then scale up.
5. **Bento aesthetic** — Rounded cards with subtle shadows, clean gaps, modular grid feel.

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/public/public-creator-pages.tsx` | Major redesign of `PortfolioCreatorPublicPage` + `PortfolioVideoCard` |
| `src/components/owner-edit-button.tsx` | No changes (just not rendered in portfolio) |
| `src/components/public/public-share-qr-actions.tsx` | Minor: ensure button visibility |

No new files needed. No dependency changes.
