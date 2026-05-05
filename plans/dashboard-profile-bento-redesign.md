# Dashboard Profile — Bento UI Redesign Plan

## Executive Summary

Redesign the Dashboard Profile page (`src/components/dashboard/profile-form.tsx`) with a clean, modern **Bento UI** layout. The page will be stripped of redundant sections, reorganized into a grid-based card system with generous whitespace, soft rounded corners, subtle shadows, and a harmonious visual hierarchy. Fully responsive across all viewports.

---

## Current State Analysis

### File: `src/components/dashboard/profile-form.tsx` (1444 lines)

**Current sections in the form:**
1. **Visual Profile** (lines 694–869) — Cover image + Avatar with crop
2. **Identitas Utama** (lines 871–949) — Full Name, Role, Username, Birth Date, City, Address
3. **Bio & Experience** (lines 953–1033) — Bio textarea + Experience textarea
4. **Kontak & Social Media** (lines 1035–1103) — Email, Phone, Website, Instagram, YouTube, Facebook, Threads, LinkedIn, Skills
5. **Link/Block redirect banner** (lines 1105–1127) — Info card pointing to Build Link page
6. **Hidden Custom Links section** (lines 1129–1268) — Already hidden, legacy code

**Right sidebar (lines 1295–1403):**
- Live preview card with cover, avatar, name, role, username, city
- Public summary (age, city)
- Internal dashboard data (address)
- Contact Info preview (email, phone, website, LinkedIn)
- Bio preview
- Experience preview
- Social links preview

---

## Changes Required

### 1. REMOVE: Contact & Social Media Section (lines 1035–1103)
**Rationale:** This information already exists in the Build Link page (`link-builder-editor.tsx`) which has its own social media management with the same `SOCIAL_PLATFORMS` config.

**Fields to remove from the profile form:**
- `contactEmail` — already on Build Link
- `phoneNumber` — already on Build Link
- `websiteUrl` — already on Build Link
- `instagramUrl` — already on Build Link
- `youtubeUrl` — already on Build Link
- `facebookUrl` — already on Build Link
- `threadsUrl` — already on Build Link
- `linkedinUrl` — already on Build Link

**Note:** These fields remain in the schema/DB and API payload — we only remove them from the Profile page UI. The Build Link page already manages them.

### 2. RELOCATE: Link & Block Elements → Build Link Page
The custom links section is already hidden (`className="hidden"`) and the redirect banner already exists. We will:
- Remove the hidden custom links section entirely (dead code cleanup)
- Keep the redirect banner but restyle it as a minimal Bento card

### 3. MOVE: Full Address Field — Dashboard Only
The address field already has the label "Alamat Lengkap (dashboard only)" and the hint says it's not shown publicly. The public profile (`public-creator-pages.tsx`) does NOT display the address. This is already correct behavior. We keep it in the profile form but ensure it's clearly marked as internal-only within the new Bento layout.

### 4. REMOVE from sidebar preview:
- Contact Info card (email, phone, website, LinkedIn)
- Social links component
- These are now exclusively managed via Build Link

---

## New Bento UI Layout Architecture

### Design Tokens (CSS Custom Properties)

```css
/* Add to globals.css */
:root {
  --bento-radius: 1.25rem;
  --bento-radius-inner: 0.875rem;
  --bento-gap: 1rem;
  --bento-padding: 1.25rem;
  --bento-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03);
  --bento-border: rgba(226, 232, 240, 0.8);
  --bento-bg: rgba(255, 255, 255, 0.95);
  --bento-bg-subtle: rgba(248, 250, 252, 0.8);
}
```

### Grid Layout (Desktop → Mobile)

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Header (minimal: title + auto-save status)                │
└─────────────────────────────────────────────────────────────────┘

Desktop (xl): 2-column grid [main form | sticky preview sidebar]
Tablet (md-lg): single column, preview collapses below
Mobile (sm): single column, full-width cards stacked

MAIN FORM AREA — Bento Grid:
┌──────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────┐ ┌──────────────────────────┐ │
│ │  🎨 Visual Profile          │ │  👤 Identity             │ │
│ │  (Cover + Avatar)           │ │  (Name, Role, Username,  │ │
│ │  [span: full on mobile]     │ │   Birth Date, City)      │ │
│ └─────────────────────────────┘ └──────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │  📝 Bio & Experience (full width, 2-col inner grid)        │ │
│ └────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────┐ ┌──────────────────────────┐ │
│ │  🏷️ Skills                  │ │  🏠 Internal Address     │ │
│ │  (comma-separated tags)     │ │  (dashboard-only)        │ │
│ └─────────────────────────────┘ └──────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │  🔗 Build Link Redirect (minimal info card)                │ │
│ └────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │  💾 Actions (Save + View Public Profile)                   │ │
│ └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

SIDEBAR (xl only, sticky):
┌──────────────────────────┐
│  Live Preview Card       │
│  - Cover preview         │
│  - Avatar + Name + Role  │
│  - @username             │
│  - City                  │
│  - Age summary           │
│  - Bio preview           │
│  - Experience preview    │
│  - Internal address note │
└──────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Layout | Behavior |
|---|---|---|
| `< 640px` (mobile) | Single column, full-bleed cards | Cards stack vertically, no sidebar, generous vertical spacing |
| `640px–1023px` (tablet) | Single column, contained | Cards stack, sidebar preview below form |
| `1024px–1279px` (lg) | Single column, wider cards | 2-col inner grids activate |
| `≥ 1280px` (xl) | 2-column: form + sticky sidebar | Full bento grid with sidebar |

---

## Implementation Steps

### Step 1: Update `globals.css` — Add Bento Design Tokens

Add new CSS custom properties and utility classes for the bento grid system.

```css
/* Bento Profile Grid */
.bento-profile-grid {
  display: grid;
  gap: var(--bento-gap);
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .bento-profile-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.bento-card {
  border: 1px solid var(--bento-border);
  border-radius: var(--bento-radius);
  background: var(--bento-bg);
  box-shadow: var(--bento-shadow);
  padding: var(--bento-padding);
  min-width: 0;
  overflow: hidden;
}

.bento-card-full {
  grid-column: 1 / -1;
}
```

### Step 2: Rewrite `profile-form.tsx` — Restructure into Bento Cards

**Remove:**
- All social media field watchers (`watchedInstagram`, `watchedYoutube`, `watchedFacebook`, `watchedThreads`, `watchedLinkedin`, `watchedContactEmail`, `watchedPhoneNumber`, `watchedWebsiteUrl`)
- The entire "Kontak & social media" section (lines 1035–1103)
- The hidden custom links section (lines 1129–1268)
- Social media imports (`FaFacebookF`, `FaInstagram`, `FaLinkedinIn`, `FaYoutube`, `SiThreads`)
- `SOCIAL_PLATFORMS` array and `extractFromUrl` helper (these remain in link-builder-editor.tsx)
- `SocialLinks` component import
- `CustomLinksList` component import
- Contact Info preview from sidebar
- Social links preview from sidebar

**Keep (but restyle):**
- Visual Profile card (Cover + Avatar with crop)
- Identity card (Name, Role, Username, Birth Date, City)
- Bio & Experience card
- Skills field (promoted to its own bento card)
- Address field (in its own "Internal" bento card, clearly marked dashboard-only)
- Build Link redirect card (restyled)
- Live preview sidebar (simplified — no contact/social)

**Schema changes:** Keep all fields in the Zod schema for backward compatibility with the API, but set removed fields to pass-through (use existing DB values). The `buildProfilePayload` function will still send social/contact fields using the existing user data rather than form inputs.

### Step 3: Simplify the Sidebar Preview

The sidebar will show:
- Cover preview (with crop)
- Avatar + Name + Role + @username + City
- Age summary
- Bio rich text preview
- Experience rich text preview
- Internal address (labeled as "dashboard only")

Remove from sidebar:
- Contact Info card
- Social links component
- Custom links list (already hidden)

### Step 4: Responsive Polish

- All bento cards use `min-width: 0` and `overflow: hidden` to prevent content blowout
- Inputs use `font-size: 16px` on mobile to prevent iOS zoom
- Grid gaps reduce on mobile (`gap: 0.75rem` at `< 640px`)
- Sidebar becomes inline (below form) on screens < 1280px
- Cover preview aspect ratio maintained with `aspect-ratio: 16/9` instead of fixed height

---

## Component Structure (New)

```tsx
// profile-form.tsx — simplified structure

export function ProfileForm({ user }: { user: DbUser }) {
  // ... form setup (reduced watchers) ...

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main Form */}
        <div className="space-y-4">
          {/* Page Header — minimal */}
          <div className="bento-card bento-card-full">
            <PageHeader autoSaveLabel={autoSaveLabel} />
          </div>

          {/* Bento Grid */}
          <div className="bento-profile-grid">
            {/* Visual Profile Card */}
            <BentoVisualProfile form={form} ... />

            {/* Identity Card */}
            <BentoIdentity form={form} ... />

            {/* Bio & Experience — full width */}
            <BentoBioExperience form={form} ... />

            {/* Skills Card */}
            <BentoSkills form={form} ... />

            {/* Internal Address Card */}
            <BentoInternalAddress form={form} ... />

            {/* Build Link Redirect */}
            <BentoBuildLinkRedirect />
          </div>

          {/* Actions */}
          <div className="bento-card">
            <FormActions ... />
          </div>
        </div>

        {/* Sidebar Preview */}
        <div className="xl:sticky xl:top-24 xl:h-fit">
          <BentoPreviewSidebar ... />
        </div>
      </div>

      {/* Crop Dialogs */}
      {activeCropTarget === "cover" && <ImageCropDialog ... />}
      {activeCropTarget === "avatar" && <ImageCropDialog ... />}
    </>
  );
}
```

**Note:** The sub-components (`BentoVisualProfile`, `BentoIdentity`, etc.) are inline within the same file to avoid prop-drilling complexity. They are just organizational sections, not separate files.

---

## Visual Design Specifications

### Bento Card Style
- **Border:** `1px solid rgba(226, 232, 240, 0.8)` (soft slate)
- **Border-radius:** `1.25rem` (20px)
- **Background:** `rgba(255, 255, 255, 0.95)` with subtle backdrop blur
- **Shadow:** `0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)`
- **Padding:** `1.25rem` (desktop), `1rem` (mobile)
- **Hover (optional):** slight border color shift to `rgba(203, 213, 225, 1)`

### Typography Hierarchy
- **Card title:** `text-sm font-semibold text-slate-900` with icon
- **Field label:** `text-sm font-medium text-slate-700`
- **Field hint:** `text-xs text-slate-500`
- **Error:** `text-xs text-rose-600`

### Spacing
- **Between cards:** `1rem` (gap)
- **Inside cards:** `1.25rem` padding, `1rem` gap between fields
- **Section icon + title:** `gap-2` with `h-4 w-4` icon

### Color Palette (Minimal)
- Primary accent: `brand-600` (existing blue)
- Backgrounds: white → slate-50
- Borders: slate-200 with opacity
- Text: slate-950 → slate-700 → slate-500

---

## Files to Modify

| File | Action |
|---|---|
| `src/components/dashboard/profile-form.tsx` | Major rewrite — Bento layout, remove social/contact/links sections |
| `src/app/globals.css` | Add bento design tokens and utility classes |

## Files NOT Modified (Confirmed Safe)

| File | Reason |
|---|---|
| `src/components/builder/link-builder-editor.tsx` | Already has social media management — no changes needed |
| `src/components/public/public-creator-pages.tsx` | Already doesn't show address — no changes needed |
| `src/server/auth-profile.ts` | Schema unchanged |
| `src/db/schema.ts` | No DB changes |
| API routes | Payload structure unchanged (social fields pass through with existing values) |

---

## Migration Safety

1. **No breaking API changes** — The profile PATCH endpoint still accepts all fields. The form will pass existing user values for social/contact fields that are no longer editable on this page.
2. **No DB migration needed** — All columns remain.
3. **Build Link page already manages social/contact** — Users won't lose access to editing these fields.
4. **Address field** — Already dashboard-only (not shown on public profile). We just make this clearer in the new UI.

---

## Estimated Complexity

- **profile-form.tsx:** ~800–900 lines (down from 1444) — significant reduction
- **globals.css:** +30 lines for bento tokens
- **Risk:** Low — purely UI restructuring, no data/API changes
