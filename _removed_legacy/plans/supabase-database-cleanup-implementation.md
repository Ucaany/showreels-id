# Supabase Database Cleanup & Retention Strategy - Implementation Plan

## 📋 Executive Summary

Plan ini mengimplementasikan sistem cleanup database otomatis untuk Showreels.id menggunakan Supabase (PostgreSQL) dengan tujuan:

- ✅ Menjaga database tetap ringan dan efisien
- ✅ Auto-delete data lama yang tidak penting
- ✅ Menghindari table overload
- ✅ Meningkatkan performa query
- ✅ Mengurangi storage cost

---

## 🎯 Scope & Objectives

### Primary Goals
1. Implementasi retention-based cleanup (hapus berdasarkan umur)
2. Implementasi row-limit cleanup (batasi jumlah row)
3. Setup automated cron jobs
4. Optimasi index untuk performa cleanup
5. Logging & monitoring system

### Out of Scope (Future Enhancement)
- Archive system untuk data historical
- Monitoring dashboard UI
- Advanced analytics cleanup

---

## 📊 Current Database Analysis

### Tables yang Ada (dari schema.ts)

#### **Critical Tables - JANGAN Auto-Delete**
```
✗ users
✗ videos
✗ billing_subscriptions
✗ billing_transactions (kecuali expired/cancelled lama)
✗ creator_settings
✗ user_onboarding
✗ site_settings
```

#### **Temporary/Analytics Tables - AMAN untuk Auto-Clean**
```
✓ visitor_events (analytics)
✓ visitor_daily_stats (aggregated stats)
✓ admin_notifications (read notifications)
✓ user_notifications (read notifications)
✓ billing_transactions (expired/cancelled saja)
```

---

## 🗂️ Retention Policy

| Table | Strategy | Retention | Reason |
|-------|----------|-----------|--------|
| `visitor_events` | Time-based | 14 hari | Raw analytics, sudah di-aggregate ke daily stats |
| `visitor_daily_stats` | Row-limit | 100 rows per path | Cukup untuk 3 bulan data |
| `admin_notifications` | Time-based | 30 hari (read only) | Notifikasi lama tidak relevan |
| `user_notifications` | Time-based | 30 hari (read only) | User jarang buka notif lama |
| `billing_transactions` | Time-based | 90 hari (expired/cancelled) | Keep paid transactions |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Supabase PostgreSQL                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────────────────────┐    │
│  │  pg_cron     │─────▶│  Cleanup Functions           │    │
│  │  Extension   │      │  - cleanup_visitor_events()  │    │
│  │              │      │  - cleanup_daily_stats()     │    │
│  │  Schedule:   │      │  - cleanup_notifications()   │    │
│  │  Daily 2-4AM │      │  - cleanup_transactions()    │    │
│  └──────────────┘      └──────────────────────────────┘    │
│                                    │                          │
│                                    ▼                          │
│                        ┌──────────────────────┐              │
│                        │  cleanup_logs table  │              │
│                        │  (tracking & audit)  │              │
│                        └──────────────────────┘              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Steps

### Phase 1: Database Preparation

#### 1.1 Create Cleanup Logs Table

```sql
-- Migration: 0018_cleanup_logs_table.sql
create table if not exists cleanup_logs (
  id text primary key default gen_random_uuid()::text,
  table_name text not null,
  cleanup_type text not null, -- 'time_based' | 'row_limit' | 'status_based'
  rows_deleted integer not null default 0,
  execution_time_ms integer not null default 0,
  status text not null default 'success', -- 'success' | 'failed'
  error_message text,
  created_at timestamp not null default now()
);

create index idx_cleanup_logs_table_name on cleanup_logs(table_name);
create index idx_cleanup_logs_created_at on cleanup_logs(created_at);
create index idx_cleanup_logs_status on cleanup_logs(status);
```

#### 1.2 Add Missing Indexes

```sql
-- Migration: 0019_cleanup_indexes.sql

-- Index untuk billing_transactions cleanup
create index if not exists idx_billing_transactions_created_at 
  on billing_transactions(created_at);

create index if not exists idx_billing_transactions_status_created 
  on billing_transactions(status, created_at);

-- Verify existing indexes (sudah ada di schema)
-- ✓ visitor_events.created_at
-- ✓ admin_notifications.created_at
-- ✓ user_notifications.delivered_at
```

---

### Phase 2: Cleanup Functions

#### 2.1 Cleanup Visitor Events (Time-Based)

```sql
-- Function: cleanup_visitor_events
-- Retention: 14 hari
-- Schedule: Daily 2:00 AM

create or replace function cleanup_visitor_events()
returns jsonb
language plpgsql
as $$
declare
  v_start_time timestamp := clock_timestamp();
  v_rows_deleted integer := 0;
  v_execution_time integer;
  v_result jsonb;
begin
  -- Delete events older than 14 days
  delete from visitor_events
  where created_at < now() - interval '14 days';
  
  get diagnostics v_rows_deleted = row_count;
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  -- Log cleanup activity
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status
  ) values (
    'visitor_events',
    'time_based',
    v_rows_deleted,
    v_execution_time,
    'success'
  );
  
  v_result := jsonb_build_object(
    'table', 'visitor_events',
    'rows_deleted', v_rows_deleted,
    'execution_time_ms', v_execution_time,
    'status', 'success'
  );
  
  return v_result;
  
exception when others then
  -- Log error
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status,
    error_message
  ) values (
    'visitor_events',
    'time_based',
    0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed',
    sqlerrm
  );
  
  return jsonb_build_object(
    'table', 'visitor_events',
    'status', 'failed',
    'error', sqlerrm
  );
end;
$$;
```

#### 2.2 Cleanup Visitor Daily Stats (Row-Limit)

```sql
-- Function: cleanup_visitor_daily_stats
-- Retention: Max 100 rows per path
-- Schedule: Daily 2:30 AM

create or replace function cleanup_visitor_daily_stats()
returns jsonb
language plpgsql
as $$
declare
  v_start_time timestamp := clock_timestamp();
  v_rows_deleted integer := 0;
  v_execution_time integer;
  v_result jsonb;
  v_path text;
begin
  -- Loop through each unique path
  for v_path in 
    select distinct path from visitor_daily_stats
  loop
    -- Keep only the latest 100 records per path
    delete from visitor_daily_stats
    where path = v_path
    and day in (
      select day
      from visitor_daily_stats
      where path = v_path
      order by day desc
      offset 100
    );
    
    get diagnostics v_rows_deleted = v_rows_deleted + row_count;
  end loop;
  
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  -- Log cleanup activity
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status
  ) values (
    'visitor_daily_stats',
    'row_limit',
    v_rows_deleted,
    v_execution_time,
    'success'
  );
  
  v_result := jsonb_build_object(
    'table', 'visitor_daily_stats',
    'rows_deleted', v_rows_deleted,
    'execution_time_ms', v_execution_time,
    'status', 'success'
  );
  
  return v_result;
  
exception when others then
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status,
    error_message
  ) values (
    'visitor_daily_stats',
    'row_limit',
    0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed',
    sqlerrm
  );
  
  return jsonb_build_object(
    'table', 'visitor_daily_stats',
    'status', 'failed',
    'error', sqlerrm
  );
end;
$$;
```

#### 2.3 Cleanup Admin Notifications (Time-Based, Read Only)

```sql
-- Function: cleanup_admin_notifications
-- Retention: 30 hari (read notifications only)
-- Schedule: Daily 3:00 AM

create or replace function cleanup_admin_notifications()
returns jsonb
language plpgsql
as $$
declare
  v_start_time timestamp := clock_timestamp();
  v_rows_deleted integer := 0;
  v_execution_time integer;
  v_result jsonb;
begin
  -- Delete read notifications older than 30 days
  delete from admin_notifications
  where is_read = true
  and read_at < now() - interval '30 days';
  
  get diagnostics v_rows_deleted = row_count;
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status
  ) values (
    'admin_notifications',
    'time_based',
    v_rows_deleted,
    v_execution_time,
    'success'
  );
  
  v_result := jsonb_build_object(
    'table', 'admin_notifications',
    'rows_deleted', v_rows_deleted,
    'execution_time_ms', v_execution_time,
    'status', 'success'
  );
  
  return v_result;
  
exception when others then
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status,
    error_message
  ) values (
    'admin_notifications',
    'time_based',
    0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed',
    sqlerrm
  );
  
  return jsonb_build_object(
    'table', 'admin_notifications',
    'status', 'failed',
    'error', sqlerrm
  );
end;
$$;
```

#### 2.4 Cleanup User Notifications (Time-Based, Read Only)

```sql
-- Function: cleanup_user_notifications
-- Retention: 30 hari (read notifications only)
-- Schedule: Daily 3:30 AM

create or replace function cleanup_user_notifications()
returns jsonb
language plpgsql
as $$
declare
  v_start_time timestamp := clock_timestamp();
  v_rows_deleted integer := 0;
  v_execution_time integer;
  v_result jsonb;
begin
  -- Delete read notifications older than 30 days
  delete from user_notifications
  where status = 'read'
  and read_at < now() - interval '30 days';
  
  get diagnostics v_rows_deleted = row_count;
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status
  ) values (
    'user_notifications',
    'time_based',
    v_rows_deleted,
    v_execution_time,
    'success'
  );
  
  v_result := jsonb_build_object(
    'table', 'user_notifications',
    'rows_deleted', v_rows_deleted,
    'execution_time_ms', v_execution_time,
    'status', 'success'
  );
  
  return v_result;
  
exception when others then
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status,
    error_message
  ) values (
    'user_notifications',
    'time_based',
    0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed',
    sqlerrm
  );
  
  return jsonb_build_object(
    'table', 'user_notifications',
    'status', 'failed',
    'error', sqlerrm
  );
end;
$$;
```

#### 2.5 Cleanup Billing Transactions (Expired/Cancelled Only)

```sql
-- Function: cleanup_billing_transactions_expired
-- Retention: 90 hari (expired/cancelled only, keep paid)
-- Schedule: Weekly Sunday 4:00 AM

create or replace function cleanup_billing_transactions_expired()
returns jsonb
language plpgsql
as $$
declare
  v_start_time timestamp := clock_timestamp();
  v_rows_deleted integer := 0;
  v_execution_time integer;
  v_result jsonb;
begin
  -- Delete expired/cancelled transactions older than 90 days
  -- Keep all 'paid' transactions for accounting
  delete from billing_transactions
  where status in ('expired', 'cancelled', 'failed')
  and created_at < now() - interval '90 days';
  
  get diagnostics v_rows_deleted = row_count;
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status
  ) values (
    'billing_transactions',
    'status_based',
    v_rows_deleted,
    v_execution_time,
    'success'
  );
  
  v_result := jsonb_build_object(
    'table', 'billing_transactions',
    'rows_deleted', v_rows_deleted,
    'execution_time_ms', v_execution_time,
    'status', 'success'
  );
  
  return v_result;
  
exception when others then
  insert into cleanup_logs (
    table_name,
    cleanup_type,
    rows_deleted,
    execution_time_ms,
    status,
    error_message
  ) values (
    'billing_transactions',
    'status_based',
    0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed',
    sqlerrm
  );
  
  return jsonb_build_object(
    'table', 'billing_transactions',
    'status', 'failed',
    'error', sqlerrm
  );
end;
$$;
```

#### 2.6 Master Cleanup Function (Run All)

```sql
-- Function: run_all_cleanups
-- Menjalankan semua cleanup functions sekaligus
-- Schedule: Daily 2:00 AM

create or replace function run_all_cleanups()
returns jsonb
language plpgsql
as $$
declare
  v_start_time timestamp := clock_timestamp();
  v_results jsonb := '[]'::jsonb;
  v_result jsonb;
  v_total_rows integer := 0;
  v_execution_time integer;
begin
  -- Run all cleanup functions
  v_result := cleanup_visitor_events();
  v_results := v_results || jsonb_build_array(v_result);
  v_total_rows := v_total_rows + (v_result->>'rows_deleted')::integer;
  
  v_result := cleanup_visitor_daily_stats();
  v_results := v_results || jsonb_build_array(v_result);
  v_total_rows := v_total_rows + (v_result->>'rows_deleted')::integer;
  
  v_result := cleanup_admin_notifications();
  v_results := v_results || jsonb_build_array(v_result);
  v_total_rows := v_total_rows + (v_result->>'rows_deleted')::integer;
  
  v_result := cleanup_user_notifications();
  v_results := v_results || jsonb_build_array(v_result);
  v_total_rows := v_total_rows + (v_result->>'rows_deleted')::integer;
  
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  return jsonb_build_object(
    'status', 'completed',
    'total_rows_deleted', v_total_rows,
    'total_execution_time_ms', v_execution_time,
    'results', v_results
  );
  
exception when others then
  return jsonb_build_object(
    'status', 'failed',
    'error', sqlerrm,
    'partial_results', v_results
  );
end;
$$;
```

---

### Phase 3: Cron Jobs Setup

#### 3.1 Enable pg_cron Extension

```sql
-- Run di Supabase SQL Editor
create extension if not exists pg_cron;
```

#### 3.2 Schedule Daily Cleanup Jobs

```sql
-- Daily cleanup at 2:00 AM (WIB = UTC+7, so 19:00 UTC previous day)
select cron.schedule(
  'daily-database-cleanup',
  '0 19 * * *',  -- 2:00 AM WIB = 19:00 UTC
  $$select run_all_cleanups();$$
);

-- Weekly cleanup for billing transactions (Sunday 4:00 AM WIB = 21:00 UTC Saturday)
select cron.schedule(
  'weekly-billing-cleanup',
  '0 21 * * 6',  -- Saturday 21:00 UTC = Sunday 4:00 AM WIB
  $$select cleanup_billing_transactions_expired();$$
);
```

#### 3.3 View Scheduled Jobs

```sql
-- Check scheduled cron jobs
select * from cron.job;

-- Check cron job run history
select * from cron.job_run_details
order by start_time desc
limit 20;
```

#### 3.4 Unschedule Jobs (if needed)

```sql
-- Unschedule a job
select cron.unschedule('daily-database-cleanup');
select cron.unschedule('weekly-billing-cleanup');
```

---

### Phase 4: Monitoring & Utilities

#### 4.1 Get Cleanup Summary

```sql
-- Function: get_cleanup_summary
-- Get cleanup statistics for last N days

create or replace function get_cleanup_summary(days_back integer default 7)
returns table (
  table_name text,
  total_runs bigint,
  total_rows_deleted bigint,
  avg_execution_time_ms numeric,
  success_rate numeric,
  last_run timestamp
) 
language sql
as $$
  select 
    cl.table_name,
    count(*) as total_runs,
    sum(cl.rows_deleted) as total_rows_deleted,
    round(avg(cl.execution_time_ms), 2) as avg_execution_time_ms,
    round(
      (count(*) filter (where cl.status = 'success')::numeric / count(*)::numeric) * 100,
      2
    ) as success_rate,
    max(cl.created_at) as last_run
  from cleanup_logs cl
  where cl.created_at >= now() - make_interval(days => days_back)
  group by cl.table_name
  order by cl.table_name;
$$;

-- Usage:
-- select * from get_cleanup_summary(7);  -- Last 7 days
-- select * from get_cleanup_summary(30); -- Last 30 days
```

#### 4.2 Manual Cleanup Trigger

```sql
-- Manual trigger untuk testing atau emergency cleanup
select run_all_cleanups();

-- Or run individual cleanup
select cleanup_visitor_events();
select cleanup_visitor_daily_stats();
select cleanup_admin_notifications();
select cleanup_user_notifications();
select cleanup_billing_transactions_expired();
```

#### 4.3 Check Table Sizes

```sql
-- Function: get_table_sizes
-- Monitor table sizes untuk tracking cleanup effectiveness

create or replace function get_table_sizes()
returns table (
  table_name text,
  row_count bigint,
  total_size text,
  table_size text,
  indexes_size text
)
language plpgsql
as $$
begin
  return query
  select 
    t.table_name::text,
    (select count(*) from information_schema.tables where table_name = t.table_name)::bigint as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(quote_ident(t.table_name)::regclass)) as table_size,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass) - pg_relation_size(quote_ident(t.table_name)::regclass)) as indexes_size
  from information_schema.tables t
  where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and t.table_name in (
    'visitor_events',
    'visitor_daily_stats',
    'admin_notifications',
    'user_notifications',
    'billing_transactions'
  )
  order by pg_total_relation_size(quote_ident(t.table_name)::regclass) desc;
end;
$$;

-- Usage:
-- select * from get_table_sizes();
```

---

## 🧪 Testing Plan

### Pre-Production Testing

#### 1. Create Test Data

```sql
-- Insert test visitor events (old data)
insert into visitor_events (visitor_id, path, created_at)
select 
  'test-visitor-' || generate_series,
  '/test-path',
  now() - interval '20 days' + (random() * interval '10 days')
from generate_series(1, 1000);

-- Insert test notifications (old read notifications)
insert into admin_notifications (title, message, is_read, read_at, created_at)
select 
  'Test Notification ' || generate_series,
  'Test message',
  true,
  now() - interval '40 days',
  now() - interval '40 days'
from generate_series(1, 500);
```

#### 2. Run Cleanup Functions

```sql
-- Test individual functions
select cleanup_visitor_events();
select cleanup_admin_notifications();

-- Check results
select * from cleanup_logs order by created_at desc limit 10;
```

#### 3. Verify Data Integrity

```sql
-- Verify no critical data deleted
select count(*) from users;
select count(*) from videos;
select count(*) from billing_subscriptions;
select count(*) from billing_transactions where status = 'paid';

-- Verify old data removed
select count(*) from visitor_events where created_at < now() - interval '14 days';
-- Should be 0

select count(*) from admin_notifications 
where is_read = true and read_at < now() - interval '30 days';
-- Should be 0
```

---

## 📁 File Structure

```
showreels-id-main/
├── drizzle/
│   ├── 0018_cleanup_logs_table.sql
│   ├── 0019_cleanup_indexes.sql
│   ├── 0020_cleanup_functions.sql
│   └── 0021_cleanup_cron_jobs.sql
│
├── supabase/
│   ├── functions/
│   │   ├── cleanup_visitor_events.sql
│   │   ├── cleanup_visitor_daily_stats.sql
│   │   ├── cleanup_admin_notifications.sql
│   │   ├── cleanup_user_notifications.sql
│   │   ├── cleanup_billing_transactions.sql
│   │   └── run_all_cleanups.sql
│   │
│   ├── utilities/
│   │   ├── get_cleanup_summary.sql
│   │   ├── get_table_sizes.sql
│   │   └── manual_cleanup_trigger.sql
│   │
│   └── cron/
│       ├── schedule_daily_cleanup.sql
│       └── schedule_weekly_cleanup.sql
│
└── docs/
    ├── cleanup-runbook.md
    └── cleanup-monitoring-guide.md
```

---

## ⚠️ Safety Checklist

### Before Production Deployment

- [ ] **BACKUP DATABASE** - Full backup sebelum deploy
- [ ] Test di staging environment dengan data production-like
- [ ] Verify semua foreign key constraints
- [ ] Verify index performance dengan EXPLAIN ANALYZE
- [ ] Setup monitoring alerts untuk cleanup failures
- [ ] Document rollback procedure
- [ ] Inform team tentang maintenance window
- [ ] Setup Slack/email notification untuk cleanup errors

### During Deployment

- [ ] Deploy di off-peak hours (2-4 AM)
- [ ] Monitor database CPU & memory usage
- [ ] Monitor query performance
- [ ] Check cleanup_logs untuk errors
- [ ] Verify cron jobs scheduled correctly

### After Deployment

- [ ] Monitor cleanup_logs daily untuk 1 minggu
- [ ] Check table sizes weekly
- [ ] Verify no user complaints tentang missing data
- [ ] Review cleanup effectiveness (storage reduction)
- [ ] Adjust retention policies jika diperlukan

---

## 📊 Expected Results

### Storage Reduction
- **visitor_events**: ~70% reduction (keep 14 days vs unlimited)
- **visitor_daily_stats**: ~50% reduction (100 rows vs unlimited)
- **admin_notifications**: ~40% reduction (remove old read)
- **user_notifications**: ~40% reduction (remove old read)
- **billing_transactions**: ~30% reduction (remove expired/cancelled)

### Performance Improvement
- Query speed: 20-40% faster pada analytics queries
- Index efficiency: Better index hit ratio
- Backup time: 30-50% faster
- Storage cost: 40-60% reduction

### Maintenance Benefits
- Auto-cleanup: Zero manual intervention
- Predictable growth: Database size stays stable
- Better monitoring: Clear visibility via cleanup_logs
- Easier debugging: Less noise in tables

---

## 🔄 Rollback Plan

### If Cleanup Causes Issues

```sql
-- 1. Immediately unschedule all cron jobs
select cron.unschedule('daily-database-cleanup');
select cron.unschedule('weekly-billing-cleanup');

-- 2. Check what was deleted
select * from cleanup_logs 
where created_at >= now() - interval '1 day'
order by created_at desc;

-- 3. Restore from backup if critical data lost
-- (Use Supabase backup restore feature)

-- 4. Disable cleanup functions temporarily
alter function cleanup_visitor_events() rename to cleanup_visitor_events_disabled;
alter function run_all_cleanups() rename to run_all_cleanups_disabled;
```

---

## 📈 Future Enhancements

### Phase 2 (Optional)

1. **Archive System**
   - Move old data to archive tables instead of delete
   - Keep historical data for analytics

2. **Monitoring Dashboard**
   - Real-time cleanup status
   - Storage usage trends
   - Alert system for failures

3. **Advanced Cleanup Rules**
   - User-specific retention policies
   - Dynamic retention based on plan tier
   - Soft delete for critical tables

4. **Performance Optimization**
   - Partitioning untuk large tables
   - Parallel cleanup execution
   - Incremental cleanup (batch processing)

---

## 📞 Support & Maintenance

### Monitoring Commands

```sql
-- Daily health check
select * from get_cleanup_summary(1);
select * from get_table_sizes();

-- Check recent cleanup runs
select * from cleanup_logs 
where created_at >= now() - interval '7 days'
order by created_at desc;

-- Check cron job status
select * from cron.job_run_details
where end_time >= now() - interval '7 days'
order by start_time desc;
```

### Troubleshooting

**Problem**: Cleanup not running
```sql
-- Check cron jobs
select * from cron.job;

-- Check for errors
select * from cleanup_logs where status = 'failed';
```

**Problem**: Too much data deleted
```sql
-- Check cleanup logs
select * from cleanup_logs 
where rows_deleted > 10000
order by created_at desc;

-- Adjust retention if needed (example: increase from 14 to 30 days)
-- Edit function and redeploy
```

**Problem**: Performance degradation
```sql
-- Check slow queries
select * from pg_stat_statements
where query like '%cleanup%'
order by total_exec_time desc;

-- Analyze tables
analyze visitor_events;
analyze visitor_daily_stats;
```

---

## ✅ Success Criteria

- [ ] All cleanup functions deployed and tested
- [ ] Cron jobs running on schedule
- [ ] Zero critical data loss
- [ ] Storage reduction > 40%
- [ ] Query performance improved > 20%
- [ ] No user complaints
- [ ] Cleanup logs showing consistent success
- [ ] Team trained on monitoring procedures

---

## 📝 Notes

- Semua timestamps menggunakan UTC di database
- Cron schedule disesuaikan dengan timezone WIB (UTC+7)
- Cleanup berjalan di off-peak hours (2-4 AM WIB)
- Paid transactions TIDAK PERNAH dihapus (accounting requirement)
- Unread notifications TIDAK dihapus (user experience)
- Backup dilakukan sebelum setiap major cleanup

---

**Last Updated**: 2026-05-08  
**Version**: 1.0  
**Status**: Ready for Implementation
