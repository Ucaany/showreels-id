# Cloudflare — cache & edge (showreels.id)

Ringkasan operasi untuk PRD **Ultra Fast Loading**: DNS proxied, TLS modern, kompresi, cache statis tanpa meng-cache HTML secara agresif dari salah konfigurasi.

Origin aplikasi berjalan di Vercel region `sin1` agar dekat dengan mayoritas pengguna Indonesia/SEA dan database Singapore.

## Checklist DNS & SSL

1. Domain utama mengarah ke Cloudflare (orange cloud **Proxied**).
2. Origin / backend: Vercel (hostname deployment atau custom domain yang sama sudah diverifikasi di Vercel).
3. **SSL/TLS** → mode **Full (strict)** jika origin memakai sertifikat valid (Vercel).
4. Aktifkan **TLS 1.3**, minimal TLS 1.2 untuk client lama.

## Speed & network

- **Brotli** / compression: aktifkan di Cloudflare Speed (Auto minify untuk JS/CSS/HTML hanya jika tidak bentrok dengan asset Next yang sudah dioptimalkan — biasanya aman untuk halaman statis non-Next).
- **HTTP/3 (QUIC)**: aktifkan di Network.
- **Early Hints (103)**: boleh diaktifkan; pastikan tidak bentrok dengan header `Link` dari Next/Vercel untuk resource yang sama.
- **Smart Routing / Argo**: aktifkan bila tersedia untuk mengurangi latency antar-region.
- **Always Online**: boleh aktif, tetapi jangan dipakai sebagai pengganti cache-control aplikasi.

## Cache Rules (tanpa mem-cache HTML aplikasi secara membabi buta)

Buat **rule terpisah** untuk path berikut dengan **Cache Level: Cache Everything**, **Edge TTL 1 bulan**, **Browser TTL 1 bulan**:

- `/_next/static/*`
- `/images/*`
- `/thumbnails/*`
- `/assets/*`
- `/fonts/*`
- `/*.svg`, `/*.png`, `/*.jpg`, `/*.jpeg`, `/*.webp`, `/*.avif`, `/*.ico`, `/*.mp4`, `/*.woff`, `/*.woff2`

Buat rule kedua untuk API publik yang aman di-cache dengan **Respect Origin Cache-Control**:

- `/api/link-types`
- `/api/site-status`
- `/api/public/qr*`
- `/api/public/portfolio/*`

**Jangan** pakai “Cache Everything” untuk `/`, `/dashboard/*`, `/auth/*`, `/api/auth/*`, `/api/videos/*`, `/api/profile/*`, `/api/billing/*`, atau seluruh domain tanpa exception — biarkan HTML dinamis dikontrol oleh **Vercel + `Cache-Control`** dari Next.js.

## Verifikasi cepat

1. `curl -sI https://<domain>/_next/static/<known-chunk>.js` → harus ada `cf-cache-status` dan cache hit setelah request kedua.
2. `curl -sI https://<domain>/api/public/portfolio/<username>` → harus membawa `cache-control: public, max-age=60, stale-while-revalidate=86400`.
3. `curl -sI https://<domain>/dashboard` → tidak boleh edge-cache dashboard private.
4. `curl -sI https://<domain>/` → tidak boleh edge-cache HTML lama yang salah (cek `age`, `cache-control` dari origin).

## Referensi kode origin

Header cache untuk asset statis lokal: [`next.config.ts`](../next.config.ts) (`headers()`).
