# Panduan Setup Tripay di Vercel Production

## 🔍 Diagnosis Masalah

Error **"Pembayaran belum aktif - Konfigurasi pembayaran belum lengkap"** muncul karena:

```
paymentReady = paymentConfig.serverKeySet && billingEnabled
```

**KEDUA** kondisi harus `true`:
1. `serverKeySet` → dari fungsi `isTripayConfigured()` yang mengecek env variables
2. `billingEnabled` → dari tabel `site_settings` di database (kolom `billing_enabled`)

### Kenapa `.env.production` Tidak Terbaca?

File `.vercelignore` berisi `.env*` yang berarti **semua file .env TIDAK di-upload ke Vercel**. File `.env.production` hanya sebagai referensi/dokumentasi. Anda HARUS memasukkan env variables secara manual di Vercel Dashboard.

---

## ✅ Step-by-Step Fix

### STEP 1: Set Environment Variables di Vercel Dashboard

1. Buka **Vercel Dashboard** → Project Anda → **Settings** → **Environment Variables**
2. Tambahkan variable berikut satu per satu:

| Variable | Value (Sandbox) | Value (Production) | Keterangan |
|----------|----------------|-------------------|------------|
| `TRIPAY_API_KEY` | *dari dashboard Tripay sandbox* | `bNOJ0QHR6gT6D6djl4YkBnn2zb2X4gLQOwvahRQG` | API Key dari Tripay |
| `TRIPAY_PRIVATE_KEY` | *dari dashboard Tripay sandbox* | `FLZK0-YH2Te-yOgeQ-MIQ51-dw4QA` | Private Key dari Tripay |
| `TRIPAY_MERCHANT_CODE` | *dari dashboard Tripay sandbox* | `T50076` | Merchant Code |
| `TRIPAY_IS_PRODUCTION` | `false` | `true` | Mode sandbox atau production |
| `TRIPAY_CALLBACK_SECRET` | *dari dashboard Tripay sandbox* | `FLZK0-YH2Te-yOgeQ-MIQ51-dw4QA` | Untuk verifikasi callback |

> ⚠️ **PENTING**: Jika ingin test **sandbox**, gunakan API Key SANDBOX dari dashboard Tripay (berbeda dari production key). Set `TRIPAY_IS_PRODUCTION=false`.

3. Pastikan environment scope diset ke **Production** (dan Preview jika perlu)
4. Klik **Save**

### STEP 2: Aktifkan Billing di Admin Panel

1. Login sebagai admin di website Anda
2. Buka **Admin Panel**
3. Cari setting **Billing Enabled** dan pastikan toggle-nya **ON**
4. Ini akan mengupdate kolom `billing_enabled = true` di tabel `site_settings`

### STEP 3: Set Callback URL di Dashboard Tripay

1. Login ke **dashboard Tripay** (https://tripay.co.id atau sandbox)
2. Buka **Settings** → **Callback URL**
3. Set callback URL ke:
   ```
   https://www.showreels.id/api/billing/tripay/callback
   ```
   (atau domain Vercel Anda jika berbeda)

### STEP 4: Redeploy di Vercel

Setelah menambahkan env variables, Anda **HARUS redeploy** agar perubahan terbaca:

1. Buka Vercel Dashboard → **Deployments**
2. Klik **Redeploy** pada deployment terakhir
3. Atau push commit baru ke trigger auto-deploy

### STEP 5: Verifikasi

Setelah redeploy:
1. Buka halaman pembayaran/pricing
2. Pilih paket (Creator/Business)
3. Klik **Lanjutkan pembayaran**
4. Seharusnya sudah tidak muncul error "Pembayaran belum aktif"

---

## 🧪 Cara Mendapatkan Tripay Sandbox Keys

Jika ingin test di mode sandbox:

1. Buka https://tripay.co.id/member/merchant
2. Pilih merchant Anda
3. Klik tab **API** atau **Sandbox**
4. Copy:
   - **API Key** (sandbox) → `TRIPAY_API_KEY`
   - **Private Key** (sandbox) → `TRIPAY_PRIVATE_KEY`
   - **Merchant Code** → `TRIPAY_MERCHANT_CODE`
   - **Callback Secret** → `TRIPAY_CALLBACK_SECRET` (biasanya sama dengan Private Key)
5. Set `TRIPAY_IS_PRODUCTION=false`

> Sandbox menggunakan endpoint: `https://tripay.co.id/api-sandbox`
> Production menggunakan endpoint: `https://tripay.co.id/api`

---

## 🔧 Bagaimana Kode Mengecek Konfigurasi

```typescript
// src/server/tripay.ts - isTripayConfigured()
export function isTripayConfigured(): boolean {
  const config = getTripayConfig();
  return (
    !hasPlaceholderEnvValue(config.apiKey) &&
    !hasPlaceholderEnvValue(config.privateKey) &&
    !hasPlaceholderEnvValue(config.merchantCode) &&
    config.apiKey.length > 0 &&
    config.privateKey.length > 0 &&
    config.merchantCode.length > 0
  );
}
```

Fungsi ini mengecek:
- `TRIPAY_API_KEY` tidak kosong dan bukan placeholder
- `TRIPAY_PRIVATE_KEY` tidak kosong dan bukan placeholder
- `TRIPAY_MERCHANT_CODE` tidak kosong dan bukan placeholder

Jika salah satu kosong → `isTripayConfigured()` return `false` → `paymentReady = false` → error muncul.

---

## ⚠️ Catatan Penting

1. **Jangan commit API keys ke Git** — selalu gunakan Vercel Dashboard untuk production secrets
2. **Sandbox vs Production keys berbeda** — pastikan menggunakan yang sesuai
3. **Setelah update env variables di Vercel, HARUS redeploy**
4. **billingEnabled harus ON di admin panel** — ini kondisi kedua yang harus terpenuhi
5. **TRIPAY_PRIVATE_KEY dan TRIPAY_CALLBACK_SECRET** bisa sama (tergantung konfigurasi Tripay Anda)
