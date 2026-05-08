# SQL Migrations untuk Database Cleanup System

## Overview

Dokumen ini berisi semua SQL migrations yang diperlukan untuk implementasi database cleanup system. File-file ini harus dibuat di folder `drizzle/` dan dijalankan secara berurutan.

---

## Migration 0018: Cleanup Logs Table

**File**: `drizzle/0018_cleanup_logs_table.sql`

```sql
-- Migration: 0018_cleanup_logs_table.sql
-- Description: Create cleanup_logs table for tracking database cleanup activities
-- Author: Database Cleanup System
-- Date: 2026-05-08

-- Create cleanup_logs table
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

-- Create indexes for efficient querying
create index idx_cleanup_logs_table_name on cleanup_logs(table_name);
create index idx_cleanup_logs_created_at on cleanup_logs(created_at);
create index idx_cleanup_logs_status on cleanup_logs(status);

-- Add comment
comment on table cleanup_logs is 'Tracks all database cleanup operations for monitoring and auditing';
```

---

## Migration 0019: Cleanup Indexes

**File**: `drizzle/0019_cleanup_indexes.sql`

```sql
-- Migration: 0019_cleanup_indexes.sql
-- Description: Add indexes for cleanup operations performance
-- Author: Database Cleanup System
-- Date: 2026-05-08

-- Index untuk billing_transactions cleanup
create index if not exists idx_billing_transactions_created_at 
  on billing_transactions(created_at);

create index if not exists idx_billing_transactions_status_created 
  on billing_transactions(status, created_at);

-- Verify existing indexes (these should already exist from schema.ts)
-- ✓ visitor_events.created_at (idx: visitor_events_created_at_idx)
-- ✓ admin_notifications.created_at (idx: admin_notifications_created_at_idx)
-- ✓ user_notifications.delivered_at (idx: user_notifications_delivered_at_idx)

-- Add comments
comment on index idx_billing_transactions_created_at is 'Supports time-based cleanup queries';
comment on index idx_billing_transactions_status_created is 'Supports status-based cleanup with date filtering';
```

---

## Migration 0020: Cleanup Functions

**File**: `drizzle/0020_cleanup_functions.sql`

```sql
-- Migration: 0020_cleanup_functions.sql
-- Description: Create all database cleanup functions
-- Author: Database Cleanup System
-- Date: 2026-05-08

-- ============================================================================
-- Function: cleanup_visitor_events
-- Description: Delete visitor events older than 14 days
-- Retention: 14 days
-- ============================================================================
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
  delete from visitor_events
  where created_at < now() - interval '14 days';
  
  get diagnostics v_rows_deleted = row_count;
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  insert into cleanup_logs (
    table_name, cleanup_type, rows_deleted, execution_time_ms, status
  ) values (
    'visitor_events', 'time_based', v_rows_deleted, v_execution_time, 'success'
  );
  
  v_result := jsonb_build_object(
    'table', 'visitor_events',
    'rows_deleted', v_rows_deleted,
    'execution_time_ms', v_execution_time,
    'status', 'success'
  );
  
  return v_result;
  
exception when others then
  insert into cleanup_logs (
    table_name, cleanup_type, rows_deleted, execution_time_ms, status, error_message
  ) values (
    'visitor_events', 'time_based', 0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed', sqlerrm
  );
  
  return jsonb_build_object('table', 'visitor_events', 'status', 'failed', 'error', sqlerrm);
end;
$$;

-- ============================================================================
-- Function: cleanup_visitor_daily_stats
-- Description: Keep only latest 100 rows per path
-- Retention: Max 100 rows per path
-- ============================================================================
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
  for v_path in 
    select distinct path from visitor_daily_stats
  loop
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
  
  insert into cleanup_logs (
    table_name, cleanup_type, rows_deleted, execution_time_ms, status
  ) values (
    'visitor_daily_stats', 'row_limit', v_rows_deleted, v_execution_time, 'success'
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
    table_name, cleanup_type, rows_deleted, execution_time_ms, status, error_message
  ) values (
    'visitor_daily_stats', 'row_limit', 0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed', sqlerrm
  );
  
  return jsonb_build_object('table', 'visitor_daily_stats', 'status', 'failed', 'error', sqlerrm);
end;
$$;

-- ============================================================================
-- Function: cleanup_admin_notifications
-- Description: Delete read admin notifications older than 30 days
-- Retention: 30 days (read only)
-- ============================================================================
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
  delete from admin_notifications
  where is_read = true
  and read_at < now() - interval '30 days';
  
  get diagnostics v_rows_deleted = row_count;
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  insert into cleanup_logs (
    table_name, cleanup_type, rows_deleted, execution_time_ms, status
  ) values (
    'admin_notifications', 'time_based', v_rows_deleted, v_execution_time, 'success'
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
    table_name, cleanup_type, rows_deleted, execution_time_ms, status, error_message
  ) values (
    'admin_notifications', 'time_based', 0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed', sqlerrm
  );
  
  return jsonb_build_object('table', 'admin_notifications', 'status', 'failed', 'error', sqlerrm);
end;
$$;

-- ============================================================================
-- Function: cleanup_user_notifications
-- Description: Delete read user notifications older than 30 days
-- Retention: 30 days (read only)
-- ============================================================================
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
  delete from user_notifications
  where status = 'read'
  and read_at < now() - interval '30 days';
  
  get diagnostics v_rows_deleted = row_count;
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  insert into cleanup_logs (
    table_name, cleanup_type, rows_deleted, execution_time_ms, status
  ) values (
    'user_notifications', 'time_based', v_rows_deleted, v_execution_time, 'success'
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
    table_name, cleanup_type, rows_deleted, execution_time_ms, status, error_message
  ) values (
    'user_notifications', 'time_based', 0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed', sqlerrm
  );
  
  return jsonb_build_object('table', 'user_notifications', 'status', 'failed', 'error', sqlerrm);
end;
$$;

-- ============================================================================
-- Function: cleanup_billing_transactions_expired
-- Description: Delete expired/cancelled/failed transactions older than 90 days
-- Retention: 90 days (expired/cancelled/failed only, keep paid)
-- ============================================================================
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
  delete from billing_transactions
  where status in ('expired', 'cancelled', 'failed')
  and created_at < now() - interval '90 days';
  
  get diagnostics v_rows_deleted = row_count;
  v_execution_time := extract(milliseconds from clock_timestamp() - v_start_time)::integer;
  
  insert into cleanup_logs (
    table_name, cleanup_type, rows_deleted, execution_time_ms, status
  ) values (
    'billing_transactions', 'status_based', v_rows_deleted, v_execution_time, 'success'
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
    table_name, cleanup_type, rows_deleted, execution_time_ms, status, error_message
  ) values (
    'billing_transactions', 'status_based', 0,
    extract(milliseconds from clock_timestamp() - v_start_time)::integer,
    'failed', sqlerrm
  );
  
  return jsonb_build_object('table', 'billing_transactions', 'status', 'failed', 'error', sqlerrm);
end;
$$;

-- ============================================================================
-- Function: run_all_cleanups
-- Description: Execute all cleanup functions in sequence
-- ============================================================================
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
  v_result := cleanup_visitor_events();
  v_results := v_results || jsonb_build_array(v_result);
  v_total_rows := v_total_rows + coalesce((v_result->>'rows_deleted')::integer, 0);
  
  v_result := cleanup_visitor_daily_stats();
  v_results := v_results || jsonb_build_array(v_result);
  v_total_rows := v_total_rows + coalesce((v_result->>'rows_deleted')::integer, 0);
  
  v_result := cleanup_admin_notifications();
  v_results := v_results || jsonb_build_array(v_result);
  v_total_rows := v_total_rows + coalesce((v_result->>'rows_deleted')::integer, 0);
  
  v_result := cleanup_user_notifications();
  v_results := v_results || jsonb_build_array(v_result);
  v_total_rows := v_total_rows + coalesce((v_result->>'rows_deleted')::integer, 0);
  
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

-- ============================================================================
-- Function: get_cleanup_summary
-- Description: Get cleanup statistics for monitoring
-- ============================================================================
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

-- ============================================================================
-- Function: get_table_sizes
-- Description: Monitor table sizes for cleanup effectiveness
-- ============================================================================
create or replace function get_table_sizes()
returns table (
  table_name text,
  total_size text,
  table_size text,
  indexes_size text
)
language sql
as $$
  select 
    t.table_name::text,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(quote_ident(t.table_name)::regclass)) as table_size,
    pg_size_pretty(
      pg_total_relation_size(quote_ident(t.table_name)::regclass) - 
      pg_relation_size(quote_ident(t.table_name)::regclass)
    ) as indexes_size
  from information_schema.tables t
  where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and t.table_name in (
    'visitor_events',
    'visitor_daily_stats',
    'admin_notifications',
    'user_notifications',
    'billing_transactions',
    'cleanup_logs'
  )
  order by pg_total_relation_size(quote_ident(t.table_name)::regclass) desc;
$$;

-- Add comments
comment on function cleanup_visitor_events() is 'Cleanup visitor events older than 14 days';
comment on function cleanup_visitor_daily_stats() is 'Keep only latest 100 rows per path';
comment on function cleanup_admin_notifications() is 'Cleanup read admin notifications older than 30 days';
comment on function cleanup_user_notifications() is 'Cleanup read user notifications older than 30 days';
comment on function cleanup_billing_transactions_expired() is 'Cleanup expired/cancelled/failed transactions older than 90 days';
comment on function run_all_cleanups() is 'Execute all cleanup functions in sequence';
comment on function get_cleanup_summary(integer) is 'Get cleanup statistics for last N days';
comment on function get_table_sizes() is 'Monitor table sizes for cleanup effectiveness';
```

---

## Migration 0021: Cron Jobs Setup

**File**: `drizzle/0021_cleanup_cron_jobs.sql`

```sql
-- Migration: 0021_cleanup_cron_jobs.sql
-- Description: Setup cron jobs for automated cleanup
-- Author: Database Cleanup System
-- Date: 2026-05-08

-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule daily cleanup at 2:00 AM WIB (19:00 UTC previous day)
select cron.schedule(
  'daily-database-cleanup',
  '0 19 * * *',
  $$select run_all_cleanups();$$
);

-- Schedule weekly cleanup for billing transactions (Sunday 4:00 AM WIB = Saturday 21:00 UTC)
select cron.schedule(
  'weekly-billing-cleanup',
  '0 21 * * 6',
  $$select cleanup_billing_transactions_expired();$$
);

-- Add comments
comment on extension pg_cron is 'PostgreSQL job scheduler for automated cleanup tasks';
```

---

## Utility Queries

### Check Scheduled Cron Jobs

```sql
-- View all scheduled cron jobs
select 
  jobid,
  jobname,
  schedule,
  command,
  active
from cron.job
order by jobid;
```

### Check Cron Job History

```sql
-- View recent cron job executions
select 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
from cron.job_run_details
order by start_time desc
limit 20;
```

### Manual Cleanup Execution

```sql
-- Run all cleanups manually
select run_all_cleanups();

-- Run individual cleanup functions
select cleanup_visitor_events();
select cleanup_visitor_daily_stats();
select cleanup_admin_notifications();
select cleanup_user_notifications();
select cleanup_billing_transactions_expired();
```

### Monitoring Queries

```sql
-- Get cleanup summary for last 7 days
select * from get_cleanup_summary(7);

-- Get cleanup summary for last 30 days
select * from get_cleanup_summary(30);

-- Get current table sizes
select * from get_table_sizes();

-- View recent cleanup logs
select 
  table_name,
  cleanup_type,
  rows_deleted,
  execution_time_ms,
  status,
  created_at
from cleanup_logs
order by created_at desc
limit 20;

-- Check for failed cleanups
select * from cleanup_logs
where status = 'failed'
order by created_at desc;
```

### Unschedule Cron Jobs (if needed)

```sql
-- Unschedule daily cleanup
select cron.unschedule('daily-database-cleanup');

-- Unschedule weekly billing cleanup
select cron.unschedule('weekly-billing-cleanup');
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Backup database production
- [ ] Test migrations di staging environment
- [ ] Verify semua foreign key constraints
- [ ] Review retention policies dengan team

### Deployment Steps

1. **Run Migration 0018** - Create cleanup_logs table
   ```sql
   -- Copy paste isi file 0018_cleanup_logs_table.sql ke Supabase SQL Editor
   ```

2. **Run Migration 0019** - Add cleanup indexes
   ```sql
   -- Copy paste isi file 0019_cleanup_indexes.sql ke Supabase SQL Editor
   ```

3. **Run Migration 0020** - Create cleanup functions
   ```sql
   -- Copy paste isi file 0020_cleanup_functions.sql ke Supabase SQL Editor
   ```

4. **Run Migration 0021** - Setup cron jobs
   ```sql
   -- Copy paste isi file 0021_cleanup_cron_jobs.sql ke Supabase SQL Editor
   ```

5. **Test Manual Execution**
   ```sql
   select run_all_cleanups();
   select * from cleanup_logs order by created_at desc;
   ```

6. **Verify Cron Jobs**
   ```sql
   select * from cron.job;
   ```

### Post-Deployment

- [ ] Monitor cleanup_logs untuk 1 minggu
- [ ] Check table sizes weekly
- [ ] Verify no user complaints
- [ ] Review cleanup effectiveness
- [ ] Adjust retention policies jika diperlukan

---

## Rollback Procedure

Jika terjadi masalah:

```sql
-- 1. Unschedule all cron jobs
select cron.unschedule('daily-database-cleanup');
select cron.unschedule('weekly-billing-cleanup');

-- 2. Drop cleanup functions
drop function if exists cleanup_visitor_events();
drop function if exists cleanup_visitor_daily_stats();
drop function if exists cleanup_admin_notifications();
drop function if exists cleanup_user_notifications();
drop function if exists cleanup_billing_transactions_expired();
drop function if exists run_all_cleanups();
drop function if exists get_cleanup_summary(integer);
drop function if exists get_table_sizes();

-- 3. Drop indexes (optional)
drop index if exists idx_billing_transactions_created_at;
drop index if exists idx_billing_transactions_status_created;

-- 4. Drop cleanup_logs table (optional, keep for audit)
-- drop table if exists cleanup_logs;

-- 5. Restore from backup if critical data lost
```

---

## Notes

- Semua SQL files harus dibuat di folder `drizzle/`
- Jalankan migrations secara berurutan (0018 → 0019 → 0020 → 0021)
- Test di staging sebelum production
- Backup database sebelum deployment
- Monitor cleanup_logs setelah deployment
