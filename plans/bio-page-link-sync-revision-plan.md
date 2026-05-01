# Bio Page & Build Link Sync — Revision Plan

## Tanggal: 2026-05-02
## Status: Ready for Implementation

---

## Ringkasan Masalah

### 1. Sinkronisasi Link antara Build Link (Dashboard) dan Bio Page
Saat ini, flow publish link dari dashboard Build Link ke halaman Bio publik sudah bekerja melalui mekanisme **draft → publish**:
- User menambah/edit link di Build Link → disimpan ke `linkBuilderDraft`
- User klik "Publish" → `linkBuilderDraft` disalin ke `customLinks`
- Halaman Bio publik membaca dari `customLinks` via `getPublicProfile()`

**Masalah yang ditemukan:**
- Preview di halaman Build Link (tab "Preview") **TIDAK** konsisten dengan tampilan di halaman Bio publik. Preview di Build Link hanya menampilkan link sebagai kotak sederhana (`rounded-xl border ... bg-white px-3 py-2`), sedangkan Bio publik menampilkan link dengan style `monoButtonClass` yang lebih kaya (dengan arrow icon, description, dll).

### 2. Teks Role dan Username di Halaman Bio Terpisah Dua Baris
Saat ini di `BioCreatorPublicPage`:
```tsx
{profile.user.role ? <p className="mt-2 text-base font-medium text-[#111111]">{profile.user.role}</p> : null}
<p className="mt-1 text-sm font-semibold text-[#525252]">@{profile.user.username}</p>
```
Role dan Username ditampilkan di **dua baris terpisah**. Permintaan: jadikan **satu baris**.

---

## Rencana Perubahan

### Perubahan 1: Role & Username Satu Baris (Bio Page)

**File:** `src/components/public/public-creator-pages.tsx`  
**Lokasi:** Line 107-108 di dalam `BioCreatorPublicPage`

**Sebelum:**
```tsx
{profile.user.role ? <p className="mt-2 text-base font-medium text-[#111111]">{profile.user.role}</p> : null}
<p className="mt-1 text-sm font-semibold text-[#525252]">@{profile.user.username}</p>
```

**Sesudah:**
```tsx
<p className="mt-2 text-sm font-semibold text-[#525252]">
  {profile.user.role ? <span className="text-base font-medium text-[#111111]">{profile.user.role}</span> : null}
  {profile.user.role ? <span className="mx-1.5 text-[#DADADA]">•</span> : null}
  <span>@{profile.user.username}</span>
</p>
```

Ini menjadikan Role dan Username tampil dalam satu baris dengan separator dot (•).

---

### Perubahan 2: Preview di Build Link Harus Sama dengan Bio Page

**File:** `src/components/builder/link-builder-editor.tsx`  
**Lokasi:** Line 1647-1676 (preview section di tab "Preview")

**Masalah:** Preview saat ini hanya menampilkan link sebagai kotak sederhana:
```tsx
<div className="flex items-center gap-2 rounded-xl border border-[#dce7f8] bg-white px-3 py-2">
  <span className="h-4 w-4 rounded-[5px] bg-[#5f6cff]" />
  <p className="truncate text-sm font-medium text-[#1f2a44]">{link.title}</p>
</div>
```

**Sesudah:** Preview harus meniru tampilan `monoButtonClass` dari Bio publik:
```tsx
<div className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[1rem] border border-[#E1E1DF] bg-white px-3 text-left text-xs font-semibold text-[#111111]">
  <span className="min-w-0">
    <span className="block truncate">{link.title}</span>
    {link.description ? <span className="mt-0.5 block truncate text-[10px] font-medium text-[#8A8A8A]">{link.description}</span> : null}
  </span>
  <ArrowUpRight className="h-3 w-3 shrink-0 text-[#525252]" />
</div>
```

Juga perlu update:
- Role & username di preview harus satu baris (konsisten dengan perubahan #1)
- Tampilan preview harus menggunakan warna/style yang sama dengan Bio publik (`bg-[#F5F5F4]`, card putih, dll)

**Detail perubahan preview (line ~1637-1685):**

```tsx
{/* Preview phone content */}
<div className="h-[620px] overflow-y-auto rounded-[28px] bg-[#F5F5F4] px-4 pb-6 pt-12 text-center">
  {/* Avatar */}
  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#6d64ff] to-[#8f45e9] text-xl font-semibold text-white shadow-[0_14px_34px_rgba(17,17,17,0.12)]">
    {(profileFields.fullName || "C").slice(0, 1).toUpperCase()}
  </div>
  {/* Name */}
  <p className="mt-3 text-xl font-bold tracking-[-0.04em] text-[#111111]">
    {profileFields.fullName || "Display Name"}
  </p>
  {/* Role + Username satu baris */}
  <p className="mt-1.5 text-xs font-semibold text-[#525252]">
    {profileFields.role ? <span className="text-sm font-medium text-[#111111]">{profileFields.role}</span> : null}
    {profileFields.role ? <span className="mx-1 text-[#DADADA]">•</span> : null}
    <span>@{profileFields.username || "creator"}</span>
  </p>
  {/* Bio */}
  <p className="mx-auto mt-3 max-w-[280px] text-xs leading-5 text-[#525252]">
    {profileFields.bio || "Bio kamu akan tampil di sini saat diisi."}
  </p>
  {/* Links - styled like bio page */}
  <div className="mt-4 space-y-2 text-left">
    {previewLinks.length === 0 ? (
      <p className="rounded-[1rem] border border-dashed border-[#DADADA] bg-[#FAFAF9] px-3 py-2 text-center text-xs text-[#525252]">
        Belum ada link aktif.
      </p>
    ) : (
      previewLinks.map((link) =>
        link.type === "divider" ? (
          <div key={link.id} className="my-2 border-t border-[#E1E1DF]" />
        ) : (
          <div
            key={link.id}
            className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[1rem] border border-[#E1E1DF] bg-white px-3 text-left text-xs font-semibold text-[#111111] transition hover:border-[#111111]"
          >
            <span className="min-w-0">
              <span className="block truncate">{link.title}</span>
              {link.description ? <span className="mt-0.5 block truncate text-[10px] font-medium text-[#8A8A8A]">{link.description}</span> : null}
            </span>
            <ArrowUpRight className="h-3 w-3 shrink-0 text-[#525252]" />
          </div>
        )
      )
    )}
  </div>
</div>
```

---

### Perubahan 3: Pastikan Publish Langsung Sinkron ke Bio

**Status:** Sudah bekerja dengan benar.

Flow saat ini:
1. `handleAddLink()` → POST `/api/links` → server menyimpan ke `customLinks` DAN `linkBuilderDraft` sekaligus
2. `handlePublish()` → POST `/api/link-page/publish` → `publishLinkBuilderDraft()` menyalin draft ke `customLinks`
3. Bio publik membaca `customLinks` dari database via `getPublicProfile()`

**Catatan:** Berdasarkan kode di `link-builder-editor.tsx` line 661-693, ketika user menambah link via `POST /api/links`, response langsung mengembalikan `links` yang sudah tersimpan. Ini berarti link yang ditambahkan **langsung live** di halaman Bio tanpa perlu publish terpisah.

Namun, jika user hanya mengedit link yang sudah ada (via auto-save draft di line 564-588), perubahan hanya disimpan ke `linkBuilderDraft` dan **belum** tampil di Bio sampai user klik Publish.

**Ini sudah benar** — tidak perlu perubahan logika.

---

## File yang Perlu Diubah

| # | File | Perubahan |
|---|------|-----------|
| 1 | `src/components/public/public-creator-pages.tsx` | Role + Username jadi satu baris (line 107-108) |
| 2 | `src/components/builder/link-builder-editor.tsx` | Preview section diperbarui agar konsisten dengan Bio publik (line ~1637-1685) |

---

## Catatan Teknis

1. **Import `ArrowUpRight`** sudah tidak perlu ditambahkan di `link-builder-editor.tsx` karena belum ada. Perlu ditambahkan ke import list atau gunakan icon yang sudah ada (misalnya `ExternalLink`).

2. **Tidak ada perubahan backend** yang diperlukan. Logika sinkronisasi sudah benar:
   - Tambah link baru → langsung live
   - Edit link → draft dulu, perlu publish
   - Delete link → langsung live
   - Toggle enable/disable → langsung live

3. **Preview di `DashboardLivePreviewCard`** (file terpisah di dashboard home) juga perlu diperbarui agar konsisten, tapi ini opsional karena itu hanya preview ringkas di halaman dashboard utama.

---

## Prioritas Implementasi

1. ✅ **High** — Role + Username satu baris di Bio publik
2. ✅ **High** — Preview di Build Link konsisten dengan Bio publik  
3. ⚪ **Low** — Update preview di `DashboardLivePreviewCard` (opsional)
