# Database Cleanup - Quick Start Guide

## 🚀 Implementasi Cepat (30 Menit)

Panduan ini untuk implementasi database cleanup system dari nol sampai production-ready.

---

## ✅ Prerequisites

- [ ] Access ke Supabase Dashboard
- [ ] Access ke SQL Editor
- [ ] Backup database sudah dibuat
- [ ] Staging environment tersedia untuk testing

---

## 📋 Step-by-Step Implementation

### Step 1: Backup Database (5 menit)

**Via Supabase Dashboard:**
1. Login ke Supabase Dashboard
2. Pilih project Showreels.id
3. Go to **Database** → **Backups**
4. Click **Create Backup**
5. Wait sampai backup selesai
6. Download backup file (optional, untuk local backup)

**Verify Backup:**
```sql
-- Check backup status
select * from pg_stat_database where datname = current_database();
```

---

### Step 2: Create Cleanup Logs Table (2 menit)

**Copy-paste ke Supabase SQL Editor:**

```sql
-- Migration: 0018_cleanup_logs_table.sql
create table if not exists cleanup_logs (
  id text primary key default gen_random_uuid()::text,
  table_name text not null,
  cleanup_type text not null,
  rows_deleted integer not null default 0,
  execution_time_ms integer not null default 0,
  status text not null default 'success',
  error_message text,
  created_at timestamp not null default now()
);

create index idx_cleanup_logs_table_name on cleanup_logs(table_name);
create index idx_cleanup_logs_created_at on cleanup_logs(created_at);
create index idx_cleanup_logs_status on cleanup_logs(status);

comment on table cleanup_logs is 'Tracks all database cleanup operations';
```

**Verify:**
```sql
select * from cleanup_logs;
-- Should return empty table (no errors)
```

---

### Step 3: Add Cleanup Indexes (2 menit)

```sql
-- Migration: 0019_cleanup_indexes.sql
create index if not exists idx_billing_transactions_created_at 
  on billing_transactions(created_at);

create index if not exists idx_billing_transactions_status_created 
  on billing_transactions(status, created_at);
```

**Verify:**
```sql
select 
  tablename,
  indexname
from pg_indexes
where tablename = 'billing_transactions'
and indexname like 'idx_billing%';
-- Should show 2 new indexes
```

---

### Step 4: Create Cleanup Functions (5 menit)

**⚠️ Important**: Copy-paste SEMUA functions sekaligus ke SQL Editor.

Buka file: [`supabase-cleanup-sql-migrations.md`](./supabase-cleanup-sql-migrations.md)

Copy section **"Migration 0020: Cleanup Functions"** (semua functions dari `cleanup_visitor_events` sampai `get_table_sizes`)

Paste ke SQL Editor dan Run.

**Verify:**
```sql
-- Check if functions created
select 
  routine_name,
  routine_type
from information_schema.routines
where routine_name like 'cleanup%'
or routine_name like 'get_%'
order by routine_name;

-- Should show:
-- cleanup_admin_notifications
-- cleanup_billing_transactions_expired
-- cleanup_user_notifications
-- cleanup_visitor_daily_stats
-- cleanup_visitor_events
-- get_cleanup_summary
-- get_table_sizes
-- run_all_cleanups
```

---

### Step 5: Test Manual Cleanup (5 menit)

**Test dengan data dummy:**

```sql
-- Insert test data (old visitor events)
insert into visitor_events (visitor_id, path, created_at)
values 
  ('test-1', '/test', now() - interval '20 days'),
  ('test-2', '/test', now() - interval '25 days'),
  ('test-3', '/test', now() - interval '30 days');

-- Check test data inserted
select count(*) from visitor_events where visitor_id like 'test-%';
-- Should return 3

-- Run cleanup
select cleanup_visitor_events();

-- Verify cleanup worked
select count(*) from visitor_events where visitor_id like 'test-%';
-- Should return 0 (all deleted because > 14 days old)

-- Check cleanup logs
select * from cleanup_logs order by created_at desc limit 1;
-- Should show successful cleanup with rows_deleted = 3
```

**Test all cleanups:**
```sql
select run_all_cleanups();

-- Check results
select * from cleanup_logs order by created_at desc limit 5;
```

---

### Step 6: Enable pg_cron Extension (2 menit)

```sql
-- Enable pg_cron
create extension if not exists pg_cron;

-- Verify
select * from pg_extension where extname = 'pg_cron';
-- Should return 1 row
```

---

### Step 7: Schedule Cron Jobs (3 menit)

```sql
-- Daily cleanup at 2:00 AM WIB (19:00 UTC)
select cron.schedule(
  'daily-database-cleanup',
  '0 19 * * *',
  $$select run_all_cleanups();$$
);

-- Weekly billing cleanup (Sunday 4:00 AM WIB = Saturday 21:00 UTC)
select cron.schedule(
  'weekly-billing-cleanup',
  '0 21 * * 6',
  $$select cleanup_billing_transactions_expired();$$
);
```

**Verify:**
```sql
select 
  jobid,
  jobname,
  schedule,
  active
from cron.job
order by jobid;

-- Should show 2 jobs:
-- daily-database-cleanup (0 19 * * *)
-- weekly-billing-cleanup (0 21 * * 6)
```

---

### Step 8: Monitor First Run (5 menit)

**Wait for first cron run** (atau trigger manual):

```sql
-- Trigger manual untuk test
select run_all_cleanups();

-- Check cron job history
select 
  jobname,
  status,
  return_message,
  start_time,
  end_time
from cron.job_run_details
order by start_time desc
limit 5;
```

**Check cleanup summary:**
```sql
select * from get_cleanup_summary(1);
```

**Check table sizes:**
```sql
select * from get_table_sizes();
```

---

### Step 9: Setup Monitoring (5 menit)

**Create monitoring queries bookmark:**

1. **Daily Health Check**
   ```sql
   select * from get_cleanup_summary(1);
   ```

2. **Check Failed Cleanups**
   ```sql
   select * from cleanup_logs 
   where status = 'failed' 
   and created_at >= now() - interval '7 days'
   order by created_at desc;
   ```

3. **Check Table Sizes**
   ```sql
   select * from get_table_sizes();
   ```

**Save these queries** di Supabase SQL Editor favorites.

---

### Step 10: Documentation & Handoff (5 menit)

- [ ] Update team wiki dengan link ke runbook
- [ ] Share monitoring queries dengan team
- [ ] Setup Slack notification (optional)
- [ ] Schedule weekly review meeting
- [ ] Document retention policies di team docs

---

## 🎉 Implementation Complete!

Cleanup system sekarang aktif dan berjalan otomatis.

---

## 📊 What Happens Next?

### Daily (Automatic)
- **2:00 AM WIB**: Cleanup runs automatically
  - visitor_events (> 14 days deleted)
  - visitor_daily_stats (keep 100 rows per path)
  - admin_notifications (read > 30 days deleted)
  - user_notifications (read > 30 days deleted)

### Weekly (Automatic)
- **Sunday 4:00 AM WIB**: Billing cleanup runs
  - billing_transactions (expired/cancelled > 90 days deleted)

### Manual (You)
- **Daily**: Check cleanup logs untuk errors
- **Weekly**: Review cleanup summary
- **Monthly**: Review retention policies

---

## 🔍 Quick Verification Checklist

Run these queries untuk verify everything working:

```sql
-- 1. Check cleanup functions exist
select count(*) from information_schema.routines 
where routine_name like 'cleanup%';
-- Should return 5

-- 2. Check cron jobs scheduled
select count(*) from cron.job;
-- Should return 2

-- 3. Check cleanup logs table exists
select count(*) from cleanup_logs;
-- Should return >= 0 (no error)

-- 4. Check indexes created
select count(*) from pg_indexes 
where indexname like 'idx_billing_transactions%';
-- Should return 2

-- 5. Test manual cleanup
select run_all_cleanups();
-- Should return JSON with status: completed
```

**All checks passed?** ✅ You're good to go!

---

## 🚨 Troubleshooting

### Issue: "extension pg_cron does not exist"

**Solution:**
```sql
create extension if not exists pg_cron;
```

If still fails, contact Supabase support (pg_cron might not be enabled on your plan).

---

### Issue: "function cleanup_visitor_events() does not exist"

**Solution:**
Re-run Step 4 (Create Cleanup Functions). Make sure copy-paste SEMUA functions.

---

### Issue: Cron jobs not running

**Check:**
```sql
select * from cron.job_run_details order by start_time desc limit 5;
```

If empty, cron might not be triggered yet (wait for scheduled time or trigger manual).

---

### Issue: Cleanup deleting too much data

**Immediate action:**
```sql
-- Unschedule cron jobs
select cron.unschedule('daily-database-cleanup');
select cron.unschedule('weekly-billing-cleanup');
```

Then review retention policies dan adjust functions.

---

## 📞 Need Help?

1. **Check Runbook**: [`database-cleanup-runbook.md`](./database-cleanup-runbook.md)
2. **Check SQL Migrations**: [`supabase-cleanup-sql-migrations.md`](./supabase-cleanup-sql-migrations.md)
3. **Check Implementation Plan**: [`supabase-database-cleanup-implementation.md`](./supabase-database-cleanup-implementation.md)
4. **Escalate to Developer** if functions failing
5. **Escalate to DevOps** if cron jobs not working

---

## 📚 Next Steps

After implementation:

1. **Week 1**: Monitor daily, check for errors
2. **Week 2**: Review cleanup effectiveness
3. **Week 3**: Adjust retention policies if needed
4. **Week 4**: Document lessons learned

---

## 🎯 Success Metrics

After 1 month, you should see:

- ✅ Zero cleanup failures
- ✅ 40-60% storage reduction
- ✅ 20-40% faster queries
- ✅ Stable table sizes
- ✅ No user complaints about missing data

---

**Congratulations!** 🎊

Database cleanup system berhasil diimplementasikan.

---

**Quick Start Guide Version**: 1.0  
**Last Updated**: 2026-05-08  
**Estimated Time**: 30 minutes  
**Difficulty**: Intermediate
