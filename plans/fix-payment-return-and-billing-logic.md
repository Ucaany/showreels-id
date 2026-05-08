# Fix Payment Return & Billing Logic Plan

## Problem Summary

Setelah user selesai membayar di Tripay, user diarahkan kembali ke merchant (return_url) tetapi mendapat error **404 DEPLOYMENT_NOT_FOUND**. Ini terjadi karena `return_url` yang dikirim ke Tripay menggunakan URL deployment Vercel yang bersifat sementara (bukan production URL yang stabil).

### Screenshot Error
- URL: `https://showreels-id.vercel.app/dashboard/billing?payment=success&tripay_reference=DEV-T3052367302FMVX5&tripay_merchant_ref...`
- Error: 404 NOT_FOUND, Code: DEPLOYMENT_NOT_FOUND

---

## Root Cause Analysis

### 1. Return URL Menggunakan Deployment URL (Bukan Production URL)

Di `src/server/billing.ts` line 507:
```typescript
returnUrl: `${getAppOrigin()}/dashboard/billing?payment=success`
```

Fungsi `getAppOrigin()` (line 118-141) memiliki fallback chain:
1. `NEXT_PUBLIC_APP_URL` → biasanya kosong
2. `VERCEL_PROJECT_PRODUCTION_URL` → bisa berisi URL production
3. `VERCEL_URL` → **ini masalahnya** - berisi URL deployment spesifik yang bisa expired
4. Hardcoded fallback: `https://showreels-id.vercel.app`

Saat build di Vercel, `VERCEL_URL` bisa berisi URL seperti `showreels-id-main-abc123.vercel.app` yang hanya valid untuk deployment tersebut. Ketika ada deployment baru, URL lama menjadi 404.

### 2. Logika Plan Update Sudah Benar (via Callback)

Callback Tripay di `/api/billing/tripay/callback` sudah handle:
- Update transaction status
- Update subscription plan jika status = paid
- Revert subscription jika expired/failed

### 3. Billing Panel Sudah Handle `payment=success`

Di `billing-panel.tsx` line 208-220, sudah ada useEffect yang mendeteksi `?payment=success` dan menampilkan alert sukses + refresh data.

---

## Solution Architecture

```mermaid
flowchart TD
    A[User klik Bayar] --> B[POST /api/billing/checkout]
    B --> C[Tripay create transaction]
    C --> D[User diarahkan ke Tripay checkout_url]
    D --> E{User selesai bayar?}
    E -->|Bayar sukses| F[Tripay POST callback ke /api/billing/tripay/callback]
    E -->|Bayar sukses| G[Tripay redirect user ke return_url FIXED]
    E -->|Batal/timeout| H[User kembali ke return_url dengan status cancel]
    F --> I[Update transaction + subscription di DB]
    G --> J[/dashboard/billing?payment=success&tripay_reference=xxx]
    J --> K[Billing page detect payment=success]
    K --> L[Refresh data + tampilkan notifikasi sukses]
    L --> M[Redirect ke /dashboard dengan toast]
    H --> N[/dashboard/billing?payment=cancel&tripay_reference=xxx]
    N --> O[Tampilkan opsi bayar ulang jika belum expired]
```

---

## Implementation Steps

### Step 1: Fix `getAppOrigin()` di `src/server/billing.ts`

**Problem:** Fungsi ini bisa return deployment-specific URL.

**Fix:** Pastikan selalu menggunakan production URL yang stabil. Prioritaskan `NEXT_PUBLIC_APP_URL` atau hardcoded production domain.

```typescript
function getAppOrigin() {
  // 1. Explicit app URL (recommended for production)
  const explicitOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (explicitOrigin) return explicitOrigin;

  // 2. Vercel production URL (stable across deployments)
  const projectProductionOrigin = normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined
  );
  if (projectProductionOrigin) return projectProductionOrigin;

  // 3. JANGAN gunakan VERCEL_URL karena bersifat per-deployment
  // Langsung fallback ke hardcoded production URL
  return "https://showreels-id.vercel.app";
}
```

**Tambahan:** Set environment variable `NEXT_PUBLIC_APP_URL=https://showreels-id.vercel.app` di Vercel dashboard.

---

### Step 2: Handle Return Params dari Tripay di Billing Page

**File:** `src/app/dashboard/billing/page.tsx`

Tripay menambahkan query params saat redirect kembali:
- `tripay_reference` - reference ID dari Tripay
- `tripay_merchant_ref` - merchant reference (invoice ID kita)
- `payment` - status (success/cancel/failed)

Update `searchParams` type dan logika:

```typescript
type DashboardBillingPageProps = {
  searchParams?: Promise<{
    invoice?: string;
    payment?: string;
    plan?: string;
    tripay_reference?: string;
    tripay_merchant_ref?: string;
  }>;
};
```

Jika ada `tripay_merchant_ref`, gunakan sebagai `invoiceId` untuk refresh status transaksi.

---

### Step 3: Perbaiki Logika Update Plan Setelah Pembayaran

**File:** `src/app/api/billing/tripay/callback/route.ts`

Logika callback sudah benar, tapi perlu dipastikan:
1. Saat status = PAID → subscription.planName diupdate ke plan yang dibayar
2. Saat status = PAID → subscription.status = active
3. Saat status = PAID → renewalDate dihitung +1 bulan dari sekarang

**Verifikasi:** Logika di line 114-136 sudah benar. Tidak perlu perubahan.

---

### Step 4: Logika Bayar Ulang (Retry Payment)

**Skenario:** User membatalkan pembayaran tapi waktu expired belum habis → bisa bayar ulang.

**File:** `src/components/dashboard/billing-panel.tsx`

Tambahkan:
1. Deteksi transaksi pending yang belum expired
2. Tampilkan tombol "Bayar Sekarang" yang mengarahkan ke `checkout_url` Tripay
3. Jika sudah expired, tampilkan tombol "Buat Transaksi Baru"

```typescript
// Di billing-panel, cek transaksi pending terakhir
const pendingTransaction = transactions.find(
  tx => tx.status === "pending" && tx.expiredAt && new Date(tx.expiredAt) > new Date()
);
```

**File baru/update:** Tambahkan field `checkoutUrl` dan `expiredAt` ke `TransactionPayload` type.

---

### Step 5: Redirect ke Dashboard Setelah Pembayaran Sukses

**File:** `src/components/dashboard/billing-panel.tsx`

Update useEffect untuk `payment=success`:
1. Tampilkan alert sukses
2. Refresh data billing
3. Setelah alert ditutup, redirect ke `/dashboard`

```typescript
useEffect(() => {
  if (searchParams.get("payment") !== "success") return;
  void showFeedbackAlert({
    title: "Terima kasih sudah berlangganan",
    text: "Paket kamu sudah aktif. Sekarang kamu bisa menggunakan fitur sesuai paket.",
    icon: "success",
    confirmButtonText: "Masuk Dashboard",
  }).then(() => {
    router.replace("/dashboard");
  });
  void handleRefresh();
}, [searchParams]);
```

Juga handle `payment=cancel`:
```typescript
useEffect(() => {
  if (searchParams.get("payment") === "cancel") {
    void showFeedbackAlert({
      title: "Pembayaran dibatalkan",
      text: "Kamu masih bisa melanjutkan pembayaran selama waktu belum habis.",
      icon: "info",
    });
  }
}, [searchParams]);
```

---

### Step 6: Notifikasi Sisa Hari di Halaman Billing

**File:** `src/components/dashboard/billing-panel.tsx`

Sudah ada `remainingDays` dan ditampilkan. Perlu ditambahkan:
1. Warning banner jika sisa hari < 7
2. Urgent banner jika sisa hari < 3
3. Info banner jika status = pending (menunggu pembayaran)

```typescript
{remainingDays > 0 && remainingDays <= 7 && (
  <Card className="border-amber-200 bg-amber-50 p-4">
    <p className="text-sm font-semibold text-amber-900">
      ⚠️ Masa aktif tinggal {remainingDays} hari lagi
    </p>
    <p className="mt-1 text-sm text-amber-700">
      Perpanjang sekarang agar fitur tidak terkunci.
    </p>
  </Card>
)}
```

---

### Step 7: Informasi Billing Lebih Lengkap

**File:** `src/components/dashboard/billing-panel.tsx`

Tambahkan section untuk:
1. Transaksi pending dengan link bayar ulang
2. Countdown waktu expired untuk transaksi pending
3. Status pembayaran real-time

---

## Files to Modify

| File | Perubahan |
|------|-----------|
| `src/server/billing.ts` | Fix `getAppOrigin()` - hapus fallback ke `VERCEL_URL` |
| `src/app/dashboard/billing/page.tsx` | Handle `tripay_reference` dan `tripay_merchant_ref` params, refresh status |
| `src/components/dashboard/billing-panel.tsx` | Handle payment=cancel, retry payment, notifikasi sisa hari, redirect ke dashboard |
| `src/app/api/billing/transactions/route.ts` | Tambahkan field `checkoutUrl` dan `expiredAt` di response |
| `src/server/billing.ts` | Update `getBillingTransactions` untuk include `checkoutUrl` dan `expiredAt` |

## Environment Variables to Set (Vercel Dashboard)

```
NEXT_PUBLIC_APP_URL=https://showreels-id.vercel.app
```

---

## Testing Checklist

- [ ] Setelah bayar sukses di Tripay → redirect ke `/dashboard/billing?payment=success` tanpa 404
- [ ] Alert sukses muncul → user diarahkan ke dashboard
- [ ] Plan berubah sesuai yang dibayar (dari free/trial ke creator/business)
- [ ] Jika user batal bayar → bisa klik "Bayar Sekarang" selama belum expired
- [ ] Jika transaksi expired → tombol berubah jadi "Buat Transaksi Baru"
- [ ] Notifikasi sisa hari muncul di billing page
- [ ] Callback Tripay berhasil update subscription di database
