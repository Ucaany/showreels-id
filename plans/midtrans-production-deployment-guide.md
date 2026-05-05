# Midtrans Production Deployment Guide

## Status: Siap Deploy ke Production

### ✅ Trial Creator Logic — SUDAH BENAR

Logika trial creator sudah diimplementasikan dengan benar:

1. **Pendaftaran baru** → otomatis dapat Creator plan selama 1 bulan
   - `planName: "creator"`, `status: "trial"`, `renewalDate: +30 hari`
   - File: `src/server/billing.ts` → `getOrCreateSubscription()`

2. **Selama trial aktif** → full akses Creator (unlimited links, 50 video/platform)
   - File: `src/server/subscription-policy.ts` → `getEffectiveCreatorPlan()`

3. **Setelah 1 bulan expired** → limit turun ke Free (5 links, 10 video/platform)
   - Konten TIDAK dihapus, hanya tidak bisa menambah melebihi limit
   - Bisa hapus lalu ganti selama masih dalam limit Free
   - File: `src/server/trial-expiry-handler.ts` → cron job harian

4. **Upgrade berbayar** → user bisa upgrade kapan saja via Midtrans Snap
   - File: `src/server/billing.ts` → `createUpgradeTransaction()`

---

## 🔄 Yang Perlu Dilakukan untuk Production

### Step 1: Dapatkan Production Keys dari Midtrans

Login ke [Midtrans Dashboard](https://dashboard.midtrans.com):
1. Buka **Settings** → **Access Keys**
2. Pastikan akun sudah dalam mode **Production** (bukan Sandbox)
3. Catat:
   - **Merchant ID** (contoh: `G310407379`)
   - **Server Key** (format: `Mid-server-xxxxx`)
   - **Client Key** (format: `Mid-client-xxxxx`)

> ⚠️ Production keys TIDAK memiliki prefix `SB-`

### Step 2: Set Environment Variables di Vercel

Buka [Vercel Dashboard](https://vercel.com) → Project **showreels-id** → **Settings** → **Environment Variables**

Set variabel berikut untuk environment **Production**:

```env
MIDTRANS_MERCHANT_ID="G310407379"
MIDTRANS_SERVER_KEY="Mid-server-YOUR_PRODUCTION_SERVER_KEY"
MIDTRANS_CLIENT_KEY="Mid-client-YOUR_PRODUCTION_CLIENT_KEY"
MIDTRANS_IS_PRODUCTION="true"
```

### Step 3: Set Webhook URL di Midtrans Dashboard

Di Midtrans Dashboard → **Settings** → **Configuration**:

| Field | Value |
|-------|-------|
| Payment Notification URL | `https://showreels.id/api/billing/midtrans/webhook` |
| Finish Redirect URL | `https://showreels.id/dashboard/billing?payment=success` |
| Unfinish Redirect URL | `https://showreels.id/payment?payment=pending` |
| Error Redirect URL | `https://showreels.id/payment?payment=error` |

> Ganti `showreels.id` dengan domain production Anda yang sebenarnya.
> Jika masih pakai Vercel domain: `https://showreels-id.vercel.app`

### Step 4: Set Environment Variables Lainnya di Vercel

```env
NEXT_PUBLIC_APP_URL="https://showreels.id"
PASSWORD_RECOVERY_SECRET="GENERATE_RANDOM_64_CHAR_STRING"
CRON_SECRET="GENERATE_RANDOM_32_CHAR_STRING"
ADMIN_EMAILS="your-admin@email.com"
```

### Step 5: Verifikasi Cron Job

Pastikan `vercel.json` sudah benar (sudah ada):
```json
{
  "crons": [
    {
      "path": "/api/cron/trial-expiry",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Cron ini akan berjalan setiap hari jam 00:00 UTC (07:00 WIB) untuk downgrade trial yang expired.

---

## 📋 Production Checklist

### Environment Variables (Vercel Dashboard)

| Variable | Sandbox (Current) | Production (Target) |
|----------|-------------------|---------------------|
| `MIDTRANS_SERVER_KEY` | `SB-Mid-server-DrqIM_tedvj-XWZpdqPopdFR` | `Mid-server-YOUR_KEY` |
| `MIDTRANS_CLIENT_KEY` | `SB-Mid-client-hUD_ga875xhI-v7L` | `Mid-client-YOUR_KEY` |
| `MIDTRANS_IS_PRODUCTION` | `"false"` | `"true"` |
| `MIDTRANS_MERCHANT_ID` | `G310407379` | Same or new merchant ID |
| `NEXT_PUBLIC_APP_URL` | `https://showreels-id.netlify.app` | `https://showreels.id` |
| `PASSWORD_RECOVERY_SECRET` | (empty) | Random 64-char string |
| `CRON_SECRET` | `your-random-secret-key-here` | Random 32-char string |

### Midtrans Dashboard Configuration

- [ ] Akun Midtrans sudah diaktivasi untuk Production
- [ ] Payment Notification URL sudah diset ke `https://YOUR_DOMAIN/api/billing/midtrans/webhook`
- [ ] Snap Preferences sudah dikonfigurasi (payment methods yang diaktifkan)
- [ ] Test transaksi production pertama berhasil

### Code — Tidak Ada Perubahan Diperlukan

Kode sudah mendukung production secara otomatis:
- `getMidtransRuntimeConfig()` membaca `MIDTRANS_IS_PRODUCTION` env var
- Jika `"true"` → menggunakan `https://api.midtrans.com` dan `https://app.midtrans.com`
- Jika `"false"` → menggunakan `https://api.sandbox.midtrans.com` dan `https://app.sandbox.midtrans.com`
- Webhook signature verification menggunakan server key yang sama

### Security Checklist

- [ ] `PASSWORD_RECOVERY_SECRET` diisi dengan random string yang kuat
- [ ] `CRON_SECRET` diisi dengan random string yang kuat
- [ ] File `.env.local`, `.env.production.local` TIDAK di-commit ke Git
- [ ] `netlify.env` TIDAK di-commit ke Git (berisi credentials)
- [ ] Midtrans Server Key HANYA ada di server-side env (bukan `NEXT_PUBLIC_`)

---

## 🔑 Cara Generate Random Secrets

```bash
# Untuk PASSWORD_RECOVERY_SECRET (64 chars)
openssl rand -base64 48

# Untuk CRON_SECRET (32 chars)
openssl rand -base64 24
```

Atau gunakan: https://generate-secret.vercel.app/64

---

## 🧪 Testing Sebelum Go-Live

1. **Deploy ke Vercel** dengan production env vars
2. **Buat akun baru** → verifikasi dapat trial Creator 1 bulan
3. **Coba upgrade** → verifikasi redirect ke Midtrans Snap (production)
4. **Bayar dengan kartu asli** (nominal kecil) → verifikasi webhook diterima
5. **Cek dashboard billing** → status berubah ke "active"
6. **Trigger cron manual** → `GET /api/cron/trial-expiry?secret=YOUR_CRON_SECRET`

---

## 📝 Catatan Penting

1. **Tidak perlu mengubah kode apapun** — cukup ganti environment variables
2. **Midtrans Snap** otomatis switch antara sandbox/production berdasarkan `MIDTRANS_IS_PRODUCTION`
3. **Webhook URL** harus bisa diakses publik (bukan localhost)
4. **Trial logic** sudah berjalan otomatis via Vercel Cron
5. **Harga plan**: Creator Rp25.000/bulan, Business Rp49.000/bulan (sudah hardcoded di `PLAN_CATALOG`)
