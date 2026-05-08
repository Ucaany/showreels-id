# PRD: Full-Stack Audit, Database Optimization & Instant Loading
**Project Name:** showreels.id
**Environment:** Next.js, Supabase, Vercel
**Document Purpose:** Panduan komprehensif untuk mengevaluasi kode, menghemat penggunaan database (read/write), serta menerapkan teknik *instant loading* di seluruh halaman aplikasi.

---

## 1. Objektif Utama (Core Objectives)
1. **Database Cost & Resource Saving:** Mengurangi beban query ke database secara drastis untuk menghemat *bandwidth* dan kuota baca/tulis Supabase.
2. **Instant Page Loading:** Memastikan transisi antar halaman terasa instan (0 delay) menggunakan teknik caching, prefetching, dan streaming UI.
3. **Bug & Error Eradication:** Menemukan dan memperbaiki syntax error, runtime error, dan logical bugs.
4. **Aggressive Cleanup:** Menghapus *dead code*, *unused imports*, elemen UI tidak terpakai, dan class CSS yang membebani *bundle size*.

---

## 2. Frontend Audit & Instant Loading (UI/UX & Performance)

### 2.1. Instant Loading Implementation (Next.js)
* **Link Prefetching:** Pastikan komponen `<Link>` bawaan Next.js menggunakan *prefetching* untuk rute-rute utama sehingga halaman sudah dimuat di *background* sebelum user mengklik.
* **React Suspense & Streaming UI:** Bungkus komponen yang mengambil data berat dengan `<Suspense fallback={<Skeleton />}>` agar layout utama (Header/Sidebar) langsung muncul tanpa menunggu data backend selesai dimuat.
* **Optimasi Aset Berat (Video & Image):** 
  * Pastikan video showreel menggunakan *thumbnail* terlebih dahulu (*lazy load video*). Jangan muat *iframe* atau file video `.mp4` sampai elemen tersebut masuk ke dalam *viewport*.
  * Gunakan `next/image` dengan format WebP/AVIF dan tentukan atribut `sizes` untuk mencegah pemuatan gambar beresolusi raksasa di layar mobile.

### 2.2. Styling & Responsiveness Check
* **Class Mismatch & Inconsistency:** Cari class Tailwind yang saling tumpang tindih (misal: `flex block` atau `p-4 p-2`).
* **Responsive Breakpoints:** Bersihkan elemen yang memiliki *fixed width/height* (seperti `w-[500px]`) yang merusak tampilan di layar kecil (`sm:`, `md:`).

### 2.3. Aggressive Code Cleanup
* **Dead Code:** Hapus fungsi, komponen, variabel, dan `import` yang sudah tidak digunakan.
* **Console & Comments:** Bersihkan `console.log()` dan blok kode yang di-comment (*commented-out code*).

---

## 3. Backend, API & Database Optimization (Penghematan Database)

### 3.1. Penghematan & Optimasi Database (Supabase)
* **Penerapan Caching (Next.js Data Cache):** Jangan lakukan request langsung ke Supabase untuk data yang jarang berubah (misal: daftar kategori, profil publik). Gunakan `fetch` dengan opsi `next: { revalidate: 3600 }` (ISR) agar data diambil dari *cache* Vercel, bukan dari database.
* **Pagination & Limit:** DILARANG KERAS memanggil semua data sekaligus. Selalu gunakan `.limit()` dan terapkan *pagination* atau *infinite scroll* untuk menghemat *rows read* Supabase.
* **Spesifik Select (No `select(*)`):** Ubah semua query `supabase.from('table').select('*')` menjadi spesifik, contoh: `.select('id, title, thumbnail_url')`. Jangan tarik kolom deskripsi panjang jika hanya untuk ditampilkan di *card grid*.
* **Penghapusan Data Yatim (Orphaned Data):** Identifikasi logika yang berpotensi menyisakan data sampah (misal: gambar di *storage* yang baris datanya di database sudah dihapus).

### 3.2. Server-Side Logic & Error Handling
* **API Route Protection:** Pastikan API route hanya merespons HTTP Method yang diizinkan dan memiliki validasi payload.
* **Try-Catch Block:** Pastikan semua eksekusi backend dibungkus `try-catch` dan me-return struktur JSON standar: `{ success: false, message: "Error detail" }`.

---

## 4. Instruksi AI (Refactoring Rules)
*Gunakan instruksi ini saat memasukkan file kode ke AI untuk diperbaiki:*

1. **Prioritas Kecepatan & Penghematan:** Fokus ubah cara komponen memanggil data agar lebih ramah database (tambahkan *cache/limit*) dan tambahkan *Skeleton/Suspense* untuk efek instan.
2. **JANGAN merusak business logic utama:** Pastikan fitur utama tetap berjalan.
3. **Berikan Refactored Code secara Penuh:** Jangan berikan potongan-potongan. Berikan kode utuh yang siap di-copy-paste.
4. **Sertakan Changelog Singkat:** Sebutkan baris atau fungsi apa saja yang dioptimasi untuk menghemat database dan mempercepat loading.

---

## 5. Template Eksekusi (Prompt Vibe Coding V3)
*Copy dan paste prompt di bawah ini bersama dengan kode file yang ingin kamu periksa:*

> **Prompt:**
> "Tolong audit, optimasi, dan bersihkan kode [Frontend/Backend] ini berdasarkan PRD showreels.id terbaru. 
> 1. **Instant Loading:** Terapkan Suspense, perbaiki cara pemuatan aset (lazy load video/gambar), dan pastikan prefetching aktif.
> 2. **Hemat Database:** Ubah query agar menggunakan *select* spesifik, terapkan *limit/pagination*, dan gunakan *caching* (revalidate) jika memungkinkan agar tidak boros read Supabase.
> 3. **Cleanup & Fix:** Hapus *dead code*, perbaiki bug/logic error, dan bersihkan class Tailwind yang tumpang tindih.
> 4. **Responsif:** Pastikan kode UI 100% responsif di mobile.
> 
> Berikan KODE UTUH hasil refactoring dan tuliskan rangkuman (changelog) apa saja penghematan database dan optimasi loading yang telah kamu lakukan."
