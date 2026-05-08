# File Implementations - Ready to Use

## 1. vercel.json (REPLACE EXISTING)

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
    "NODE_ENV": "production"
  }
}
```

---

## 2. package.json (UPDATE SCRIPTS SECTION)

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
    "db:reset:dummy": "tsx src/db/reset-and-seed-dummy.ts"
  }
}
```

**Changes:**
- Removed `--webpack` flag from dev and build scripts
- Added `engines` field

---

## 3. next.config.ts (ADD OPTIMIZATIONS)

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
  
  // NEW: Optimizations for Vercel
  swcMinify: true,
  poweredByHeader: false,
  
  // NEW: Webpack optimization
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

    // Fix for serverless
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

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

---

## 4. src/db/index.ts (FIX DATABASE CONNECTION)

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Validate environment variable
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is not defined in production');
  }
  console.warn('DATABASE_URL is not defined, using fallback');
}

const connectionString = process.env.DATABASE_URL || '';

// Setup connection with proper config for Vercel serverless
const client = postgres(connectionString, {
  max: 1, // Limit connections in serverless
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  prepare: false, // CRITICAL: Must be false for Vercel
  onnotice: () => {}, // Suppress notices
});

export const db = drizzle(client, { schema });

// Export client for cleanup if needed
export { client };
```

**Key Changes:**
- Added `prepare: false` (critical for Vercel)
- Set `max: 1` for serverless
- Added proper SSL config
- Added environment validation

---

## 5. .vercelignore (OPTIMIZE)

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

# Local development
.codex-local
```

---

## 6. Environment Variables Template

Create `.env.example`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Email (Resend)
RESEND_API_KEY=re_xxx

# Payment (Tripay)
TRIPAY_API_KEY=xxx
TRIPAY_PRIVATE_KEY=xxx
TRIPAY_MERCHANT_CODE=xxx
NEXT_PUBLIC_TRIPAY_MODE=sandbox

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

---

## 7. Vercel Environment Variables Setup

### Via Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: Settings → Environment Variables
4. Add each variable for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### Via Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variables
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... repeat for all variables
```

---

## 8. Deployment Commands

### Option A: Git Push (Recommended)
```bash
# Commit changes
git add .
git commit -m "fix: optimize vercel deployment config"
git push origin main

# Vercel will auto-deploy
```

### Option B: Vercel CLI
```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

### Option C: Manual Deploy
```bash
# Build locally first
npm ci --legacy-peer-deps
npm run build

# Then deploy
vercel --prod --prebuilt
```

---

## 9. Post-Deployment Validation

### Check Build Logs
```bash
# Via CLI
vercel logs [deployment-url]

# Or via Dashboard
# Deployments → [Latest] → View Build Logs
```

### Test Endpoints
```bash
# Health check
curl https://your-domain.vercel.app/api/site-status

# Test API
curl https://your-domain.vercel.app/api/dashboard/summary
```

### Monitor Performance
- Build Time: Should be < 5 minutes
- Function Duration: Should be < 10 seconds
- Error Rate: Should be < 1%

---

## 10. Rollback Plan

If deployment fails:

```bash
# Via CLI
vercel rollback [previous-deployment-url]

# Or via Dashboard
# Deployments → [Previous Working] → Promote to Production
```

---

## Implementation Checklist

- [ ] Backup current files
- [ ] Update `vercel.json`
- [ ] Update `package.json` scripts
- [ ] Update `next.config.ts`
- [ ] Update `src/db/index.ts`
- [ ] Update `.vercelignore`
- [ ] Set all environment variables in Vercel
- [ ] Test build locally
- [ ] Commit and push
- [ ] Monitor deployment
- [ ] Validate production site
- [ ] Check error logs

---

## Success Criteria

✅ Build completes in < 5 minutes
✅ No dependency errors
✅ All API routes working
✅ Database queries successful
✅ No runtime errors
✅ Performance metrics optimal

---

## Support

If issues persist:
1. Check full analysis: [`vercel-deployment-error-fix.md`](./vercel-deployment-error-fix.md)
2. Review diagrams: [`vercel-deployment-diagrams.md`](./vercel-deployment-diagrams.md)
3. Use quick guide: [`vercel-quick-fix-guide.md`](./vercel-quick-fix-guide.md)
4. Contact Vercel Support with build logs
