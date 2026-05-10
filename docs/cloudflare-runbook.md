# Cloudflare — cache & edge (showreels.id)

Ringkasan operasi untuk PRD **Ultra Fast Loading**: DNS proxied, TLS modern, kompresi, cache statis tanpa meng-cache HTML secara agresif dari salah konfigurasi.

## Checklist DNS & SSL

1. Domain utama mengarah ke Cloudflare (orange cloud **Proxied**).
2. Origin / backend: Vercel (hostname deployment atau custom domain yang sama sudah diverifikasi di Vercel).
3. **SSL/TLS** → mode **Full (strict)** jika origin memakai sertifikat valid (Vercel).
4. Aktifkan **TLS 1.3**, minimal TLS 1.2 untuk client lama.

## Speed & network

- **Brotli** / compression: aktifkan di Cloudflare Speed (Auto minify untuk JS/CSS/HTML hanya jika tidak bentrok dengan asset Next yang sudah dioptimalkan — biasanya aman untuk halaman statis non-Next).
- **HTTP/3 (QUIC)**: aktifkan di Network.
- **Early Hints (103)**: boleh diaktifkan; pastikan tidak bentrok dengan header `Link` dari Next/Vercel untuk resource yang sama.

## Cache Rules (tanpa mem-cache HTML aplikasi secara membabi buta)

Buat **rule terpisah** untuk path berikut dengan **Cache Level: Cache Everything**, **Edge TTL 1 bulan**, **Browser TTL 1 bulan**:

- `/_next/static/*`
- `/images/*`
- `/thumbnails/*`
- `/assets/*`
- `/fonts/*`

**Jangan** pakai “Cache Everything” untuk `/` atau seluruh domain tanpa exception — biarkan HTML dinamis dikontrol oleh **Vercel + `Cache-Control`** dari Next.js.

## Verifikasi cepat

1. `curl -sI https://<domain>/_next/static/<known-chunk>.js` → harus ada `cf-cache-status` dan cache hit setelah request kedua.
2. `curl -sI https://<domain>/` → tidak boleh edge-cache HTML lama yang salah (cek `age`, `cache-control` dari origin).

## Referensi kode origin

Header cache untuk asset statis lokal: [`next.config.ts`](../next.config.ts) (`headers()`).
