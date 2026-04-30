# Rencana Implementasi PRD Showreels Dashboard Redesign

## Prioritas yang Disepakati

User memilih prioritas: perbaiki dulu error syntax/build aktif pada `src/components/dashboard/dashboard-shell.tsx`, lalu lanjutkan redesign dashboard sesuai PRD.

## Konteks Teknis yang Ditemukan

- Project menggunakan Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM, Supabase, dan PostgreSQL.
- Struktur dashboard sudah tersedia di `src/app/dashboard` dengan halaman utama, link builder, videos, analytics, billing, profile, settings, dan notifications.
- Public creator page sudah tersedia di `src/app/creator/[username]/page.tsx`.
- Public portfolio sudah tersedia di `src/app/creator/[username]/portfolio/page.tsx`.
- Public video preview sudah tersedia di `src/app/v/[slug]/page.tsx`.
- Schema database sudah memiliki tabel `users`, `videos`, visitor analytics, creator settings, billing, dan notification-related tables.
- Endpoint AI bio sudah tersedia di `src/app/api/ai/generate-bio/route.ts`, tetapi saat ini masih fallback local suggestions dan belum benar-benar memanggil Gemini.
- Dev server melaporkan error syntax pada import icon di `src/components/dashboard/dashboard-shell.tsx` baris 7 berupa karakter literal `` `r`n ``. Hasil read tool saat ini terlihat clean, jadi mode implementasi perlu memvalidasi isi file aktual di editor/build cache dan melakukan rewrite targeted bila perlu.

## Rencana Eksekusi

1. Perbaiki error syntax/build aktif pada `src/components/dashboard/dashboard-shell.tsx`.
   - Buka file dan validasi blok import `lucide-react`.
   - Hapus karakter korup seperti `` `r`n `` jika masih ada.
   - Pastikan semua import icon valid dan tidak duplikatif.
   - Jalankan validasi cepat dengan lint/build atau refresh dev server.

2. Audit halaman dashboard existing.
   - Review `src/app/dashboard/page.tsx` untuk layout utama.
   - Review `src/components/dashboard/dashboard-shell.tsx` untuk chrome dashboard.
   - Review `src/app/dashboard/link-builder/page.tsx` dan `src/components/builder/link-builder-editor.tsx` untuk Bio Link.
   - Review `src/app/dashboard/videos/page.tsx` dan `src/components/dashboard/dashboard-video-list.tsx` untuk upload/manajemen video.
   - Review `src/app/dashboard/profile/page.tsx` dan `src/components/dashboard/profile-form.tsx` untuk profil creator.
   - Review public creator, portfolio, dan preview video pages.

3. Redesign dashboard shell dengan Bento UI monochromatic.
   - Terapkan visual slate/zinc/emerald.
   - Rapikan sidebar desktop, header, breadcrumb, user state, mobile nav, active states, dan spacing.
   - Pastikan layout responsive dan tidak mengganggu admin mode.

4. Redesign halaman dashboard utama.
   - Buat hero yang clean dan actionable.
   - Rapikan statistik menjadi Bento cards.
   - Tambahkan quick actions ke Build Link, Upload Video, Profile, Analytics.
   - Pertahankan komponen onboarding dan notifications bila masih relevan.
   - Tampilkan live preview/public preview card secara sederhana.

5. Redesign Bio Link builder.
   - Pertahankan draft/publish behavior yang sudah ada.
   - Rapikan editor link social/custom, thumbnail, badge/platform, enable/disable, dan order.
   - Buat live preview mobile yang konsisten dengan public Bio Link.
   - Pastikan batas entitlement tetap dihormati.

6. Tambahkan atau rapikan fitur pin maksimal 3 video ke Bio Link.
   - Cek apakah schema sudah memiliki field pinned videos. Jika belum, tambahkan migration baru.
   - Tentukan penyimpanan yang aman, misalnya array id video pada user/profile settings atau field video order/pinned flag.
   - Tambahkan API/server action untuk update pinned videos dengan validasi ownership dan maksimal 3.
   - Tambahkan UI pemilihan di Upload Video atau Bio Link builder.
   - Tampilkan pinned videos pada public creator Bio Link sebelum atau dekat portfolio preview.

7. Redesign upload dan manajemen video.
   - Pertahankan create/edit/delete existing.
   - Rapikan filter status draft/public/semi-private/private.
   - Rapikan grid/list view dan search.
   - Tambahkan CTA ke public portfolio dan Build Link pinning.
   - Pastikan state kosong jelas.

8. Redesign public pages.
   - Redesign `src/app/creator/[username]/page.tsx` sebagai Bio Link public clean sesuai referensi.
   - Redesign `src/app/creator/[username]/portfolio/page.tsx` untuk grid/list portfolio.
   - Redesign `src/app/v/[slug]/page.tsx` untuk preview video detail, author card, share QR/link.
   - Pastikan public visibility rules tetap aman.

9. Integrasikan Gemini AI secara aman.
   - Jangan hardcode API key di source code.
   - Gunakan environment variable server-side, misalnya `GEMINI_API_KEY`.
   - Update `src/app/api/ai/generate-bio/route.ts` agar memanggil Gemini jika key tersedia.
   - Pertahankan fallback local suggestions bila Gemini gagal atau key kosong.
   - Validasi payload dan rate-limit ringan bila diperlukan.

10. Review backend API sesuai PRD.
   - Audit route users/admin users, videos, payments/billing, analytics.
   - Pastikan validasi ownership dan auth aman.
   - Selaraskan response shape untuk frontend.
   - Tambahkan error handling yang konsisten.

11. QA dan validasi.
   - Jalankan lint/build.
   - Cek flow login dashboard.
   - Cek edit profile dan generate bio.
   - Cek upload/edit/delete video.
   - Cek pin video maksimal 3.
   - Cek public creator page, portfolio, video preview.
   - Cek responsive mobile dan desktop.

12. Dokumentasi.
   - Update catatan implementasi di `plans`.
   - Dokumentasikan environment variable Gemini.
   - Dokumentasikan migration/schema baru jika ada.

## Catatan Implementasi Penting

- Karena mode saat ini adalah Architect, perubahan source TypeScript/TSX sebaiknya dilakukan setelah switch ke Code mode.
- Perbaikan pertama harus fokus pada build blocker di `src/components/dashboard/dashboard-shell.tsx` agar dev server kembali stabil sebelum redesign besar.
- API key Gemini yang terlihat di screenshot user harus diperlakukan sebagai secret dan tidak ditulis ke repository.
