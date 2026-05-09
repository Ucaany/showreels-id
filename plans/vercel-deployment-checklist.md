# Vercel Environment Variables Setup

## 📋 Langkah-langkah Setup di Vercel Dashboard

### 1. Buka Vercel Dashboard
Kunjungi: https://vercel.com/ucaany/showreels-id/settings/environment-variables

### 2. Tambahkan Environment Variables Berikut

#### Google OAuth (WAJIB untuk login Google)
```
GOOGLE_CLIENT_ID
Value: [Copy dari Google Cloud Console]
Environment: Production, Preview, Development

GOOGLE_CLIENT_SECRET
Value: [Copy dari Google Cloud Console]
Environment: Production, Preview, Development

NEXT_PUBLIC_GOOGLE_AUTH_ENABLED
Value: true
Environment: Production, Preview, Development
```

#### Auth.js (sudah ada, pastikan value benar)
```
AUTH_SECRET
Value: k8m2p5r9v3x7z1a4d6g0j8n2q5t9w3y7
Environment: Production, Preview, Development

AUTH_URL
Value: https://showreels.id
Environment: Production

NEXTAUTH_URL
Value: https://showreels.id
Environment: Production
```

### 3. Redeploy Aplikasi
Setelah menambahkan environment variables:
1. Klik tab "Deployments"
2. Klik "..." pada deployment terakhir
3. Klik "Redeploy"
4. Atau push commit baru ke GitHub (auto-deploy)

### 4. Verifikasi
1. Buka https://showreels.id/auth/login
2. Pastikan tombol "Masuk dengan Google" muncul
3. Test login dengan Google
4. Pastikan redirect ke dashboard berhasil

---

## 🔧 Cara Deploy via CLI

### Opsi 1: Auto Deploy (Recommended)
```bash
# Push ke GitHub, Vercel akan auto-deploy
git push origin main
```

### Opsi 2: Manual Deploy via Vercel CLI
```bash
# Install Vercel CLI (jika belum)
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy ke production
vercel --prod
```

---

## ✅ Checklist Deployment

### Pre-deployment
- [ ] Google OAuth credentials sudah dibuat di Google Cloud Console
- [ ] Redirect URI `https://showreels.id/api/auth/callback/google` sudah terdaftar
- [ ] Environment variables sudah ditambahkan di Vercel Dashboard
- [ ] Build local berhasil (`npm run build`)
- [ ] Code sudah di-push ke GitHub

### Post-deployment
- [ ] Deployment berhasil di Vercel
- [ ] Halaman `/auth/login` dapat diakses
- [ ] Tombol "Masuk dengan Google" muncul
- [ ] Login dengan Google berhasil
- [ ] Redirect ke dashboard berhasil
- [ ] Halaman `/email` dapat diakses
- [ ] Form email berfungsi dengan baik

---

## 🐛 Troubleshooting

### Deployment Failed
1. Cek build logs di Vercel Dashboard
2. Pastikan semua dependencies terinstall
3. Pastikan tidak ada TypeScript errors
4. Cek environment variables sudah lengkap

### Google Login Tidak Muncul
1. Cek `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"` di Vercel
2. Redeploy setelah menambahkan environment variable
3. Clear cache browser dan reload

### Google Login Error
1. Cek `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di Vercel
2. Pastikan redirect URI sudah benar di Google Cloud Console
3. Cek logs di Vercel untuk error details

---

## 📝 Environment Variables Summary

### Required for Google OAuth
- `GOOGLE_CLIENT_ID` ✅
- `GOOGLE_CLIENT_SECRET` ✅
- `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` ✅
- `AUTH_SECRET` ✅
- `AUTH_URL` ✅
- `NEXTAUTH_URL` ✅

### Already Configured (dari deployment sebelumnya)
- `DATABASE_URL` ✅
- `RESEND_API_KEY` ✅
- `CRON_SECRET` ✅
- `TRIPAY_*` (optional) ✅
- `NEXT_PUBLIC_APP_URL` ✅
- `NEXT_PUBLIC_DEMO_MODE` ✅
