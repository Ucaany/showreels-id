# Showreels.id V3 UI/UX Revisions - Implementation Plan

## Executive Summary

This plan outlines the implementation of three major UI/UX improvements for Showreels.id V3:

1. **Dashboard Revisions** - Fix active menu contrast, remove brand card, compact Public Link card
2. **Onboarding Flow** - Clean, simple, bento-style stepper with minimal text
3. **Notification System** - Toast notifications with color-coded variants

All changes maintain the **Ultra-Clean Monochrome SaaS Enterprise** aesthetic (Notion/Linear style) with responsive design for desktop and mobile.

---

## Design System Reference

### Color Palette

```tsx
// Base Colors
bg-slate-50        // Background
bg-white           // Cards
text-slate-900     // Primary text
text-slate-500     // Secondary text
border-slate-200   // Borders

// Primary Actions
bg-zinc-900 text-white hover:bg-zinc-800

// Secondary Actions
bg-white border-slate-200 text-slate-900 hover:bg-slate-50

// Status Badges
bg-emerald-50 text-emerald-700 border-emerald-100  // Success
bg-amber-50 text-amber-700 border-amber-100        // Warning
bg-blue-50 text-blue-700 border-blue-100           // Info
bg-rose-50 text-rose-700 border-rose-100           // Error

// Rounded Corners
rounded-2xl  // Cards
rounded-3xl  // Large containers
rounded-xl   // Buttons, inputs
```

### Typography
- Font: **Inter** or modern sans-serif
- Uppercase labels: `text-xs font-semibold uppercase tracking-[0.22em]`

---

## Part 1: Dashboard Revisions

### 1.1 Active Menu Sidebar Fix

**Problem**: Active menu has black background but dark text, making it unreadable.

**Files to Modify**:
- [`src/components/dashboard/dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:156)

**Changes Required**:

```tsx
// Line 165-174: Update renderNavItem function
className={cn(
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
  active 
    ? "bg-zinc-900 text-white shadow-sm"  // ✅ White text on black
    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  !expanded && !mobile && "justify-center"
)}

// Line 172: Update icon color
<Icon className={cn(
  "h-4 w-4", 
  active ? "text-white" : "text-slate-400"  // ✅ White icon when active
)} />
```

**Visual Impact**: Active menu items will have white text/icons on black background for proper contrast.

---

### 1.2 Remove Brand Card from Sidebar

**Problem**: Sidebar has unnecessary "showreels.id Creator workspace" card taking up space.

**Files to Modify**:
- [`src/components/dashboard/dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:178)

**Changes Required**:

Remove lines 181-210 (the brand card section):
```tsx
// ❌ DELETE THIS ENTIRE SECTION
<div className={cn(
  "flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2",
  !expanded && "justify-center"
)}>
  {/* ... brand card content ... */}
</div>
```

**New Sidebar Structure**:
1. Collapse button (desktop only)
2. Creator Mode card (plan badge)
3. Main Menu section
4. Settings section
5. Logout button

**Visual Impact**: Cleaner sidebar with more space for navigation items.

---

### 1.3 Compact Public Link Card

**Problem**: Public Link card has too much vertical spacing.

**Files to Modify**:
- [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:116)

**Changes Required**:

Replace the [`PublicLinkCard`](src/app/dashboard/page.tsx:116) component (lines 116-144):

```tsx
function PublicLinkCard({
  profilePath,
  username,
}: {
  profilePath: string;
  username: string;
}) {
  return (
    <BentoCard className="lg:col-span-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Public Link
          </p>
          <h3 className="mt-3 text-xl font-semibold text-slate-950">{profilePath}</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Bagikan profil creator, link penting, bio, dan portfolio video ke client.
          </p>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-white shadow-sm hover:bg-zinc-800">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 max-sm:grid-cols-1">
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800">
          <Share2 className="h-4 w-4" /> Share
        </button>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50">
          <Copy className="h-4 w-4" /> Copy
        </button>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50">
          <ExternalLink className="h-4 w-4" /> Open
        </button>
      </div>
    </BentoCard>
  );
}
```

**Key Changes**:
- Reduced padding: `p-5` instead of larger spacing
- Compact layout with icon button in header
- Three buttons in one row (desktop) or stacked (mobile)
- Shorter button labels: "Share", "Copy", "Open"

**Integration**: Replace existing [`ShareProfileActions`](src/components/dashboard/share-profile-actions.tsx:65) component with inline buttons.

---

## Part 2: Onboarding Flow Redesign

### 2.1 Onboarding Principles

- **Maximum 3-4 steps**
- **One headline + one short description per step**
- **Bento card selection UI**
- **Clear CTA at bottom**
- **No long paragraphs**

### 2.2 New Onboarding Flow

#### Step 1: Pilih Tujuan
```
Headline: "Apa tujuan utama kamu?"
Subtitle: "Pilih satu agar workspace disesuaikan."

Options (bento cards):
- Cari client
- Tampilkan portfolio
- Bagikan showreel
- Kelola link publik
```

#### Step 2: Role Creator
```
Headline: "Kamu creator apa?"

Options:
- Script Writer
- Video Editor
- Motion Designer
- Videographer
- Social Media Specialist
- Other
```

#### Step 3: Setup Link
```
Headline: "Buat link publikmu"
Input: showreels.id/creator/[username]
CTA: "Cek ketersediaan"
```

#### Step 4: Selesai
```
Headline: "Workspace siap dipakai"
CTA: "Masuk Dashboard"
```

### 2.3 Onboarding Component Architecture

**Files to Create/Modify**:
- [`src/components/onboarding/onboarding-stepper.tsx`](src/components/onboarding/onboarding-stepper.tsx:1) - Major refactor
- `src/components/onboarding/onboarding-option-card.tsx` - New component

**New Component Structure**:

```tsx
// onboarding-option-card.tsx
export function OnboardingOptionCard({
  title,
  icon: Icon,
  selected,
  onClick,
}: {
  title: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl border bg-white p-4 text-left transition hover:border-zinc-300 hover:bg-slate-50",
        selected
          ? "border-zinc-900 ring-1 ring-zinc-900"
          : "border-slate-200"
      )}
    >
      <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {selected && (
        <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-600" />
      )}
    </button>
  );
}
```

### 2.4 Onboarding Layout

**Desktop Layout**:
```tsx
<div className="min-h-screen bg-slate-50 px-6 py-8">
  <div className="mx-auto grid max-w-6xl grid-cols-[220px_1fr] gap-6">
    {/* Left: Stepper sidebar */}
    <aside className="rounded-3xl border border-slate-200 bg-white p-5">
      {/* Step indicators */}
    </aside>
    
    {/* Right: Content area */}
    <main className="rounded-3xl border border-slate-200 bg-white p-10">
      {/* Step content */}
    </main>
  </div>
</div>
```

**Mobile Layout**:
- Hide sidebar stepper
- Show horizontal progress dots at top
- Reduce padding
- 2-column grid for option cards

### 2.5 Stepper Visual Design

**Desktop Stepper** (sidebar):
```tsx
{steps.map((step, index) => (
  <div className="flex items-center gap-3" key={step.label}>
    <div className={cn(
      "grid h-8 w-8 place-items-center rounded-full border text-sm font-semibold",
      currentStep === index
        ? "border-zinc-900 bg-zinc-900 text-white"
        : currentStep > index
        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-white text-slate-400"
    )}>
      {index + 1}
    </div>
    <span className={cn(
      "text-sm font-medium",
      currentStep === index ? "text-slate-950" : "text-slate-500"
    )}>
      {step.label}
    </span>
  </div>
))}
```

**Mobile Progress Dots**:
```tsx
<div className="md:hidden mb-5 flex items-center gap-2">
  {steps.map((_, index) => (
    <div
      key={index}
      className={cn(
        "h-1.5 flex-1 rounded-full",
        currentStep >= index ? "bg-zinc-900" : "bg-slate-200"
      )}
    />
  ))}
</div>
```

---

## Part 3: Notification System

### 3.1 Toast Notification Component

**Files to Create**:
- `src/components/ui/toast.tsx` - New toast component
- `src/components/ui/toast-provider.tsx` - Toast context provider
- `src/hooks/use-toast.ts` - Toast hook

### 3.2 Toast Component Structure

```tsx
// src/components/ui/toast.tsx
import { CheckCircle2, AlertTriangle, Info, OctagonAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

const toastStyles = {
  success: {
    card: "border-emerald-100 bg-emerald-50/80",
    icon: "bg-emerald-100 text-emerald-700",
    iconNode: CheckCircle2,
  },
  warning: {
    card: "border-amber-100 bg-amber-50/80",
    icon: "bg-amber-100 text-amber-700",
    iconNode: AlertTriangle,
  },
  info: {
    card: "border-blue-100 bg-blue-50/80",
    icon: "bg-blue-100 text-blue-700",
    iconNode: Info,
  },
  error: {
    card: "border-rose-100 bg-rose-50/80",
    icon: "bg-rose-100 text-rose-700",
    iconNode: OctagonAlert,
  },
} as const;

export type ToastType = keyof typeof toastStyles;

export interface ToastProps {
  type?: ToastType;
  title: string;
  description?: string;
  onClose?: () => void;
}

export function Toast({ 
  type = "success", 
  title, 
  description, 
  onClose 
}: ToastProps) {
  const style = toastStyles[type];
  const Icon = style.iconNode;

  return (
    <div className={cn(
      "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 shadow-lg shadow-slate-900/5 ring-1 ring-white/60 backdrop-blur",
      style.card
    )}>
      <div className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
        style.icon
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-5 text-slate-600">{description}</p>
        )}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 hover:bg-white/60 hover:text-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

### 3.3 Toast Hook Implementation

```tsx
// src/hooks/use-toast.ts
import { create } from 'zustand';
import type { ToastType } from '@/components/ui/toast';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    
    // Auto-remove after duration
    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function useToast() {
  const { addToast } = useToastStore();
  
  return {
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
  };
}
```

### 3.4 Toast Container Component

```tsx
// src/components/ui/toast-container.tsx
"use client";

import { Toast } from './toast';
import { useToastStore } from '@/hooks/use-toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed right-6 top-6 z-50 flex w-full max-w-sm flex-col gap-3 max-sm:inset-x-3 max-sm:right-auto max-sm:top-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          description={toast.description}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
```

### 3.5 Toast Usage Examples

```tsx
// Replace existing showFeedbackAlert calls with toast
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const toast = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      toast.success("Perubahan tersimpan", "Dashboard berhasil diperbarui.");
    } catch (error) {
      toast.error("Gagal menyimpan", "Coba lagi atau periksa koneksi internet.");
    }
  };
  
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(link);
    toast.info("Link disalin", "Public link siap dibagikan ke client.");
  };
  
  const handleLimitWarning = () => {
    toast.warning("Limit hampir habis", "Upgrade plan untuk membuka analytics 30 hari.");
  };
}
```

### 3.6 Notification Variants

| Type | Use Case | Example |
|------|----------|---------|
| **Success** | Save success, upload complete, action confirmed | "Perubahan tersimpan" |
| **Warning** | Limit warnings, non-critical issues | "Limit hampir habis" |
| **Info** | Copy success, informational updates | "Link disalin" |
| **Error** | Upload failed, network errors, validation errors | "Gagal mengunggah" |

---

## Part 4: Responsive Design Rules

### 4.1 Bento Grid Breakpoints

**Desktop (lg+)**:
```tsx
grid-cols-12 gap-5
Hero Card: col-span-8
Public Link: col-span-4
Stats: col-span-3 each (4 cards)
Analytics: col-span-8
Quick Action: col-span-4
```

**Tablet (md)**:
```tsx
grid-cols-6
Hero: col-span-6
Public Link: col-span-6
Stats: col-span-3 (2x2 layout)
Analytics: col-span-6
Quick Action: col-span-6
```

**Mobile (sm)**:
```tsx
grid-cols-4 gap-3
Hero: col-span-4
Public Link: col-span-4
Stats: col-span-2 (2x2 compact)
Analytics: col-span-4
Quick Action: col-span-4
```

### 4.2 Mobile Stats Compact

```tsx
<div className="grid grid-cols-4 gap-3 md:grid-cols-4">
  {stats.map((stat) => (
    <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-3 md:col-span-1 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 md:text-xs">
          {stat.label}
        </p>
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-50 text-slate-500 md:h-8 md:w-8">
          <stat.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
        {stat.value}
      </p>
      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 md:text-xs">
        {stat.caption}
      </span>
    </div>
  ))}
</div>
```

---

## Implementation Checklist

### Phase 1: Dashboard Revisions (Priority: High)

- [ ] Fix active menu sidebar contrast in [`dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:165)
  - [ ] Update active state className to `bg-zinc-900 text-white shadow-sm`
  - [ ] Update icon color to `text-white` when active
  - [ ] Test on desktop and mobile
  
- [ ] Remove brand card from sidebar in [`dashboard-shell.tsx`](src/components/dashboard/dashboard-shell.tsx:181)
  - [ ] Delete lines 181-210 (brand card section)
  - [ ] Adjust spacing after removal
  - [ ] Verify sidebar layout on collapsed/expanded states
  
- [ ] Compact Public Link card in [`dashboard/page.tsx`](src/app/dashboard/page.tsx:116)
  - [ ] Replace [`PublicLinkCard`](src/app/dashboard/page.tsx:116) component with new compact version
  - [ ] Add inline Share/Copy/Open buttons
  - [ ] Implement responsive grid: 3 cols desktop, 1 col mobile
  - [ ] Test button interactions

### Phase 2: Notification System (Priority: High)

- [ ] Create toast component infrastructure
  - [ ] Create `src/components/ui/toast.tsx` with 4 variants
  - [ ] Create `src/hooks/use-toast.ts` with Zustand store
  - [ ] Create `src/components/ui/toast-container.tsx`
  - [ ] Add [`ToastContainer`](src/components/ui/toast-container.tsx:1) to root layout
  
- [ ] Migrate existing alerts to toast system
  - [ ] Replace [`showFeedbackAlert`](src/lib/feedback-alert.ts:1) calls in dashboard components
  - [ ] Update [`share-profile-actions.tsx`](src/components/dashboard/share-profile-actions.tsx:86)
  - [ ] Update [`copy-profile-link-button.tsx`](src/components/dashboard/copy-profile-link-button.tsx:1)
  - [ ] Test all notification scenarios

### Phase 3: Onboarding Redesign (Priority: Medium)

- [ ] Design new onboarding flow
  - [ ] Create `src/components/onboarding/onboarding-option-card.tsx`
  - [ ] Refactor [`onboarding-stepper.tsx`](src/components/onboarding/onboarding-stepper.tsx:1) with new 4-step flow
  - [ ] Implement bento card selection UI
  - [ ] Add mobile progress dots
  
- [ ] Update onboarding steps
  - [ ] Step 1: Goal selection (4 options)
  - [ ] Step 2: Creator role (6 options)
  - [ ] Step 3: Username setup
  - [ ] Step 4: Completion screen
  
- [ ] Responsive onboarding layout
  - [ ] Desktop: sidebar + main content
  - [ ] Mobile: progress dots + stacked content
  - [ ] Test all breakpoints

### Phase 4: Testing & Polish (Priority: Medium)

- [ ] Cross-browser testing
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari
  
- [ ] Responsive testing
  - [ ] Desktop (1920px, 1440px, 1280px)
  - [ ] Tablet (768px, 1024px)
  - [ ] Mobile (375px, 414px, 390px)
  
- [ ] Accessibility audit
  - [ ] Keyboard navigation
  - [ ] Screen reader compatibility
  - [ ] Color contrast ratios
  - [ ] Focus indicators

### Phase 5: Documentation (Priority: Low)

- [ ] Update component documentation
- [ ] Create Storybook stories for new components
- [ ] Document toast usage patterns
- [ ] Update design system documentation

---

## Migration Strategy

### Gradual Rollout Approach

1. **Week 1**: Dashboard revisions (non-breaking changes)
   - Deploy sidebar fixes
   - Deploy compact Public Link card
   - Monitor user feedback

2. **Week 2**: Notification system
   - Deploy toast infrastructure
   - Migrate critical alerts (save, copy, errors)
   - Keep [`showFeedbackAlert`](src/lib/feedback-alert.ts:1) as fallback

3. **Week 3**: Onboarding redesign
   - Deploy new onboarding flow
   - A/B test with existing flow
   - Monitor completion rates

4. **Week 4**: Complete migration
   - Remove old alert system
   - Final polish and bug fixes
   - Performance optimization

---

## Technical Considerations

### Dependencies

**New Dependencies Required**:
```json
{
  "zustand": "^4.5.0"  // For toast state management
}
```

**Existing Dependencies Used**:
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `next` - Framework
- `react` - UI library

### Performance Impact

- **Toast System**: Minimal impact (~2KB gzipped)
- **Onboarding Refactor**: No performance change (same component count)
- **Dashboard Changes**: Slight improvement (removed brand card)

### Browser Support

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)
- No IE11 support required

---

## Acceptance Criteria

### Dashboard Revisions
✅ Active sidebar menu has white text on black background  
✅ Active sidebar icon is white  
✅ Brand card removed from sidebar  
✅ Sidebar can collapse/expand smoothly  
✅ Public Link card is compact with inline buttons  
✅ All buttons are properly aligned  
✅ Mobile stats display in 2x2 grid  

### Onboarding Flow
✅ Maximum 4 steps with clear progression  
✅ Each step has one headline and short description  
✅ Bento card selection UI works on all devices  
✅ Desktop shows sidebar stepper  
✅ Mobile shows horizontal progress dots  
✅ No long paragraphs or excessive text  

### Notification System
✅ Toast notifications have 4 variants (success, warning, info, error)  
✅ Toasts auto-dismiss after 3 seconds  
✅ Toasts can be manually closed  
✅ Multiple toasts stack properly  
✅ Mobile toasts are full-width and compact  
✅ Toasts don't block bottom navigation on mobile  

### Responsive Design
✅ All layouts work on desktop (1920px, 1440px, 1280px)  
✅ All layouts work on tablet (768px, 1024px)  
✅ All layouts work on mobile (375px, 414px, 390px)  
✅ Touch targets are minimum 44x44px on mobile  
✅ Text is readable at all breakpoints  

### Design Consistency
✅ Maintains Ultra-Clean Monochrome aesthetic  
✅ Uses approved color palette (slate, zinc, emerald, amber, blue, rose)  
✅ Consistent rounded corners (2xl for cards, xl for buttons)  
✅ Proper spacing and padding throughout  
✅ Inter font family used consistently  

---

## Risk Assessment

### Low Risk
- Dashboard sidebar fixes (isolated changes)
- Public Link card compact (visual only)
- Toast component creation (additive)

### Medium Risk
- Onboarding flow refactor (affects new user experience)
- Toast migration (requires testing all alert scenarios)

### High Risk
- None identified

### Mitigation Strategies
1. Feature flags for onboarding A/B testing
2. Gradual rollout with monitoring
3. Fallback to old alert system if toast fails
4. Comprehensive testing before production deploy

---

## Success Metrics

### User Experience
- Onboarding completion rate: Target 80%+ (up from current)
- Dashboard navigation clarity: Reduced support tickets
- Notification visibility: User feedback surveys

### Technical
- Page load time: No regression
- Lighthouse score: Maintain 90+ performance
- Bundle size: <5KB increase

### Business
- User activation rate: 10% improvement
- Feature adoption: Track Build Link usage
- Support tickets: 20% reduction in UI confusion

---

## Next Steps

1. **Review this plan** with the team
2. **Prioritize phases** based on business needs
3. **Assign tasks** to developers
4. **Set up feature flags** for gradual rollout
5. **Create test plan** for QA team
6. **Schedule design review** for final approval

---

## Appendix: Code Snippets

### A. Complete Toast System Implementation

See sections 3.2, 3.3, 3.4 for full code.

### B. Onboarding Option Card Component

See section 2.3 for full code.

### C. Responsive Grid Examples

See section 4.1 for breakpoint configurations.

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-29  
**Author**: Kiro AI Architect  
**Status**: Ready for Review
