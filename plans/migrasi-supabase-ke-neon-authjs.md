# Rencana Migrasi: Supabase → Neon + Auth.js

> **Status**: FINAL - Menunggu persetujuan user
> **Biaya**: 100% GRATIS (Neon Free Tier + Auth.js open-source)
> **Tanggal**: 8 Mei 2026

---

## Ringkasan Keputusan

| Komponen | Sebelum (Supabase) | Sesudah |
|----------|-------------------|---------|
| Database | Supabase PostgreSQL (ap-northeast-2) | **Neon** Free Tier (0.5 GB, Singapore) |
| Auth | Supabase Auth (email/password) | **Auth.js v5** (Credentials provider) |
| ORM | Drizzle ORM + postgres.js | Drizzle ORM + @neondatabase/serverless |
| Session | Supabase JWT cookies | Auth.js JWT/Database sessions |
| Biaya | $0 (free tier) tapi OUTAGE | **$0** (free tier, self-hosted auth) |

---

## Arsitektur Baru

```mermaid
graph TB
    subgraph Client
        A[Browser] --> B[Next.js App Router]
    end
    
    subgraph Auth Layer
        B --> C[Auth.js v5 Middleware]
        C --> D[src/auth.ts - NextAuth Config]
        D --> E[Credentials Provider]
        D --> F[Drizzle Adapter]
    end
    
    subgraph Database Layer
        F --> G[Neon PostgreSQL]
        H[Drizzle ORM] --> G
        I[@neondatabase/serverless] --> G
    end
    
    subgraph Existing
        B --> J[Dashboard]
        B --> K[API Routes]
        K --> H
        J --> H
    end
```

---

## Fase Implementasi

### FASE 0: Backup & Persiapan

**Tujuan**: Simpan semua file Supabase asli untuk rollback

#### File yang di-backup ke `_backup_supabase/`:
```
_backup_supabase/
├── src/lib/supabase/client.ts
├── src/lib/supabase/config.ts
├── src/lib/supabase/proxy.ts
├── src/lib/supabase/server.ts
├── src/server/current-user.ts
├── src/middleware.ts
├── src/services/auth-service.ts
├── src/components/auth-guard.tsx
├── src/components/auth/login-form.tsx
├── src/components/auth/signup-form.tsx
├── src/app/auth/reset-password/page.tsx
├── src/app/auth/callback/route.ts
├── src/app/api/auth/bootstrap/route.ts
├── src/app/api/auth/refresh-session/route.ts
├── src/app/api/auth/logout/route.ts
├── src/components/landing-page.tsx
├── src/components/session-activity-manager.tsx
├── src/components/dashboard/settings-panel.tsx
├── src/components/dashboard/settings-hub.tsx
├── src/components/dashboard/dashboard-shell.tsx
├── src/db/index.ts
├── src/db/owner-utils.ts
├── drizzle.config.ts
├── .env.local
└── package.json
```

---

### FASE 1: Setup Neon Database

**Tujuan**: Koneksi database baru yang berfungsi

#### 1.1 Buat Project di Neon
1. Daftar di https://neon.tech (gratis)
2. Buat project baru: `showreels-id`
3. Pilih region: **Asia Pacific (Singapore)** - terdekat ke Indonesia
4. Salin connection string

#### 1.2 Environment Variables Baru
```env
# .env.local
DATABASE_URL="postgresql://neondb_owner:npg_WMVNOK30RxEd@ep-dawn-meadow-aonrikg4-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
AUTH_SECRET="generated-random-secret-32-chars"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

#### 1.3 Update Koneksi Database

**File**: `src/db/index.ts`
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
```

**File**: `drizzle.config.ts`
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### 1.4 Install Dependencies
```bash
npm install @neondatabase/serverless
npm uninstall @supabase/ssr @supabase/supabase-js
```

#### 1.5 Jalankan Migrasi
```bash
npx drizzle-kit push
```

---

### FASE 2: Setup Auth.js v5

**Tujuan**: Sistem autentikasi baru yang berfungsi

#### 2.1 Install Auth.js
```bash
npm install next-auth@beta @auth/drizzle-adapter
```

#### 2.2 Tambah Tabel Auth ke Schema

**File**: `src/db/schema.ts` (tambahan)
```typescript
// === AUTH.JS TABLES ===
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (table) => ({
  compositePk: primaryKey({ columns: [table.identifier, table.token] }),
}));
```

#### 2.3 Buat Auth Config

**File BARU**: `src/auth.ts`
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

#### 2.4 Buat API Route Handler

**File BARU**: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

#### 2.5 Update Middleware

**File**: `src/middleware.ts`
```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  const publicPaths = ["/", "/auth", "/api/auth", "/api/public", "/api/visitor"];
  const isPublicRoute = publicPaths.some((p) => pathname.startsWith(p));

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
```

#### 2.6 Update current-user.ts

**File**: `src/server/current-user.ts`
```typescript
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentAuthUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return dbUser ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
```

---

### FASE 3: Refactor Auth Pages & Components

**Tujuan**: UI login/signup menggunakan Auth.js

#### 3.1 Login Form → signIn()

**File**: `src/components/auth/login-form.tsx`
```typescript
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau password salah");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* existing UI tetap sama, hanya logic berubah */}
    </form>
  );
}
```

#### 3.2 Signup → Custom API + signIn()

**File BARU**: `src/app/api/auth/register/route.ts`
```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  // Check existing user
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db.insert(users).values({
    email,
    passwordHash,
    displayName: name,
    role: "creator",
  }).returning();

  return NextResponse.json({ user: { id: newUser.id, email: newUser.email } });
}
```

#### 3.3 Logout → signOut()

```typescript
import { signOut } from "next-auth/react";
// Panggil: await signOut({ callbackUrl: "/" });
```

#### 3.4 SessionProvider Wrapper

**File**: `src/providers/app-providers.tsx` (update)
```typescript
import { SessionProvider } from "next-auth/react";

export function AppProviders({ children }) {
  return (
    <SessionProvider>
      {/* existing providers */}
      {children}
    </SessionProvider>
  );
}
```

#### 3.5 Auth Guard Component

**File**: `src/components/auth-guard.tsx`
```typescript
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
```

---

### FASE 4: Schema & Password Migration

**Tujuan**: Pastikan password hash kompatibel

#### 4.1 Tambah kolom passwordHash ke users table

Schema saat ini sudah memiliki field `passwordHash` di tabel users (dari Supabase cleanup sebelumnya). Jika belum ada, tambahkan:

```typescript
// Di schema users, pastikan ada:
passwordHash: text("password_hash"),
```

#### 4.2 Password Hashing Utility

**File**: `src/lib/password.ts` (update/buat)
```typescript
import { hash, verify } from "@node-rs/bcrypt";
// atau gunakan bcryptjs jika sudah ada

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return verify(password, hashedPassword);
}
```

#### 4.3 Migrasi Password dari Supabase Auth

> **PENTING**: Supabase Auth menyimpan password di `auth.users` table (terpisah dari public schema). Password hash menggunakan bcrypt. Jika Anda sudah memiliki `passwordHash` di tabel `users` public, maka tidak perlu migrasi. Jika belum, user perlu reset password saat pertama login.

---

### FASE 5: Cleanup & Testing

#### 5.1 Hapus Packages Supabase
```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

#### 5.2 Hapus/Archive File Supabase
- `src/lib/supabase/` → hapus (sudah di-backup)
- `src/app/auth/callback/route.ts` → hapus (tidak perlu untuk Credentials)
- `src/app/api/auth/refresh-session/` → hapus
- `src/app/api/auth/bootstrap/` → refactor (tidak perlu Supabase)

#### 5.3 Update Environment Variables di Vercel
```
# HAPUS:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# TAMBAH:
DATABASE_URL=postgresql://...@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET=xxx
AUTH_URL=https://showreels.id
NEXTAUTH_URL=https://showreels.id
```

#### 5.4 Testing Checklist
- [ ] Login dengan email/password
- [ ] Signup user baru
- [ ] Session persist setelah refresh
- [ ] Protected routes redirect ke login
- [ ] Dashboard load data dari Neon
- [ ] Logout berfungsi
- [ ] Demo mode masih berfungsi
- [ ] API routes terproteksi

---

## Dampak File (Detail)

### File yang DIHAPUS:
| File | Alasan |
|------|--------|
| `src/lib/supabase/client.ts` | Diganti Auth.js |
| `src/lib/supabase/config.ts` | Tidak perlu lagi |
| `src/lib/supabase/proxy.ts` | Diganti Auth.js middleware |
| `src/lib/supabase/server.ts` | Diganti auth() |
| `src/app/auth/callback/route.ts` | Tidak perlu untuk Credentials |
| `src/app/api/auth/refresh-session/route.ts` | Auth.js handle otomatis |

### File yang DIBUAT BARU:
| File | Fungsi |
|------|--------|
| `src/auth.ts` | NextAuth config utama |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js API handler |
| `src/app/api/auth/register/route.ts` | Custom signup endpoint |

### File yang DIMODIFIKASI:
| File | Perubahan |
|------|-----------|
| `src/db/index.ts` | postgres.js → @neondatabase/serverless |
| `src/db/schema.ts` | Tambah tabel accounts, sessions, verificationTokens |
| `drizzle.config.ts` | Hapus SSL conditional |
| `src/middleware.ts` | Supabase → Auth.js auth() |
| `src/server/current-user.ts` | supabase.auth.getUser() → auth() |
| `src/services/auth-service.ts` | Supabase signIn → next-auth signIn |
| `src/components/auth-guard.tsx` | Supabase → useSession() |
| `src/components/auth/login-form.tsx` | Supabase → signIn credentials |
| `src/components/auth/signup-form.tsx` | Supabase → fetch /api/auth/register |
| `src/components/landing-page.tsx` | Hapus Supabase import |
| `src/components/session-activity-manager.tsx` | Supabase → useSession |
| `src/components/dashboard/settings-panel.tsx` | Supabase → Auth.js |
| `src/components/dashboard/settings-hub.tsx` | Supabase → Auth.js |
| `src/components/dashboard/dashboard-shell.tsx` | Supabase → Auth.js |
| `src/db/owner-utils.ts` | Supabase admin → direct DB |
| `src/app/api/auth/logout/route.ts` | Supabase → Auth.js signOut |
| `src/providers/app-providers.tsx` | Tambah SessionProvider |
| `package.json` | Ganti dependencies |
| `.env.local` | Ganti env vars |

---

## Rollback Plan

Jika migrasi gagal, rollback dengan:

```bash
# 1. Copy semua file dari backup
cp -r _backup_supabase/src/lib/supabase/ src/lib/supabase/
cp _backup_supabase/src/server/current-user.ts src/server/current-user.ts
cp _backup_supabase/src/middleware.ts src/middleware.ts
# ... dst untuk semua file

# 2. Restore .env.local
cp _backup_supabase/.env.local .env.local

# 3. Restore package.json dan install
cp _backup_supabase/package.json package.json
npm install

# 4. Revert Vercel env vars ke Supabase credentials
```

---

## Catatan Penting

### Tentang Password Migration
- Supabase Auth menyimpan password di schema `auth.users` yang **terpisah** dari `public.users`
- Jika project sudah memiliki `passwordHash` di tabel `public.users`, migrasi seamless
- Jika TIDAK ada `passwordHash` di public schema, opsi:
  1. Export password hash dari Supabase `auth.users` (perlu akses admin)
  2. Force reset password untuk semua user saat pertama login

### Tentang Demo Mode
- Demo mode (`NEXT_PUBLIC_DEMO_MODE=true`) tetap berfungsi
- Logic demo mode di `current-user.ts` perlu dipertahankan

### Tentang Neon Cold Start
- Neon free tier memiliki cold start ~500ms setelah idle 5 menit
- Untuk production, pertimbangkan upgrade ke Pro ($19/mo) jika perlu always-on
- Untuk development/MVP, free tier sudah cukup

### Tentang Neon Connection Pooling
- Neon sudah include connection pooling built-in
- Tidak perlu pgbouncer terpisah seperti Supabase
- `prepare: false` tidak diperlukan lagi

---

## Urutan Eksekusi

```mermaid
graph LR
    A[Fase 0: Backup] --> B[Fase 1: Neon DB]
    B --> C[Fase 2: Auth.js]
    C --> D[Fase 3: Refactor UI]
    D --> E[Fase 4: Password]
    E --> F[Fase 5: Cleanup]
    F --> G[Deploy]
```

Setiap fase bisa di-test secara independen sebelum lanjut ke fase berikutnya.
