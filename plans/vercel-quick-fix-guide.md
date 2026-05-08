# Quick Fix Guide - Vercel Deployment Error

## 🚨 Immediate Actions (5 menit)

### 1. Update vercel.json
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
  ]
}
```

### 2. Update package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```
**Hapus flag `--webpack`**

### 3. Check Environment Variables di Vercel
Buka: Vercel Dashboard → Settings → Environment Variables

**Required:**
- ✅ DATABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ RESEND_API_KEY
- ✅ TRIPAY_API_KEY
- ✅ TRIPAY_PRIVATE_KEY
- ✅ TRIPAY_MERCHANT_CODE
- ✅ UPSTASH_REDIS_REST_URL
- ✅ UPSTASH_REDIS_REST_TOKEN

---

## 🔧 Medium Priority (15 menit)

### 4. Optimize next.config.ts
Tambahkan di `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  // ... existing config
  
  swcMinify: true,
  poweredByHeader: false,
  
  webpack: (config, { isServer }) => {
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
};
```

### 5. Fix Database Connection
Update `src/db/index.ts`:

```typescript
const client = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  prepare: false, // IMPORTANT untuk Vercel
});
```

---

## 🎯 Test Locally

```bash
# Clean install
rm -rf node_modules package-lock.json
npm ci --legacy-peer-deps

# Build production
npm run build

# Test
npm start
```

---

## 🚀 Deploy

```bash
git add .
git commit -m "fix: optimize vercel deployment"
git push origin main
```

---

## ⚠️ Jika Masih Error

### Option A: Downgrade Dependencies
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

### Option B: Increase Memory
```json
{
  "buildCommand": "NODE_OPTIONS='--max-old-space-size=4096' npm run build"
}
```

### Option C: Skip Type Check (temporary)
```json
{
  "buildCommand": "next build --no-lint"
}
```

---

## 📋 Checklist

- [ ] Update vercel.json dengan `npm ci --legacy-peer-deps`
- [ ] Hapus `--webpack` flag dari package.json
- [ ] Validasi semua environment variables di Vercel
- [ ] Tambah webpack optimization di next.config.ts
- [ ] Fix database connection config (prepare: false)
- [ ] Test build locally
- [ ] Push ke GitHub
- [ ] Monitor deployment di Vercel Dashboard

---

## 🆘 Emergency Contacts

**Jika masih gagal setelah semua fix:**

1. Check build logs lengkap di Vercel Dashboard
2. Copy error message spesifik
3. Search di Vercel Community atau Stack Overflow
4. Contact Vercel Support dengan build logs

---

## 📊 Success Indicators

Deployment berhasil jika:
- ✅ Build time < 5 menit
- ✅ No dependency errors
- ✅ All API routes return 200
- ✅ Database queries working
- ✅ No runtime errors di logs

---

## 🔍 Common Errors & Solutions

### Error: "Cannot find module"
**Solution:** Run `npm ci --legacy-peer-deps`

### Error: "ECONNREFUSED database"
**Solution:** Check DATABASE_URL env var

### Error: "Build timeout"
**Solution:** Add memory optimization to webpack config

### Error: "Peer dependency conflict"
**Solution:** Use `--legacy-peer-deps` flag

### Error: "Module not found: Can't resolve 'fs'"
**Solution:** Add to next.config.ts:
```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
  }
  return config;
}
```

---

## 📚 Reference Files

- Full analysis: [`vercel-deployment-error-fix.md`](./vercel-deployment-error-fix.md)
- Diagrams: [`vercel-deployment-diagrams.md`](./vercel-deployment-diagrams.md)
- Vercel docs: https://vercel.com/docs
