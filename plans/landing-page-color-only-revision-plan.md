# Revisi Landing Page — Layout Lama, Warna Monochrome

## Arahan Final

User meminta koreksi arah implementasi:

- Jangan mengubah tampilan/layout landing page.
- Kembalikan layout landing page lama sebelum commit `f54bfda`.
- Setelah layout lama kembali, ubah hanya warna menjadi monochrome.
- Logo platform tetap memakai warna brand default.
- Icon tertentu boleh diberi warna, tetapi harus lembut dan tidak drastis.

## Prinsip Implementasi

1. **Layout harus dipulihkan dulu**
   - Ambil kembali `src/components/landing-page.tsx` dari commit sebelum `f54bfda`, yaitu parent commit `9a629df` atau `f54bfda^`.
   - Jangan mempertahankan struktur redesign baru jika berbeda dari layout lama.

2. **Perubahan hanya warna**
   - Tidak mengubah urutan section.
   - Tidak mengubah spacing, grid, ukuran card, copywriting, animasi, atau responsive behavior kecuali ada efek samping warna yang perlu diperbaiki.
   - Revisi dilakukan dengan mengganti token warna pada class Tailwind yang sudah ada.

3. **Monochrome foundation**
   - Background utama: slate/zinc/white.
   - Surface/card: white atau slate-50.
   - Border: slate-200.
   - Text utama: slate-950 atau zinc-950.
   - Text sekunder: slate-500 atau slate-600.
   - CTA utama: zinc-900/950 dengan text putih.
   - Hindari dominant blue/purple gradients.

4. **Logo platform tetap brand default**
   - YouTube tetap merah.
   - Google Drive tetap warna brand atau minimal hijau/biru/kuning sesuai icon default bila memungkinkan.
   - Instagram tetap memakai warna brand atau aksen pink/rose/purple yang lembut.
   - Vimeo tetap biru brand.
   - Facebook tetap biru brand.
   - Container icon tetap subtle: white/slate-50, border slate-200, shadow halus.

5. **Icon tertentu boleh berwarna lembut**
   - Status positif: emerald soft.
   - Warning/checking: amber soft.
   - Error/taken/invalid: rose soft.
   - Icon fitur tertentu boleh memakai warna lembut, misalnya emerald/amber/sky/rose dengan opacity rendah, bukan background mencolok.

## Todo Implementasi untuk Mode Code

- [ ] Restore `src/components/landing-page.tsx` dari `f54bfda^` atau commit `9a629df`.
- [ ] Review hasil restore untuk memastikan layout lama kembali.
- [ ] Terapkan penggantian warna saja pada `src/components/landing-page.tsx`.
- [ ] Pertahankan logo platform berwarna brand default di semua section yang menampilkan platform.
- [ ] Pastikan gradient blue/purple dominan diganti menjadi slate/zinc/white, tanpa mengubah struktur elemen.
- [ ] Pertahankan warna status soft untuk success/warning/error.
- [ ] Review shared UI component yang sudah diubah (`Button`, `Badge`, `Card`, `Input`, `Toast`) agar tidak merusak layout lama.
- [ ] Jalankan `npm run build`.
- [ ] Jika lint dijalankan, catat bahwa error `jest.config.js` bisa tetap unrelated bila masih muncul.
- [ ] Commit dengan pesan yang jelas.
- [ ] Push ke GitHub.
- [ ] Deploy ulang ke Vercel production.

## Catatan Risiko

- Restore penuh commit bisa menghapus perubahan lain jika dilakukan tidak selektif. Gunakan restore hanya untuk file landing page dulu, bukan seluruh repo.
- Shared UI components sudah menjadi monochrome dan kemungkinan tetap sesuai, tapi perlu dicek apakah layout lama bergantung pada variant/class tertentu.
- Jika layout lama memakai class warna hardcoded yang sangat banyak, lakukan penggantian warna secara surgical agar markup tetap identik.
