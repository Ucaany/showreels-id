# Fix Google OAuth Error & Email Landing Page

## 🔧 Perbaikan Error Google OAuth

### Masalah
Error "Missing required parameter: client_id" muncul saat login dengan Google karena:
1. Google OAuth provider selalu diinisialisasi meskipun credentials tidak lengkap
2. Tidak ada validasi environment variables sebelum mengaktifkan provider

### Solusi

#### 1. Conditional Provider Registration ([`src/auth.ts`](src/auth.ts:26))
```typescript
providers: [
  // Google OAuth provider - only enable if credentials are configured
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code",
            },
          },
        }),
      ]
    : []),
  // ... Credentials provider
]
```

**Penjelasan:**
- Google provider hanya didaftarkan jika `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` tersedia
- Menggunakan spread operator untuk conditional array inclusion
- Menambahkan authorization params untuk OAuth flow yang lebih robust

#### 2. Update Auth Config Helper ([`src/lib/auth-config.ts`](src/lib/auth-config.ts:12))
```typescript
export function isGoogleAuthEnabled() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}
```

#### 3. Conditional UI Rendering ([`src/components/auth/login-form.tsx`](src/components/auth/login-form.tsx:268))
```typescript
{!DEMO_MODE && process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && (
  <button
    type="button"
    onClick={async () => {
      try {
        await signIn("google", { 
          callbackUrl: safeNextPath,
          redirect: true,
        });
      } catch (error) {
        void showFeedbackAlert({
          title: "Login Google gagal",
          text: "Terjadi kesalahan saat login dengan Google...",
          icon: "error",
        });
      }
    }}
    // ... button content
  </button>
)}
```

**Penjelasan:**
- Tombol Google login hanya muncul jika `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"`
- Error handling untuk menangkap kegagalan OAuth
- User-friendly error message

#### 4. Environment Variable ([`.env.local`](.env.local:10))
```bash
# Google Auth Status (set to "true" to enable Google login button)
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"

# Google OAuth (untuk login via Google)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Cara Menggunakan

#### Untuk Mengaktifkan Google OAuth:
1. Pastikan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` terisi di `.env.local`
2. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"`
3. Restart development server

#### Untuk Menonaktifkan Google OAuth:
1. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="false"` atau hapus variable
2. Tombol "Masuk dengan Google" akan hilang dari UI
3. Hanya login dengan email/password yang tersedia

---

## 📧 Email Landing Page

### Fitur Baru
Halaman email landing page dengan desain modern seperti referensi yang diberikan.

### File yang Dibuat

#### 1. Page Component ([`src/app/email/page.tsx`](src/app/email/page.tsx))
```typescript
import { Metadata } from "next";
import { EmailLandingPage } from "@/components/email/email-landing-page";

export const metadata: Metadata = {
  title: "Email Support - Showreels.id",
  description: "Tim HR experts kami siap membantu Anda menemukan talenta terbaik",
};

export default function EmailPage() {
  return <EmailLandingPage />;
}
```

#### 2. Landing Page Component ([`src/components/email/email-landing-page.tsx`](src/components/email/email-landing-page.tsx))

**Fitur:**
- ✅ Header dengan gradient background dan animasi mailbox icons
- ✅ Daftar layanan dengan checkmark icons
- ✅ Form kontak terintegrasi dengan email service
- ✅ Animasi smooth dengan Framer Motion
- ✅ Responsive design
- ✅ Error handling dan feedback alerts

**Komponen Utama:**
1. **Header Section**: Gradient background dengan animated mailbox icons
2. **Features Section**: Daftar layanan yang ditawarkan
3. **Benefits Section**: Keunggulan bekerja dengan tim
4. **Contact Form**: Form untuk mengirim permintaan

### Cara Mengakses
Buka browser dan navigasi ke: `http://localhost:3000/email`

### Integrasi Email
Form terintegrasi dengan endpoint [`/api/admin/email`](src/app/api/admin/email/route.ts) yang menggunakan Resend untuk mengirim email.

**Flow:**
1. User mengisi form (nama, email, pesan)
2. Submit form → POST ke `/api/admin/email`
3. Email dikirim ke `admin@showreels.id`
4. User mendapat feedback sukses/error

---

## 🎨 Design Highlights

### Color Scheme
- Primary: `#1a46c9` (Blue)
- Gradient: `from-[#1a46c9] to-[#4169e1]`
- Background: `from-slate-50 via-white to-blue-50`

### Typography
- Heading: Bold, 2xl-4xl
- Body: Regular, sm-base
- Accent: Semibold untuk emphasis

### Animations
- Fade in on mount
- Staggered delays untuk sequential reveal
- Pulse effect pada mailbox icons
- Smooth transitions pada hover states

---

## 📝 Testing Checklist

### Google OAuth
- [ ] Login dengan Google berhasil (jika credentials valid)
- [ ] Tombol Google tidak muncul jika `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="false"`
- [ ] Error handling bekerja dengan baik
- [ ] Redirect ke dashboard setelah login sukses

### Email Landing Page
- [ ] Halaman `/email` dapat diakses
- [ ] Animasi berjalan smooth
- [ ] Form validation bekerja
- [ ] Email terkirim ke admin
- [ ] Feedback alert muncul setelah submit
- [ ] Responsive di mobile dan desktop

---

## 🚀 Deployment Notes

### Environment Variables yang Diperlukan
```bash
# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"

# Email Service (required untuk email page)
RESEND_API_KEY="your-resend-api-key"
```

### Vercel Deployment
1. Tambahkan environment variables di Vercel dashboard
2. Redeploy aplikasi
3. Test Google OAuth dan email form di production

---

## 📚 References

- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Resend Email API](https://resend.com/docs)
- [Framer Motion Animations](https://www.framer.com/motion/)
