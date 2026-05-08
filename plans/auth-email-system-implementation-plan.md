# Authentication & Email Notification System — Implementation Plan

**Document Version:** 1.0  
**Based on:** PRD_Auth_Email_System.md  
**Target Stack:** Next.js 16 / Supabase Auth / PostgreSQL / Drizzle ORM / Resend.com / Database Queue  
**Priority:** Fast Auth → Email System → Admin Panel  

---

## 📋 Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Overview](#2-architecture-overview)
3. [Phase 1: Fast Authentication Optimization](#3-phase-1-fast-authentication-optimization)
4. [Phase 2: Email Notification System](#4-phase-2-email-notification-system)
5. [Phase 3: Admin Email Management](#5-phase-3-admin-email-management)
6. [Phase 4: Security & Performance](#6-phase-4-security--performance)
7. [Database Migrations](#7-database-migrations)
8. [File Structure](#8-file-structure)
9. [Environment Variables](#9-environment-variables)
10. [Deployment Checklist](#10-deployment-checklist)

---

## 1. Current State Analysis

### Existing Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase Auth | ✅ Active | Login/signup via email+password & Google OAuth |
| JWT Sessions | ✅ Active | Managed by `@supabase/ssr` |
| Database (PostgreSQL) | ✅ Active | Via Drizzle ORM + `postgres` driver |
| `users` table | ✅ Active | Has `email` index (`users_email_idx`) |
| `site_settings` table | ✅ Active | Has `maintenance_enabled`, `billing_enabled` |
| `@upstash/redis` | ⚠️ Installed | Package exists but no active Redis usage found |
| Email System | ❌ Missing | No email service, no Resend integration |
| Email Queue | ❌ Missing | No queue system |
| Email Logs | ❌ Missing | No email tracking |

### Current Auth Flow Issues

1. **Login** → calls `/api/auth/bootstrap` which syncs profile (heavy operation)
2. **Logout** → synchronous `supabase.auth.signOut()` before responding
3. **Dashboard** → loads all data before rendering (blocking)
4. **No session caching** → every request hits Supabase Auth

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                          │
├─────────────────────────────────────────────────────────────────┤
│  Login Form → Supabase Auth → Bootstrap API → Dashboard         │
│  Logout → Instant redirect → Async cleanup                      │
│  Dashboard → Lazy load sections via SWR                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (Next.js Routes)                   │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/auth/bootstrap    → Minimal payload + async profile  │
│  POST /api/auth/logout       → Instant response + async cleanup │
│  POST /api/email/send        → Queue email job                  │
│  GET  /api/email/stats       → Email statistics                 │
│  GET  /api/email/logs        → Failed email logs                │
│  PATCH /api/admin/email-toggle → Kill-switch                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────┤
│  users              → Auth data (indexed email)                  │
│  site_settings      → email_enabled toggle (extend existing)    │
│  email_logs         → NEW: Track all email attempts             │
│  email_queue_jobs   → NEW: Database-based queue                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EMAIL QUEUE WORKER                               │
├─────────────────────────────────────────────────────────────────┤
│  Cron API Route → Process pending jobs → Resend.com API         │
│  Retry logic: 3 attempts (0s, 30s, 5min)                        │
│  Fail-safe: Never block user transactions                       │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESEND.COM API                                 │
├─────────────────────────────────────────────────────────────────┤
│  Welcome Email → On signup success                              │
│  Subscription Email → On payment success                        │
│  Quota: ~100/day (free) or ~3000/day (paid)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1: Fast Authentication Optimization

### 3.1 Login Flow Optimization

**Current Flow (Slow):**
```
User Submit → Supabase Auth → Bootstrap API → Sync Profile → 
Fetch Full User → Return Heavy Payload → Redirect Dashboard
```

**Optimized Flow (Fast):**
```
User Submit → Supabase Auth → Bootstrap API (minimal) → 
Return Lightweight Payload → Instant Redirect → 
Dashboard loads data async via SWR
```

#### A. Minimal Login Payload

**File:** `src/app/api/auth/bootstrap/route.ts`

```typescript
// BEFORE: Returns full user profile with all fields
// AFTER: Returns only essential auth data

interface MinimalAuthPayload {
  id: string;
  name: string;
  email: string;
  role: string;  // "creator" | "admin" | ""
  username: string | null;
}

// Response target: < 300ms
```

#### B. Deferred Profile Sync

```typescript
// Move heavy profile sync to background
// Don't await it during login

async function handleBootstrap() {
  const authUser = await getSupabaseUser(); // fast - JWT validation
  
  // Return immediately with minimal data
  const response = NextResponse.json({
    id: authUser.id,
    name: authUser.user_metadata.full_name || "",
    email: authUser.email,
    role: "", // loaded async later
    username: authUser.user_metadata.username || null,
    redirectTo: "/dashboard",
  });

  // Fire-and-forget profile sync (non-blocking)
  void syncUserProfileBackground(authUser);
  
  return response;
}
```

#### C. Session Cache (In-Memory → Redis Later)

**File:** `src/server/session-cache.ts`

```typescript
// Phase 1: In-memory Map (works for single instance)
// Phase 2: Upstash Redis (when ready)

const sessionCache = new Map<string, { data: MinimalAuthPayload; expiresAt: number }>();

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getCachedSession(userId: string): MinimalAuthPayload | null {
  const entry = sessionCache.get(`session:${userId}`);
  if (!entry || Date.now() > entry.expiresAt) {
    sessionCache.delete(`session:${userId}`);
    return null;
  }
  return entry.data;
}

export function setCachedSession(userId: string, data: MinimalAuthPayload): void {
  sessionCache.set(`session:${userId}`, {
    data,
    expiresAt: Date.now() + SESSION_TTL,
  });
}

export function invalidateSession(userId: string): void {
  sessionCache.delete(`session:${userId}`);
}
```

### 3.2 Logout Flow Optimization

**Current Flow (Blocking):**
```
Click Logout → API Call → await signOut() → Response → Redirect
```

**Optimized Flow (Instant):**
```
Click Logout → Clear local state → Redirect immediately → 
Background: API invalidates server session
```

#### Frontend Logout (Non-Blocking)

**File:** `src/services/auth-service.ts` (modify)

```typescript
export function performInstantLogout() {
  // 1. Clear local auth state immediately
  clearLocalAuthState();
  
  // 2. Clear cookies client-side
  document.cookie = "sb-access-token=; Max-Age=0; path=/";
  document.cookie = "sb-refresh-token=; Max-Age=0; path=/";
  
  // 3. Fire-and-forget server cleanup
  void fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  
  // 4. Redirect immediately (don't wait for API)
  window.location.href = "/auth/login";
}
```

#### Backend Logout (Simplified)

**File:** `src/app/api/auth/logout/route.ts`

```typescript
export async function POST() {
  // Quick response - don't block
  const supabase = await createClient();
  
  // Fire and forget - client already redirected
  void supabase.auth.signOut().catch(() => {});
  
  return NextResponse.json({ ok: true });
}
```

### 3.3 Dashboard Data Loading Strategy

**Principle:** Auth data ≠ Dashboard data. Separate them.

```
Login Success → Redirect /dashboard
                    │
                    ▼
         ┌─────────────────────┐
         │  Shell renders with  │
         │  cached auth data    │
         │  (name, avatar)      │
         └──────────┬──────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
         ▼          ▼          ▼
    SWR: Profile  SWR: Videos  SWR: Analytics
    (lazy load)   (lazy load)  (lazy load)
```

**File:** `src/components/dashboard/dashboard-data-loader.tsx` (modify)

```typescript
// Each section loads independently via SWR
// Dashboard shell renders immediately with skeleton states
// No blocking queries during initial load
```

---

## 4. Phase 2: Email Notification System

### 4.1 Email Service Architecture

```
┌──────────────────────────────────────────────────────┐
│                 EMAIL SERVICE LAYER                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  queueEmail()                                         │
│       │                                               │
│       ▼                                               │
│  ┌─────────────────┐                                 │
│  │ Check Settings  │ ← email_enabled = true?         │
│  └────────┬────────┘                                 │
│           │                                           │
│           ▼                                           │
│  ┌─────────────────┐                                 │
│  │ Insert to Queue │ → email_queue_jobs table        │
│  └────────┬────────┘                                 │
│           │                                           │
│           ▼                                           │
│  ┌─────────────────┐                                 │
│  │ Return Success  │ ← Non-blocking, instant         │
│  └─────────────────┘                                 │
│                                                       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              QUEUE WORKER (Cron-based)                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  /api/cron/email-queue (every 30s via Vercel Cron)   │
│       │                                               │
│       ▼                                               │
│  ┌─────────────────┐                                 │
│  │ Fetch Pending   │ → SELECT ... WHERE status =     │
│  │ Jobs (batch 10) │   'pending' LIMIT 10            │
│  └────────┬────────┘                                 │
│           │                                           │
│           ▼                                           │
│  ┌─────────────────┐                                 │
│  │ Check Quota     │ → Count today's sent emails     │
│  └────────┬────────┘                                 │
│           │                                           │
│      ┌────┴────┐                                     │
│      │         │                                     │
│   Quota OK   Quota Exceeded                          │
│      │         │                                     │
│      ▼         ▼                                     │
│  Send via    Skip + Log                              │
│  Resend      "quota_exceeded"                        │
│      │                                               │
│      ▼                                               │
│  ┌─────────────────┐                                 │
│  │ Update Status   │ → 'sent' or 'failed'           │
│  │ + Create Log    │                                 │
│  └─────────────────┘                                 │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### 4.2 Email Service Implementation

**File:** `src/services/email-service.ts`

```typescript
import { db } from "@/db";
import { emailQueueJobs, emailLogs, siteSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

type EmailType = "welcome" | "subscription";

interface QueueEmailParams {
  userId: string;
  recipientEmail: string;
  emailType: EmailType;
  payload: Record<string, unknown>;
}

/**
 * Queue an email for async delivery.
 * NEVER blocks the calling transaction.
 * Returns immediately after inserting to queue.
 */
export async function queueEmail(params: QueueEmailParams): Promise<void> {
  try {
    // Check if email system is enabled
    const settings = await db
      .select({ value: siteSettings.emailEnabled })
      .from(siteSettings)
      .where(eq(siteSettings.id, "global"))
      .limit(1);

    const emailEnabled = settings[0]?.value ?? false;
    
    if (!emailEnabled) {
      // Log skip but don't throw
      await createEmailLog({
        userId: params.userId,
        emailType: params.emailType,
        recipientEmail: params.recipientEmail,
        status: "skipped",
        provider: "resend",
        errorMessage: "Email system disabled by admin",
      });
      return;
    }

    // Insert to queue (non-blocking for caller)
    await db.insert(emailQueueJobs).values({
      payload: params,
      status: "pending",
      retryCount: 0,
    });
  } catch (error) {
    // NEVER throw - email is non-critical
    console.error("[Email Queue] Failed to queue:", error);
  }
}
```

### 4.3 Resend Integration

**File:** `src/services/resend-client.ts`

```typescript
interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isQuotaError?: boolean;
}

export async function sendViaResend(params: SendEmailParams): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Showreels.id <noreply@showreels.id>",
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (response.status === 429) {
      return { 
        success: false, 
        error: "Rate limit exceeded (429)", 
        isQuotaError: true 
      };
    }

    if (!response.ok) {
      const body = await response.text();
      return { success: false, error: `Resend API error: ${response.status} - ${body}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
```

### 4.4 Email Templates

**File:** `src/services/email-templates.ts`

```typescript
export function getWelcomeEmailHtml(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://showreels.id/logo.png" alt="Showreels.id" width="120" />
      </div>
      <h1 style="color: #111; font-size: 24px;">Selamat datang, ${name}! 🎬</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Akun Showreels.id kamu sudah aktif. Sekarang kamu bisa:
      </p>
      <ul style="color: #555; font-size: 16px; line-height: 2;">
        <li>Upload video portfolio</li>
        <li>Buat halaman profil publik</li>
        <li>Bagikan link ke klien</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://showreels.id/dashboard" 
           style="background: #111; color: #fff; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600;">
          Buka Dashboard →
        </a>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Showreels.id
      </p>
    </body>
    </html>
  `;
}

export function getSubscriptionEmailHtml(
  name: string, 
  planName: string, 
  features: string[]
): string {
  const featureList = features.map(f => `<li>${f}</li>`).join("");
  
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://showreels.id/logo.png" alt="Showreels.id" width="120" />
      </div>
      <h1 style="color: #111; font-size: 24px;">Subscription Aktif! 🎉</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Hai ${name}, paket <strong>${planName}</strong> kamu sudah aktif.
      </p>
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #111; margin-top: 0;">Fitur yang kamu dapatkan:</h3>
        <ul style="color: #555; font-size: 14px; line-height: 2;">
          ${featureList}
        </ul>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://showreels.id/dashboard" 
           style="background: #111; color: #fff; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600;">
          Mulai Gunakan →
        </a>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Showreels.id
      </p>
    </body>
    </html>
  `;
}
```

### 4.5 Queue Worker (Cron-Based)

**File:** `src/app/api/cron/email-queue/route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { emailQueueJobs, emailLogs } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { sendViaResend } from "@/services/resend-client";
import { getWelcomeEmailHtml, getSubscriptionEmailHtml } from "@/services/email-templates";

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;
const DAILY_QUOTA_LIMIT = 90; // Conservative: leave 10% buffer

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch pending jobs
  const pendingJobs = await db
    .select()
    .from(emailQueueJobs)
    .where(eq(emailQueueJobs.status, "pending"))
    .limit(BATCH_SIZE);

  if (pendingJobs.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  // Check daily quota
  const todaySent = await db
    .select({ count: sql<number>`count(*)` })
    .from(emailLogs)
    .where(
      and(
        eq(emailLogs.status, "sent"),
        sql`${emailLogs.createdAt} >= CURRENT_DATE`
      )
    );

  const sentToday = todaySent[0]?.count ?? 0;
  
  if (sentToday >= DAILY_QUOTA_LIMIT) {
    // Skip all - quota exceeded
    for (const job of pendingJobs) {
      await markJobFailed(job.id, "daily_quota_exceeded");
    }
    return NextResponse.json({ processed: 0, skipped: pendingJobs.length, reason: "quota" });
  }

  let processed = 0;

  for (const job of pendingJobs) {
    if (sentToday + processed >= DAILY_QUOTA_LIMIT) break;

    const result = await processEmailJob(job);
    if (result) processed++;
  }

  return NextResponse.json({ processed });
}
```

### 4.6 Fail-Safe Integration Points

#### Welcome Email (After Signup)

**Hook into:** `src/app/api/auth/bootstrap/route.ts`

```typescript
// AFTER successful user creation/sync
await saveUserToDatabase(userData); // ← MUST succeed first

// Queue welcome email (fire-and-forget, non-blocking)
void queueEmail({
  userId: userData.id,
  recipientEmail: userData.email,
  emailType: "welcome",
  payload: { name: userData.name },
}).catch(() => {}); // Never throw

// Return success to user immediately
return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
```

#### Subscription Email (After Payment)

**Hook into:** `src/app/api/billing/tripay/callback/route.ts`

```typescript
// AFTER subscription is saved and activated
await saveSubscription(subscriptionData); // ← MUST succeed first
await activateCreatorPlan(userId);        // ← MUST succeed first

// Queue subscription email (fire-and-forget)
void queueEmail({
  userId,
  recipientEmail: userEmail,
  emailType: "subscription",
  payload: { 
    name: userName, 
    planName: "Creator",
    features: ["Unlimited videos", "Custom domain", "Analytics"],
  },
}).catch(() => {}); // Never throw

// Return success - subscription is already active
return NextResponse.json({ ok: true });
```

---

## 5. Phase 3: Admin Email Management

### 5.1 Admin Panel UI

**File:** `src/components/admin/email-management-panel.tsx`

```
┌─────────────────────────────────────────────────┐
│           EMAIL SYSTEM DASHBOARD                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  Status: 🟢 ENABLED                             │
│  Toggle: [████████ ON]                           │
│                                                  │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ Sent Today   │ Failed Today │ Queue Pending│ │
│  │    432       │     12       │      4       │ │
│  └──────────────┴──────────────┴──────────────┘ │
│                                                  │
│  Estimated Remaining Quota: ~568                 │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  Recent Failed Logs:                             │
│  ┌─────────────────────────────────────────────┐│
│  │ 12:30 | welcome | quota_exceeded            ││
│  │ 12:28 | subscription | invalid_email        ││
│  │ 12:15 | welcome | timeout                   ││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  [Retry Failed] [Clear Logs] [Export CSV]        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 5.2 Admin API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/email-toggle` | PATCH | Toggle email system on/off |
| `/api/email/stats` | GET | Get email statistics |
| `/api/email/logs` | GET | Get email logs (paginated) |
| `/api/email/retry` | POST | Retry failed emails |

### 5.3 Kill-Switch Logic

```typescript
// In site_settings table (extend existing)
// Add field: emailEnabled (boolean)

// Check before every email send:
const isEmailEnabled = await getEmailSystemStatus();
if (!isEmailEnabled) {
  // Skip silently, log the skip
  return;
}
```

---

## 6. Phase 4: Security & Performance

### 6.1 Rate Limiting

**File:** `src/lib/rate-limit.ts`

```typescript
// In-memory rate limiter (upgrade to Redis later)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 }); // 1 minute window
    return true; // allowed
  }
  
  if (entry.count >= 5) {
    return false; // blocked
  }
  
  entry.count++;
  return true; // allowed
}
```

### 6.2 Performance Targets

| Action | Target | Measurement |
|--------|--------|-------------|
| Login Response | < 300ms | Time from submit to redirect |
| Logout Response | < 100ms | Time from click to redirect |
| Email Queue Push | < 50ms | Time to insert queue job |
| Dashboard Redirect | Instant | No blocking queries |
| Email Send | Async | Background via cron |

### 6.3 Security Checklist

- [x] JWT managed by Supabase (7-day expiry)
- [ ] Rate limit: 5 login attempts/minute/IP
- [ ] HTTP-only cookies (Supabase SSR handles this)
- [ ] CSRF: Verify origin header on mutations
- [ ] Input validation: Zod schemas on all endpoints
- [ ] Email: Never expose internal errors to users

---

## 7. Database Migrations

### Migration: `0018_email_system.sql`

```sql
-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email_type VARCHAR(50) NOT NULL,
    recipient_email TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    provider VARCHAR(50) NOT NULL DEFAULT 'resend',
    message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX email_logs_user_id_idx ON email_logs(user_id);
CREATE INDEX email_logs_status_idx ON email_logs(status);
CREATE INDEX email_logs_created_at_idx ON email_logs(created_at);
CREATE INDEX email_logs_type_status_idx ON email_logs(email_type, status);

-- Email Queue Jobs Table
CREATE TABLE IF NOT EXISTS email_queue_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    retry_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX email_queue_jobs_status_idx ON email_queue_jobs(status);
CREATE INDEX email_queue_jobs_next_retry_idx ON email_queue_jobs(status, next_retry_at);

-- Extend site_settings with email_enabled
-- (site_settings already exists, just add the column if not present)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add email daily quota setting
INSERT INTO site_settings (id, email_enabled) 
VALUES ('global', true)
ON CONFLICT (id) DO UPDATE SET email_enabled = EXCLUDED.email_enabled;
```

### Drizzle Schema Addition

**File:** `src/db/schema.ts` (additions)

```typescript
export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    emailType: text("email_type").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    status: text("status")
      .$type<"pending" | "sent" | "failed" | "skipped">()
      .notNull()
      .default("pending"),
    provider: text("provider").notNull().default("resend"),
    messageId: text("message_id"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("email_logs_user_id_idx").on(table.userId),
    statusIdx: index("email_logs_status_idx").on(table.status),
    createdAtIdx: index("email_logs_created_at_idx").on(table.createdAt),
    typeStatusIdx: index("email_logs_type_status_idx").on(table.emailType, table.status),
  })
);

export const emailQueueJobs = pgTable(
  "email_queue_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    payload: jsonb("payload").notNull(),
    status: text("status")
      .$type<"pending" | "processing" | "completed" | "failed">()
      .notNull()
      .default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    lastError: text("last_error"),
    nextRetryAt: timestamp("next_retry_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { mode: "date" }),
  },
  (table) => ({
    statusIdx: index("email_queue_jobs_status_idx").on(table.status),
    nextRetryIdx: index("email_queue_jobs_next_retry_idx").on(table.status, table.nextRetryAt),
  })
);
```

---

## 8. File Structure

```
src/
├── services/
│   ├── auth-service.ts          (modify: add instant logout)
│   ├── email-service.ts         (NEW: queue email logic)
│   ├── email-templates.ts       (NEW: HTML templates)
│   ├── email-queue-worker.ts    (NEW: process queue jobs)
│   └── resend-client.ts         (NEW: Resend API wrapper)
├── server/
│   ├── session-cache.ts         (NEW: in-memory session cache)
│   └── email-settings.ts       (NEW: email system settings)
├── app/api/
│   ├── auth/
│   │   ├── bootstrap/route.ts   (modify: minimal payload)
│   │   └── logout/route.ts      (modify: instant response)
│   ├── cron/
│   │   └── email-queue/route.ts (NEW: queue processor)
│   ├── email/
│   │   ├── stats/route.ts       (NEW: email statistics)
│   │   ├── logs/route.ts        (NEW: email logs)
│   │   └── retry/route.ts       (NEW: retry failed)
│   └── admin/
│       └── email-toggle/route.ts (NEW: kill-switch)
├── components/admin/
│   └── email-management-panel.tsx (NEW: admin UI)
├── lib/
│   └── rate-limit.ts            (NEW: login rate limiting)
└── db/
    └── schema.ts                (modify: add email tables)
```

---

## 9. Environment Variables

```env
# Resend.com
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=Showreels.id <noreply@showreels.id>

# Email System
EMAIL_DAILY_QUOTA_LIMIT=90
EMAIL_SYSTEM_ENABLED=true

# Cron Security
CRON_SECRET=your-cron-secret-here

# Redis (Future - when Upstash is ready)
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

---

## 10. Deployment Checklist

### Pre-Deployment

- [ ] Add `RESEND_API_KEY` to Vercel environment
- [ ] Add `RESEND_FROM_EMAIL` to Vercel environment
- [ ] Add `CRON_SECRET` to Vercel environment
- [ ] Run database migration `0018_email_system.sql`
- [ ] Verify `email_enabled` column in `site_settings`
- [ ] Configure Vercel Cron for `/api/cron/email-queue`
- [ ] Test email sending in development
- [ ] Test fail-safe (disable Resend, verify signup still works)

### Vercel Cron Configuration

**File:** `vercel.json` (add)

```json
{
  "crons": [
    {
      "path": "/api/cron/email-queue",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

### Post-Deployment Monitoring

- [ ] Login response time < 300ms
- [ ] Logout response time < 100ms
- [ ] Welcome emails delivering successfully
- [ ] Subscription emails delivering successfully
- [ ] Admin toggle working
- [ ] Failed emails logged correctly
- [ ] Quota tracking accurate

---

## 11. Retry Policy

| Error Type | Retry? | Delay |
|------------|--------|-------|
| Timeout | Yes | 30s → 5min → 30min |
| 429 Rate Limit | No | Skip + log |
| Invalid Email | No | Skip + log |
| Network Error | Yes | 30s → 5min → 30min |
| 500 Server Error | Yes | 30s → 5min → 30min |
| Auth Error (401) | No | Skip + log (bad API key) |

---

## 12. Critical Rules (Engineering Guardrails)

### ❌ NEVER DO THIS

```typescript
// WRONG: Email blocks signup
const user = await createUser(data);
await resend.emails.send(welcomeEmail); // ← If this fails, user creation fails!
return { success: true };
```

### ✅ ALWAYS DO THIS

```typescript
// CORRECT: Email is fire-and-forget
const user = await createUser(data);  // ← Critical transaction
void queueEmail(welcomeEmailJob);     // ← Non-blocking, can fail silently
return { success: true };             // ← User always succeeds
```

### ❌ NEVER DO THIS

```typescript
// WRONG: Logout waits for API
async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/auth/login"; // ← Delayed!
}
```

### ✅ ALWAYS DO THIS

```typescript
// CORRECT: Instant logout
function logout() {
  clearLocalState();
  window.location.href = "/auth/login"; // ← Instant!
  void fetch("/api/auth/logout", { method: "POST" }); // ← Background cleanup
}
```

---

## 13. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Login Speed | < 300ms | Performance API timing |
| Logout Speed | < 100ms (perceived) | Click-to-redirect time |
| Email Delivery Rate | > 95% | email_logs success/total |
| Signup Success (email down) | 100% | Test with Resend disabled |
| Subscription Success (email down) | 100% | Test with quota exceeded |
| Admin Toggle Response | < 200ms | API response time |
| Queue Processing | < 60s latency | Job created → sent time |

---

## 14. Future Improvements (Post-MVP)

1. **Upstash Redis** → Replace in-memory cache with distributed cache
2. **BullMQ** → Replace database queue with proper job queue
3. **Multi-provider fallback** → Resend → SendGrid → Mailgun
4. **Email Templates CMS** → Admin can edit templates without deploy
5. **Real-time queue monitor** → WebSocket-based dashboard
6. **Webhook for email events** → Track opens, clicks, bounces
7. **Scheduled emails** → Reminder emails, re-engagement

---

*Document prepared for implementation. Phase 1 (Fast Auth) should be implemented first, followed by Phase 2 (Email System), then Phase 3 (Admin Panel).*
