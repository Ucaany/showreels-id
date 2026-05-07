# Vercel Environment Variables - Tripay Sandbox

## ⚠️ PENTING: Masalah Callback URL

Di dashboard Tripay Anda, URL Callback diset ke:
```
https://showreels.id/api/billing/tripay/callback
```

Ini **SUDAH BENAR** dan cocok dengan route di kode: `src/app/api/billing/tripay/callback/route.ts`

---

## 📋 Variables yang Harus Diset di Vercel Dashboard

Buka: **Vercel Dashboard** → Project → **Settings** → **Environment Variables**

Copy-paste satu per satu:

### Tripay Payment Gateway (Sandbox Mode)

| Key | Value |
|-----|-------|
| `TRIPAY_API_KEY` | `DEV-nvu18SQM4yz6f3g5TmZmUWM7LqBTzxR1mf6JhmrV` |
| `TRIPAY_PRIVATE_KEY` | `5bI6g-sSsrJ-Xn5qZ-ZM2nB-w4hDb` |
| `TRIPAY_MERCHANT_CODE` | `T30523` |
| `TRIPAY_IS_PRODUCTION` | `false` |
| `TRIPAY_CALLBACK_SECRET` | `5bI6g-sSsrJ-Xn5qZ-ZM2nB-w4hDb` |

### App Config (pastikan sudah ada)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_APP_URL` | `https://showreels.id` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

---

## 📝 Format untuk Bulk Import di Vercel

Jika Vercel mendukung paste bulk, copy text di bawah ini:

```env
TRIPAY_API_KEY=DEV-nvu18SQM4yz6f3g5TmZmUWM7LqBTzxR1mf6JhmrV
TRIPAY_PRIVATE_KEY=5bI6g-sSsrJ-Xn5qZ-ZM2nB-w4hDb
TRIPAY_MERCHANT_CODE=T30523
TRIPAY_IS_PRODUCTION=false
TRIPAY_CALLBACK_SECRET=5bI6g-sSsrJ-Xn5qZ-ZM2nB-w4hDb
```

---

## ✅ Checklist Setelah Set Env Variables

1. [x] Set semua 5 Tripay env variables di Vercel
2. [ ] Pastikan **billingEnabled = ON** di Admin Panel website
3. [ ] **Redeploy** project di Vercel (wajib setelah update env)
4. [ ] Test pembayaran lagi — error "Pembayaran belum aktif" seharusnya hilang

---

## ⚠️ Catatan Sandbox

- Karena ini **sandbox mode** (`TRIPAY_IS_PRODUCTION=false`), aplikasi akan menggunakan endpoint `https://tripay.co.id/api-sandbox`
- Pembayaran sandbox tidak memproses uang sungguhan
- Untuk pindah ke production nanti, ganti dengan production keys dan set `TRIPAY_IS_PRODUCTION=true`
