# Google OAuth Setup Guide

## 🔐 Konfigurasi Google Cloud Console

### 1. Buka Google Cloud Console
Kunjungi: https://console.cloud.google.com/apis/credentials

### 2. Pilih atau Buat Project
- Pilih project yang sudah ada atau buat project baru
- Nama project: `Showreels.id` (atau sesuai preferensi)

### 3. Buat OAuth 2.0 Client ID

#### a. Konfigurasi OAuth Consent Screen (jika belum)
1. Klik "OAuth consent screen" di sidebar
2. Pilih "External" (untuk testing) atau "Internal" (untuk organisasi)
3. Isi informasi aplikasi:
   - **App name**: Showreels.id
   - **User support email**: admin@showreels.id
   - **Developer contact email**: admin@showreels.id
4. Klik "Save and Continue"
5. Tambah scopes (optional untuk basic login):
   - `userinfo.email`
   - `userinfo.profile`
6. Klik "Save and Continue"
7. Tambah test users jika mode "External" (optional)
8. Klik "Save and Continue"

#### b. Buat Credentials
1. Klik "Credentials" di sidebar
2. Klik "+ CREATE CREDENTIALS"
3. Pilih "OAuth client ID"
4. Application type: **Web application**
5. Name: `Showreels.id Web Client`

#### c. Konfigurasi Authorized Origins & Redirect URIs

**Authorized JavaScript origins:**
```
https://showreels.id
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://showreels.id/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

6. Klik "CREATE"
7. Copy **Client ID** dan **Client Secret**

### 4. Update Environment Variables

#### Local Development (`.env.local`)
```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"
```

#### Vercel Production
Tambahkan di Vercel Dashboard → Settings → Environment Variables:

1. `GOOGLE_CLIENT_ID`
   - Value: Copy dari Google Cloud Console
   - Environment: Production, Preview, Development

2. `GOOGLE_CLIENT_SECRET`
   - Value: Copy dari Google Cloud Console
   - Environment: Production, Preview, Development

3. `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`
   - Value: `true`
   - Environment: Production, Preview, Development

### 5. Verifikasi Konfigurasi

#### Cek di Google Cloud Console
1. Buka https://console.cloud.google.com/apis/credentials
2. Pastikan OAuth 2.0 Client ID sudah dibuat
3. Pastikan Authorized redirect URIs sudah benar:
   - ✅ `https://showreels.id/api/auth/callback/google`
   - ✅ `http://localhost:3000/api/auth/callback/google`

#### Test Login Flow
1. Buka https://showreels.id/auth/login
2. Klik tombol "Masuk dengan Google"
3. Pilih akun Google
4. Authorize aplikasi
5. Redirect ke dashboard

---

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"
**Penyebab**: Redirect URI tidak cocok dengan yang dikonfigurasi di Google Cloud Console

**Solusi**:
1. Buka Google Cloud Console
2. Edit OAuth 2.0 Client ID
3. Pastikan redirect URI **PERSIS** sama:
   ```
   https://showreels.id/api/auth/callback/google
   ```
4. Tidak boleh ada trailing slash `/`
5. Harus menggunakan `https://` untuk production

### Error: "invalid_client"
**Penyebab**: Client ID atau Client Secret salah

**Solusi**:
1. Verifikasi credentials di Google Cloud Console
2. Copy ulang Client ID dan Client Secret
3. Update environment variables di Vercel
4. Redeploy aplikasi

### Error: "access_denied"
**Penyebab**: User menolak authorization atau OAuth consent screen belum dikonfigurasi

**Solusi**:
1. Pastikan OAuth consent screen sudah dikonfigurasi
2. Jika mode "External", pastikan user sudah ditambahkan sebagai test user
3. Atau ubah ke mode "Internal" jika untuk organisasi

### Tombol Google Login Tidak Muncul
**Penyebab**: Environment variable `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` tidak diset

**Solusi**:
1. Tambahkan di `.env.local`:
   ```bash
   NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"
   ```
2. Tambahkan di Vercel environment variables
3. Restart development server atau redeploy

---

## 📝 Checklist Deployment

### Local Development
- [ ] `GOOGLE_CLIENT_ID` terisi di `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` terisi di `.env.local`
- [ ] `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"` di `.env.local`
- [ ] Redirect URI `http://localhost:3000/api/auth/callback/google` terdaftar di Google Cloud Console
- [ ] Test login dengan Google berhasil

### Vercel Production
- [ ] `GOOGLE_CLIENT_ID` ditambahkan di Vercel environment variables
- [ ] `GOOGLE_CLIENT_SECRET` ditambahkan di Vercel environment variables
- [ ] `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"` ditambahkan di Vercel environment variables
- [ ] Redirect URI `https://showreels.id/api/auth/callback/google` terdaftar di Google Cloud Console
- [ ] Deploy ke Vercel
- [ ] Test login dengan Google di production

---

## 🔗 Resources

- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
