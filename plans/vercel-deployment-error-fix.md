# Analisis & Solusi Error Deployment Vercel

## 🔍 Diagnosis Masalah

### Error yang Terjadi
Build gagal pada tahap `npm install` di Vercel dengan konfigurasi:
- **Build Machine**: 2 cores, 8 GB RAM
- **Region**: Washington, D.C. (iad1)
- **Branch**: main
- **Commit**: d9c7b7b

### Kemungkinan Root Causes

#### 1. **Dependencies Conflict atau Incompatibility**
```json
Masalah potensial di package.json:
- Next.js 16.2.4 (versi bleeding edge)
- React 19.2.4 (versi terbaru, mungkin ada breaking changes)
- Drizzle-ORM 0.45.2 dengan postgres driver
- Zod 4.3.6 (versi major baru)
```

#### 2. **Build Memory/Timeout Issues**
- Build machine hanya 2 cores, 8 GB RAM
- Project besar dengan banyak dependencies
- Webpack build mungkin memakan terlalu banyak memory

#### 3. **Database Connection Issues**
- Anda menyebutkan menghapus beberapa data di database
- Kemungkinan ada migration yang gagal
- Connection string mungkin tidak valid di production

#### 4. **Environment Variables Missing**
- Build memerlukan env vars tertentu
- DATABASE_URL, SUPABASE keys, dll mungkin tidak terset

---

## 🛠️ Solusi Komprehensif

### Solusi 1: Perbaikan vercel.json

**File**: `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm ci --legacy-peer-deps",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/trial-expiry",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/email-queue",
      "schedule": "0 0 * * *"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "SKIP_ENV_VALIDATION": "false"
  }
}
```

**Perubahan**:
- `npm ci --legacy-peer-deps` → lebih stabil dari `npm install`
- Tambah `regions` untuk konsistensi
- Tambah `functions` config untuk timeout
- Tambah `env` untuk build-time variables

---

### Solusi 2: Optimasi package.json

**File**: `package.json`

```json
{
  "name": "showreels-id",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:seed:owner": "tsx src/db/seed-owner.ts",
    "db:backfill:profiles": "tsx src/db/backfill-auth-profiles.ts",
    "db:reset:dummy": "tsx src/db/reset-and-seed-dummy.ts",
    "postinstall": "prisma generate || true"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^5.2.2",
    "@supabase/ssr": "^0.10.2",
    "@supabase/supabase-js": "^2.104.0",
    "@upstash/redis": "^1.38.0",
    "bcryptjs": "^3.0.3",
    "drizzle-orm": "^0.45.2",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.8.0",
    "next": "16.2.4",
    "next-themes": "^0.4.6",
    "next-view-transitions": "^0.3.5",
    "postgres": "^3.4.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.72.1",
    "react-icons": "^5.6.0",
    "react-loading-skeleton": "^3.5.0",
    "resend": "^6.12.3",
    "sweetalert2": "^11.26.24",
    "swr": "^2.4.1",
    "use-debounce": "^10.1.1",
    "uuid": "^14.0.0",
    "zod": "^4.3.6",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@netlify/plugin-nextjs": "^5.15.10",
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/uuid": "^10.0.0",
    "dotenv": "^17.4.2",
    "drizzle-kit": "^0.31.10",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "jest": "^30.3.0",
    "jest-environment-jsdom": "^30.3.0",
    "tailwindcss": "^4",
    "tsx": "^4.21.0",
    "typescript": "^5"
  }
}
```

**Perubahan**:
- Hapus flag `--webpack` dari scripts (tidak perlu)
- Tambah `engines` untuk specify Node version
- Tambah `postinstall` hook untuk safety

---

### Solusi 3: Optimasi next.config.ts

**File**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "vumbnail.com" },
      { protocol: "https", hostname: "www.instagram.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "framer-motion",
      "swr",
      "react-loading-skeleton",
    ],
  },
  compress: true,
  
  // Optimasi untuk Vercel deployment
  swcMinify: true,
  poweredByHeader: false,
  
  // Webpack optimization untuk reduce memory usage
  webpack: (config, { isServer }) => {
    // Reduce memory usage
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
      },
    };

    return config;
  },
  
  // Cache headers untuk static assets
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|mp4|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value: [
              "<https://fonts.googleapis.com>; rel=preconnect",
              "<https://accounts.google.com>; rel=preconnect",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Perubahan**:
- Tambah `swcMinify: true` untuk faster builds
- Tambah webpack optimization untuk reduce memory
- Tambah `poweredByHeader: false` untuk security

---

### Solusi 4: Database Connection Safety

**File**: `src/db/index.ts`

Pastikan file ini memiliki error handling yang baik:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Validasi environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Connection dengan retry logic
const connectionString = process.env.DATABASE_URL;

// Setup connection dengan proper config untuk Vercel
const client = postgres(connectionString, {
  max: 1, // Limit connections di serverless
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  prepare: false, // Important untuk Vercel
});

export const db = drizzle(client, { schema });
```

**Perubahan**:
- Tambah validation untuk DATABASE_URL
- Set `max: 1` untuk serverless environment
- Set `prepare: false` untuk compatibility
- Tambah SSL config untuk production

---

### Solusi 5: Environment Variables Checklist

**Vercel Dashboard → Project Settings → Environment Variables**

Pastikan semua variable ini sudah terset:

#### Required Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.vercel.app

# Email (Resend)
RESEND_API_KEY=...

# Payment (Tripay)
TRIPAY_API_KEY=...
TRIPAY_PRIVATE_KEY=...
TRIPAY_MERCHANT_CODE=...
NEXT_PUBLIC_TRIPAY_MODE=sandbox

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

#### Optional Variables
```bash
# Analytics
NEXT_PUBLIC_GA_ID=...

# Feature Flags
NEXT_PUBLIC_ENABLE_BILLING=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

### Solusi 6: Build Command Alternatives

Jika masih error, coba alternatif build commands:

#### Option A: Skip Type Checking (temporary)
```json
{
  "buildCommand": "next build --no-lint"
}
```

#### Option B: Increase Memory
```json
{
  "buildCommand": "NODE_OPTIONS='--max-old-space-size=4096' npm run build"
}
```

#### Option C: Use pnpm (faster)
```json
{
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

---

### Solusi 7: .vercelignore Optimization

**File**: `.vercelignore`

```
# Environment files
.env*
!.env.example

# Git
.git
.gitignore

# Dependencies
node_modules

# Build outputs
.next
out
dist
build

# Testing
coverage
.nyc_output
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
__tests__
__mocks__

# Development
.vscode
.idea
*.log
.DS_Store

# Database
drizzle
*.db
*.sqlite

# Documentation
*.md
!README.md

# Plans and docs
plans/
imgreques/
```

---

## 🚀 Langkah-Langkah Implementasi

### Step 1: Update Konfigurasi Files
1. Update `vercel.json` dengan config baru
2. Update `package.json` (hapus --webpack flags)
3. Update `next.config.ts` dengan optimizations
4. Update `.vercelignore`

### Step 2: Fix Database Connection
1. Periksa `src/db/index.ts`
2. Tambahkan error handling
3. Set proper connection config untuk serverless

### Step 3: Validate Environment Variables
1. Buka Vercel Dashboard
2. Go to Project Settings → Environment Variables
3. Pastikan semua required vars ada
4. Set untuk Production, Preview, dan Development

### Step 4: Test Locally
```bash
# Install dependencies
npm ci --legacy-peer-deps

# Build production
npm run build

# Test production build
npm start
```

### Step 5: Deploy ke Vercel
```bash
# Push ke GitHub
git add .
git commit -m "fix: optimize vercel deployment config"
git push origin main

# Atau deploy manual
vercel --prod
```

---

## 🔧 Troubleshooting

### Jika masih error setelah implementasi:

#### 1. Check Build Logs
```bash
# Di Vercel Dashboard
Deployments → [Latest Deployment] → View Build Logs
```

#### 2. Test dengan Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### 3. Downgrade Dependencies
Jika masih error, coba downgrade ke versi stable:

```json
{
  "dependencies": {
    "next": "15.0.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "zod": "3.23.8"
  }
}
```

#### 4. Enable Debug Mode
Tambahkan di `vercel.json`:
```json
{
  "env": {
    "DEBUG": "*"
  }
}
```

---

## 📊 Monitoring Post-Deployment

Setelah berhasil deploy, monitor:

1. **Build Time**: Harus < 5 menit
2. **Bundle Size**: Check di Vercel Analytics
3. **Function Duration**: Monitor API routes
4. **Error Rate**: Check Vercel Logs

---

## 🎯 Expected Results

Setelah implementasi solusi:
- ✅ Build berhasil dalam < 5 menit
- ✅ Tidak ada dependency errors
- ✅ Database connection stabil
- ✅ All API routes working
- ✅ Environment variables properly loaded

---

## 📝 Catatan Penting

### Tentang Database
Anda menyebutkan menghapus beberapa data di database. Pastikan:
- ✅ Schema masih valid
- ✅ Migrations sudah dijalankan
- ✅ Tidak ada foreign key constraints yang broken
- ✅ Connection string masih valid

### Tentang Dependencies
- Next.js 16.x masih experimental, pertimbangkan downgrade ke 15.x
- React 19.x juga baru, bisa menyebabkan compatibility issues
- Zod 4.x adalah major version, check breaking changes

### Tentang Vercel Limits
- Free tier: 100 GB-hours/month
- Build timeout: 45 minutes (Hobby), 45 minutes (Pro)
- Function timeout: 10s (Hobby), 60s (Pro)

---

## 🆘 Jika Masih Gagal

Jika setelah semua solusi masih gagal:

1. **Contact Vercel Support**
   - Buka ticket di Vercel Dashboard
   - Sertakan build logs lengkap

2. **Alternative Deployment**
   - Deploy ke Netlify
   - Deploy ke Railway
   - Deploy ke Render

3. **Simplify Project**
   - Disable fitur yang tidak critical
   - Reduce dependencies
   - Split menjadi microservices

---

## 📚 Resources

- [Vercel Build Configuration](https://vercel.com/docs/build-step)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Drizzle ORM Vercel Guide](https://orm.drizzle.team/docs/get-started-postgresql)
- [Postgres.js Serverless](https://github.com/porsager/postgres#serverless)
