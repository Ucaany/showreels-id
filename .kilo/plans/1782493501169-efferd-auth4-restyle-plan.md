# Plan: Restyle Auth Pages dengan @efferd/auth-4 + Particles Background

## Tujuan
Restyle halaman Login, Daftar (Signup), Lupa Sandi (Forgot Password), dan Reset Password menggunakan layout `@efferd/auth-4` (narrow card max-w-sm dengan border-x, full-width dividers, input-group) + Particles background dari `@efferd/auth-1`. Semua fungsi bisnis existing dipertahankan. Branding showreels.id 100% (AppLogo, copy dictionary, terms link). Tidak push ke git/Vercel.

## Constraints
- JANGAN mengubah API routes (`/api/auth/*`) atau `src/app/auth/*/page.tsx` (kecuali tidak ada perubahan diperlukan)
- JANGAN push ke git atau Vercel
- JANGAN menambah provider GitHub Auth
- Pertahankan semua logika: zod validation, react-hook-form, authLock, bootstrap flow, dictionary i18n, Google opsional via env, show/hide password, forgot-password success state, AnimatePresence
- Gunakan `AppLogo` existing (`src/components/app-logo.tsx`) — HAPUS logo efferd jika terinstall
- Hapus `components/auth-page.tsx` jika dibuat oleh installer

## Langkah Implementasi

### 1. Install komponen dari @efferd/auth-4
```bash
npx shadcn@latest add @efferd/auth-4 --overwrite
```
Yang akan terinstall: `input-group`, `auth-divider`, `full-width-divider`, `google-icon`, logo efferd (akan dihapus)

### 2. Install @magicui/particles
```bash
npx shadcn@latest add @magicui/particles
```
Komponent Particles dipakai sebagai background di AuthShell.

### 3. Bersihkan file efferd yang tidak dipakai
- Hapus `src/components/logo.tsx` (jika ada — ganti dengan AppLogo existing)
- Hapus `src/components/auth-page.tsx` (jika dibuat oleh installer)
- JANGAN hapus `src/components/icons/google-icon.tsx` (dipakai)
- JANGAN hapus `src/components/auth-divider.tsx`
- JANGAN hapus `src/components/full-width-divider.tsx`
- JANGAN hapus `src/components/ui/input-group.tsx`
- JANGAN hapus `src/components/ui/particles.tsx`

### 4. Refactor `src/components/auth/auth-shell.tsx`
Ganti layout lama (grid-bg + glow-blob + rounded card putih) dengan:
- Root: `relative w-full overflow-hidden px-4 md:h-screen` dengan `min-h-screen`
- Background: `<Particles className="absolute inset-0" color="#2563eb" ease={20} quantity={80} />` (pakai brand-500 showreels, reduced quantity=80 untuk performa mobile; warp dalam `'use client'` — AuthShell sudah client karena import SitePreferences)
- Layout tengah: `relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x *:px-6`
- Bagian atas card: Logo `<AppLogo />` + title `<h1>` + subtitle `<p>` (ganti icon svg lama)
- Preferences toggle: tetap `{showPreferences ? <SitePreferences compact /> : null}` — pindah ke baris setelah logo di top area
- Konten form (children) dibungkus dengan area yang ada `<FullWidthDivider position="top" />` dan `<FullWidthDivider position="bottom" />`
- Footer tetap dipertahankan
- Pertahankan semua prop: `title`, `subtitle`, `showPreferences`, `footer`, `children`
- Tambah `'use client'` jika belum ada

**Struktur HTML AuthShell baru:**
```tsx
<div className="relative w-full overflow-hidden px-4" style={{minHeight:'100svh'}}>
  <Particles className="absolute inset-0 -z-10" color="#2563eb" ease={20} quantity={80} />
  <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x border-black/[0.06]">
    {/* Header area */}
    <div className="flex flex-col space-y-6 px-6 pt-8">
      <div className="flex items-center justify-between">
        <AppLogo />
        {showPreferences ? <SitePreferences compact /> : null}
      </div>
      <div className="space-y-1">
        <h1 className="font-semibold text-xl tracking-tight text-ink">{title}</h1>
        <p className="text-sm text-ink/60">{subtitle}</p>
      </div>
    </div>
    {/* Form area */}
    <div className="relative my-6 flex flex-col gap-4 px-6 py-8">
      <FullWidthDivider position="top" />
      {children}
      <FullWidthDivider position="bottom" />
    </div>
    {/* Footer */}
    {footer ? (
      <div className="px-6 pb-8 text-center text-[0.75rem] leading-relaxed text-ink/40">
        {footer}
      </div>
    ) : null}
  </div>
</div>
```

### 5. Refactor `src/components/auth/login-form.tsx`
- HAPUS wrapper `<motion.div initial/animate>` luar (opsional: pertahankan jika tidak konflik)
- Ganti `<Input type="email">` dengan `<InputGroup>` + `<InputGroupInput>` + `<InputGroupAddon align="inline-start"><Mail /></InputGroupAddon>`
- Ganti `<Input type="password">` dengan `<InputGroup>` + `<InputGroupInput>` + `<InputGroupAddon>` (icon `LockKeyhole`) + tombol show/hide tetap ada sebagai `<InputGroupAddon align="inline-end">`
- Ganti Google button (raw `<button>`) dengan `<Button variant="outline">` + `<GoogleIcon data-icon="inline-start" />` dari efferd
- Tambah `<AuthDivider>{dictionary.authDividerLogin}</AuthDivider>` antara Google button dan form email (Google HANYA jika `googleEnabled`)
- Forgot password link: pertahankan posisi
- Pertahankan semua handler: `onSubmit`, `onInvalidSubmit`, `handleGoogleLogin`, `authLock`, toast, bootstrap
- Terms paragraph: pindah ke `footer` prop di `<AuthShell>` atau tetap di dalam children
- Form flow order (ikuti auth-4): Logo→title→subtitle di AuthShell, lalu inside form area: Google button (jika enabled) → AuthDivider → email InputGroup → password InputGroup → forgot link → submit button → signup link → terms

### 6. Refactor `src/components/auth/signup-form.tsx`
- Sama seperti login: ganti Input dengan InputGroup untuk fullName, email, password, confirmPassword
- Tombol Google (jika enabled) di atas dengan AuthDivider
- Pertahankan semua handler dan validasi
- Google button pakai `<GoogleIcon>` + `<Button variant="outline">`

### 7. Refactor `src/components/auth/forgot-password-form.tsx`
- Ganti Input email dengan InputGroup + icon Mail
- Pertahankan `AnimatePresence` + success state (MailCheck icon + resend button)
- Pertahankan semua handler

### 8. Refactor `src/components/auth/reset-password-form.tsx` (jika belum dicek)
- Ganti Input password dengan InputGroup + icon LockKeyhole + show/hide addon
- Pertahankan semua handler validasi dan submit

### 9. Verifikasi warna/token CSS
- Pastikan `muted-foreground` dan `border` CSS token (shadcn) sudah ada di `globals.css` (dipakai oleh efferd components)
- Jika belum, mapping ke token showreels yang setara (`text-ink/60`, `border-black/[0.06]`)

## Keputusan Utama
| Keputusan | Pilihan |
|---|---|
| Background | Particles efferd/auth-1, warna #2563eb (brand-500 showreels), quantity=80 |
| Logo | AppLogo existing showreels.id (bukan Logo efferd) |
| Input style | InputGroup efferd (with icon addon) |
| Google button | GoogleIcon efferd + Button outline, conditional via env |
| GitHub button | TIDAK ditambah |
| Dividers | FullWidthDivider + AuthDivider dari efferd |
| Copy text | Dictionary existing (i18n Indonesia/EN) |
| Terms | Link ke /legal/terms + /legal/privacy showreels (dictionary) |
| Animasi | Pertahankan framer-motion existing |
| AuthShell API | Backward-compat: title, subtitle, showPreferences, footer, children |

## Risk & Mitigasi
| Risk | Mitigasi |
|---|---|
| `input-group` styling conflict | Inspect class yang dihasilkan, override dengan `className` props jika perlu |
| Particles performance mobile | quantity=80 (bukan 120), reduced-motion CSS via `@media (prefers-reduced-motion: reduce)` |
| Logo efferd override AppLogo | Hapus `components/logo.tsx` setelah install, pastikan import path benar |
| Token shadcn `muted-foreground` tidak exist | Check globals.css, tambahkan CSS var alias jika missing |
| `auth-page.tsx` override halaman | Hapus file ini setelah install |

## Validation
1. `npm run lint` — no errors
2. `npm run typecheck` — no errors
3. `npm run build` — build sukses
4. Smoke test manual:
   - `/auth/login` → tampil Particles bg + AppLogo showreels + form email/password + forgot link + signup link + Google button (jika env true)
   - `/auth/signup` → tampil form fullName+email+password+confirmPassword + Google button (jika env)
   - `/auth/forgot-password` → form email + success state (MailCheck + resend)
   - `/auth/reset-password` → form password baru
   - Invalid form submit → toast error muncul
   - 5x gagal login → lock state muncul
   - Google disabled (env false) → tombol tidak muncul
5. Tidak ada regresi: halaman lain (landing, dashboard, dll) tidak terpengaruh

## Out of Scope
- API routes `/api/auth/*`
- `src/app/auth/*/page.tsx` (tidak perlu diubah)
- `src/app/auth/callback/route.ts`
- Provider GitHub
- Push ke git / Vercel
- Perubahan desain di luar halaman auth
