# Dashboard Redesign Plan — Ultra-Clean Monochrome SaaS

## Executive Summary

Redesign the Showreels.id dashboard to match the PRD specifications with an **ultra-clean monochrome** aesthetic inspired by modern SaaS platforms. The redesign focuses on:

- **Clean-first design**: White cards, thin borders, minimal shadows
- **Monochrome palette**: Slate/zinc dominance with emerald accents for positive states
- **Bento Grid layout**: Compact information display on desktop
- **Dual navigation**: Desktop sidebar + mobile bottom nav
- **Reference-driven**: Following the first UI reference's layout patterns

---

## Current State Analysis

### Existing Color Scheme
The current dashboard uses a **blue-centric** color palette:
- Active states: [`bg-blue-50/80 text-blue-600`](src/components/dashboard/dashboard-shell.tsx:163)
- Hover states: [`hover:bg-blue-50/50 hover:text-blue-600`](src/components/dashboard/dashboard-shell.tsx:164)
- Badges: [`bg-blue-50/50 text-blue-600`](src/components/dashboard/dashboard-shell.tsx:177)
- Primary buttons: [`bg-blue-600 hover:bg-blue-700`](src/app/dashboard/page.tsx:96)

### Current Components
- [`DashboardShell`](src/components/dashboard/dashboard-shell.tsx:45) - Main layout wrapper
- [`dashboard/page.tsx`](src/app/dashboard/page.tsx:1) - Overview page with Bento cards
- Dashboard child components in [`src/components/dashboard/`](src/components/dashboard/)

### Navigation Structure
- Desktop: Fixed sidebar (264px width)
- Mobile: Slide-out drawer menu
- **Missing**: Bottom navigation for mobile (per PRD requirement)

---

## Design System Specification

### Color Palette

```typescript
// Background & Surface
bg-slate-50          // Main background
bg-white             // Card background
border-slate-200     // Card borders

// Text Hierarchy
text-slate-900       // Primary headings
text-slate-500       // Secondary text
text-slate-400       // Labels (uppercase)

// Active & Interactive States
bg-zinc-800          // Active menu items
text-white           // Active text
hover:bg-slate-100   // Inactive hover
text-slate-900       // Inactive hover text

// Positive Status
bg-emerald-50        // Positive badge background
text-emerald-600     // Positive badge text

// Borders & Shadows
border-slate-200     // Standard border
rounded-2xl          // Card radius
shadow-sm            // Minimal shadow (optional)
```

### Typography Scale

```typescript
// Headings
text-2xl md:text-3xl font-semibold tracking-tight text-slate-900  // Page title
text-lg font-semibold text-slate-900                              // Section title
text-sm font-medium text-slate-900                                // Card title

// Labels & Body
text-xs uppercase tracking-[0.18em] text-slate-400  // Label
text-sm text-slate-500                              // Body text
text-xs font-medium                                 // Badge text
```

### Component Patterns

#### Card Component
```tsx
className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5"
```

#### Active Navigation Item
```tsx
className="bg-zinc-800 text-white rounded-xl px-3 py-2.5"
```

#### Inactive Navigation Item
```tsx
className="text-slate-900 hover:bg-slate-100 rounded-xl px-3 py-2.5"
```

#### Status Badge (Positive)
```tsx
className="rounded-full bg-emerald-50 text-emerald-600 px-2.5 py-0.5 text-xs font-medium"
```

#### Status Badge (Neutral)
```tsx
className="rounded-full bg-slate-100 text-slate-500 px-2.5 py-0.5 text-xs font-medium"
```

---

## Implementation Plan

### Phase 1: Core Layout Components

#### 1.1 Update DashboardShell Component

**File**: [`src/components/dashboard/dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:1)

**Changes**:
- Replace all `bg-blue-*` with `bg-zinc-800` for active states
- Replace all `text-blue-*` with `text-white` for active text
- Replace all `hover:bg-blue-*` with `hover:bg-slate-100`
- Update sidebar styling to match PRD reference
- Add logo dropdown-style chip in sidebar
- Update plan badge to use slate colors
- Simplify header breadcrumb styling

**Key Updates**:
```tsx
// Active nav item (line 162-164)
active
  ? "bg-zinc-800 text-white rounded-xl"
  : "text-slate-900 hover:bg-slate-100 rounded-xl"

// Plan badge (line 177-178)
className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"

// Sidebar container
className="border-r border-slate-200 bg-white"
```

#### 1.2 Create Mobile Bottom Navigation

**New File**: `src/components/dashboard/bottom-navigation.tsx`

**Specification**:
- Fixed position at bottom on mobile (`<768px`)
- Hidden on desktop (`md:hidden`)
- 4 main menu items: Overview, Build Link, Videos, Analytics
- Active state: `text-zinc-800`
- Inactive state: `text-slate-400`
- Grid layout: `grid-cols-4`

**Component Structure**:
```tsx
<nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-4 py-2 md:hidden">
  <div className="grid grid-cols-4 gap-1">
    {/* Navigation items */}
  </div>
</nav>
```

#### 1.3 Update Main Layout Wrapper

**File**: [`src/components/dashboard/dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:301)

**Changes**:
- Add `pb-24 md:pb-0` to main content area for bottom nav spacing
- Update background to `bg-slate-50`
- Ensure sidebar is hidden on mobile: `hidden lg:block`

---

### Phase 2: Dashboard Overview Page Redesign

#### 2.1 Update Hero Card Component

**File**: [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:72)

**Changes**:
- Remove blue gradient badge background
- Use slate-based badge: `bg-slate-50 text-slate-500`
- Update primary button to `bg-zinc-800 text-white hover:bg-zinc-700`
- Simplify card styling to match PRD

**Before**:
```tsx
className="bg-blue-50/50 text-blue-600"
```

**After**:
```tsx
className="bg-slate-50 text-slate-500 border border-slate-200"
```

#### 2.2 Update Stats Cards

**File**: [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:150)

**Changes**:
- Replace colored badges with emerald (positive) or slate (neutral)
- Update card styling to pure white with slate borders
- Add uppercase label styling: `text-xs uppercase tracking-[0.18em] text-slate-400`

**Stats Card Pattern**:
```tsx
<div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
  <div className="flex items-center justify-between gap-3">
    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
      {label}
    </p>
    <span className="rounded-full bg-emerald-50 text-emerald-600 px-2.5 py-0.5 text-xs font-medium">
      {delta}
    </span>
  </div>
  <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
    {value}
  </p>
</div>
```

#### 2.3 Update Video List Container

**File**: [`src/components/dashboard/dashboard-video-list.tsx`](src/components/dashboard/dashboard-video-list.tsx:1)

**Changes**:
- Wrap video cards in `bg-slate-50 p-4 rounded-3xl` container
- Update individual video cards to white with slate borders
- Replace status badge colors with emerald (public) or slate (draft)

#### 2.4 Update Quick Actions Card

**File**: [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:200)

**Changes**:
- Update action buttons to slate borders
- Use `hover:bg-slate-100` for hover states
- Simplify icon colors to `text-slate-400`

---

### Phase 3: Child Pages Update

#### 3.1 Videos Page

**File**: [`src/app/dashboard/videos/page.tsx`](src/app/dashboard/videos/page.tsx:1)

**Changes**:
- Replace blue gradients with clean white cards
- Update CTA buttons to zinc-800
- Update border colors to slate-200

#### 3.2 Analytics Page

**File**: [`src/app/dashboard/analytics/page.tsx`](src/app/dashboard/analytics/page.tsx:1)

**Changes**:
- Update chart container styling
- Replace blue accents with slate
- Update metric cards to match new design system

#### 3.3 Billing Page

**File**: [`src/app/dashboard/billing/page.tsx`](src/app/dashboard/billing/page.tsx:1)

**Changes**:
- Update plan cards to monochrome
- Replace blue trial banner with slate-based design
- Update pricing table styling

#### 3.4 Profile & Settings Pages

**Files**: 
- [`src/app/dashboard/profile/page.tsx`](src/app/dashboard/profile/page.tsx:1)
- [`src/app/dashboard/settings/page.tsx`](src/app/dashboard/settings/page.tsx:1)

**Changes**:
- Update form containers to white cards with slate borders
- Replace blue focus states with zinc-800
- Update button styling to match design system

---

### Phase 4: Shared Components Update

#### 4.1 Button Component

**File**: [`src/components/ui/button.tsx`](src/components/ui/button.tsx:1)

**Changes**:
- Update primary variant: `bg-zinc-800 text-white hover:bg-zinc-700`
- Update secondary variant: `border-slate-200 bg-white hover:bg-slate-100`
- Remove blue color variants

#### 4.2 Badge Component

**File**: [`src/components/ui/badge.tsx`](src/components/ui/badge.tsx:1)

**Changes**:
- Add emerald variant for positive states
- Add slate variant for neutral states
- Remove blue variants

#### 4.3 Card Component

**File**: [`src/components/ui/card.tsx`](src/components/ui/card.tsx:1)

**Changes**:
- Update default styling: `border-slate-200 bg-white rounded-2xl`
- Remove colored card variants

---

## Responsive Behavior

### Desktop (`≥768px`)
- Sidebar visible: 288px width (`w-72`)
- Main content: `lg:pl-72` offset
- Bento Grid: Multi-column layout
- Bottom navigation: Hidden

### Mobile (`<768px`)
- Sidebar: Hidden, accessible via hamburger menu
- Bottom navigation: Fixed at bottom, 4 items
- Bento Grid: Single column
- Reduced padding: `p-4` instead of `p-8`
- Compact header

---

## Component Hierarchy

```
DashboardShell
├── Sidebar (Desktop only)
│   ├── Logo Chip
│   ├── Plan Badge
│   ├── Main Menu Nav
│   ├── Account Nav
│   └── Help Card
├── TopHeader
│   ├── Breadcrumb
│   ├── Username Badge
│   └── Avatar
├── Main Content
│   └── {children} (Dashboard pages)
└── BottomNavigation (Mobile only)
    └── 4 Nav Items
```

---

## Migration Strategy

### Step 1: Design System Foundation
1. Create color constant file with new palette
2. Update Tailwind config if needed
3. Document component patterns

### Step 2: Core Layout
1. Update [`DashboardShell`](src/components/dashboard/dashboard-shell.tsx:1)
2. Create [`BottomNavigation`](src/components/dashboard/) component
3. Test navigation on desktop and mobile

### Step 3: Overview Page
1. Update [`dashboard/page.tsx`](src/app/dashboard/page.tsx:1)
2. Update hero card, stats, video list
3. Test Bento Grid responsiveness

### Step 4: Child Pages
1. Update each dashboard child page
2. Ensure consistency across all pages
3. Test navigation flow

### Step 5: Shared Components
1. Update UI components (Button, Badge, Card)
2. Search and replace remaining blue colors
3. Final QA pass

---

## Testing Checklist

### Visual Testing
- [ ] Desktop sidebar matches PRD reference
- [ ] Mobile bottom navigation displays correctly
- [ ] Active states use zinc-800 background
- [ ] Hover states use slate-100 background
- [ ] All cards have slate-200 borders
- [ ] Status badges use emerald (positive) or slate (neutral)
- [ ] No blue colors remain in dashboard

### Responsive Testing
- [ ] Sidebar hidden on mobile (`<768px`)
- [ ] Bottom nav visible on mobile only
- [ ] Bento Grid collapses to single column on mobile
- [ ] Header compact on mobile
- [ ] Padding reduced appropriately on mobile

### Functional Testing
- [ ] Navigation works on desktop sidebar
- [ ] Navigation works on mobile bottom nav
- [ ] Active page indicator correct
- [ ] Mobile menu drawer functions
- [ ] All links navigate correctly

### Accessibility Testing
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] Focus states visible

---

## File Modification Summary

### Core Files (High Priority)
1. [`src/components/dashboard/dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:1) - Complete redesign
2. `src/components/dashboard/bottom-navigation.tsx` - New file
3. [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:1) - Major updates

### Dashboard Pages (Medium Priority)
4. [`src/app/dashboard/videos/page.tsx`](src/app/dashboard/videos/page.tsx:1)
5. [`src/app/dashboard/analytics/page.tsx`](src/app/dashboard/analytics/page.tsx:1)
6. [`src/app/dashboard/billing/page.tsx`](src/app/dashboard/billing/page.tsx:1)
7. [`src/app/dashboard/profile/page.tsx`](src/app/dashboard/profile/page.tsx:1)
8. [`src/app/dashboard/settings/page.tsx`](src/app/dashboard/settings/page.tsx:1)

### UI Components (Medium Priority)
9. [`src/components/ui/button.tsx`](src/components/ui/button.tsx:1)
10. [`src/components/ui/badge.tsx`](src/components/ui/badge.tsx:1)
11. [`src/components/ui/card.tsx`](src/components/ui/card.tsx:1)

### Dashboard Components (Low Priority)
12. [`src/components/dashboard/dashboard-video-list.tsx`](src/components/dashboard/dashboard-video-list.tsx:1)
13. [`src/components/dashboard/billing-panel.tsx`](src/components/dashboard/billing-panel.tsx:1)
14. [`src/components/dashboard/profile-form.tsx`](src/components/dashboard/profile-form.tsx:1)
15. Other dashboard components as needed

---

## Design Principles Checklist

- [x] **Clean first**: White cards, thin borders, minimal shadows
- [x] **Monochrome SaaS**: Slate/zinc dominance, emerald accents only
- [x] **Bento Grid compact**: Information visible without long scrolling
- [x] **Navigation clarity**: Sidebar desktop, bottom nav mobile
- [x] **Reference direction**: Following first UI reference patterns

---

## Acceptance Criteria (from PRD)

- [ ] Desktop uses sidebar (left) and top header
- [ ] Mobile uses bottom navigation (not sidebar)
- [ ] All cards use `bg-white border border-slate-200 rounded-2xl`
- [ ] Active menu and primary buttons use `bg-zinc-800 text-white`
- [ ] Positive status uses emerald pastel colors
- [ ] Grid responsive: desktop bento, mobile single column
- [ ] No prominent gradients or dominant blue colors
- [ ] Components work directly in Next.js with Tailwind and lucide-react

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Confirm design decisions** match PRD expectations
3. **Switch to Code mode** to begin implementation
4. **Start with Phase 1** (Core Layout Components)
5. **Iterate through phases** with testing between each

---

## Notes

- The PRD includes a complete React component example that can be used as reference
- Current project uses Next.js 16.2.4, React 19.2.4, Tailwind 4, and lucide-react
- Development server is already running (`npm run dev`)
- All changes should maintain existing functionality while updating visual design
- Consider creating a feature branch for this redesign work
