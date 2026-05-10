# Database Cleanup Runbook

## 📖 Overview

Runbook ini adalah panduan operasional untuk mengelola dan memonitor sistem database cleanup otomatis di Showreels.id.

---

## 🎯 Quick Reference

### Daily Tasks
- Check cleanup logs untuk errors
- Monitor table sizes

### Weekly Tasks
- Review cleanup summary
- Check storage reduction
- Verify cron job health

### Monthly Tasks
- Review retention policies
- Analyze cleanup effectiveness
- Update documentation jika ada perubahan

---

## 🔍 Monitoring

### 1. Check Cleanup Status (Daily)

```sql
-- Quick health check - jalankan setiap pagi
select * from get_cleanup_summary(1);
```

**Expected Output:**
```
table_name              | total_runs | total_rows_deleted | avg_execution_time_ms | success_rate | last_run
------------------------|------------|--------------------|-----------------------|--------------|-------------------
admin_notifications     | 1          | 15                 | 45.23                 | 100.00       | 2026-05-08 02:00:00
user_notifications      | 1          | 32                 | 67.89                 | 100.00       | 2026-05-08 02:00:00
visitor_daily_stats     | 1          | 8                  | 123.45                | 100.00       | 2026-05-08 02:00:00
visitor_events          | 1          | 1250               | 234.56                | 100.00       | 2026-05-08 02:00:00
```

**What to Look For:**
- ✅ `success_rate` harus 100%
- ✅ `last_run` harus hari ini (atau kemarin jika cek pagi)
- ⚠️ Jika `success_rate` < 100%, check error logs
- ⚠️ Jika `last_run` > 2 hari, cron job mungkin tidak jalan

---

### 2. Check for Failed Cleanups

```sql
-- Check failed cleanups in last 7 days
select 
  table_name,
  cleanup_type,
  error_message,
  created_at
from cleanup_logs
where status = 'failed'
and created_at >= now() - interval '7 days'
order by created_at desc;
```

**If Errors Found:**
1. Copy error message
2. Check table structure (apakah ada perubahan schema?)
3. Check foreign key constraints
4. Run manual cleanup untuk test
5. Escalate ke developer jika perlu

---

### 3. Monitor Table Sizes (Weekly)

```sql
-- Check table sizes
select * from get_table_sizes();
```

**Expected Output:**
```
table_name              | total_size | table_size | indexes_size
------------------------|------------|------------|-------------
visitor_events          | 2.5 MB     | 1.8 MB     | 700 KB
visitor_daily_stats     | 1.2 MB     | 800 KB     | 400 KB
admin_notifications     | 500 KB     | 350 KB     | 150 KB
user_notifications      | 800 KB     | 600 KB     | 200 KB
billing_transactions    | 3.5 MB     | 2.8 MB     | 700 KB
cleanup_logs            | 100 KB     | 80 KB      | 20 KB
```

**What to Look For:**
- ✅ Table sizes harus stabil atau menurun
- ⚠️ Jika table size terus naik, cleanup mungkin tidak efektif
- ⚠️ Jika indexes_size > table_size, consider reindex

---

### 4. Check Cron Job Status

```sql
-- View scheduled cron jobs
select 
  jobid,
  jobname,
  schedule,
  active,
  database
from cron.job
order by jobid;
```

**Expected Output:**
```
jobid | jobname                  | schedule    | active | database
------|--------------------------|-------------|--------|----------
1     | daily-database-cleanup   | 0 19 * * *  | true   | postgres
2     | weekly-billing-cleanup   | 0 21 * * 6  | true   | postgres
```

**What to Look For:**
- ✅ `active` harus `true`
- ⚠️ Jika `active` = `false`, cron job disabled

---

### 5. Check Recent Cron Executions

```sql
-- View last 10 cron job runs
select 
  jobid,
  jobname,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) as duration
from cron.job_run_details
order by start_time desc
limit 10;
```

**What to Look For:**
- ✅ `status` harus `succeeded`
- ✅ `duration` harus < 5 minutes
- ⚠️ Jika `status` = `failed`, check return_message

---

## 🚨 Troubleshooting

### Problem 1: Cleanup Not Running

**Symptoms:**
- `last_run` di cleanup_logs > 2 hari
- Cron job tidak muncul di `cron.job_run_details`

**Diagnosis:**
```sql
-- Check if cron jobs exist
select * from cron.job;

-- Check if pg_cron extension enabled
select * from pg_extension where extname = 'pg_cron';
```

**Solution:**
```sql
-- If cron jobs missing, reschedule
select cron.schedule(
  'daily-database-cleanup',
  '0 19 * * *',
  $$select run_all_cleanups();$$
);

-- If pg_cron not enabled
create extension if not exists pg_cron;
```

---

### Problem 2: Cleanup Failing

**Symptoms:**
- `status` = `failed` di cleanup_logs
- Error messages di cleanup_logs

**Diagnosis:**
```sql
-- Get error details
select 
  table_name,
  error_message,
  created_at
from cleanup_logs
where status = 'failed'
order by created_at desc
limit 5;
```

**Common Errors & Solutions:**

#### Error: "relation does not exist"
```
Cause: Table tidak ada atau nama salah
Solution: Verify table name di schema
```

#### Error: "foreign key constraint violation"
```
Cause: Ada foreign key yang mencegah delete
Solution: Check foreign key constraints, mungkin perlu cascade delete
```

#### Error: "permission denied"
```
Cause: Function tidak punya permission untuk delete
Solution: Grant permissions ke function
```

---

### Problem 3: Too Much Data Deleted

**Symptoms:**
- `rows_deleted` sangat tinggi (> 10,000)
- User complain data hilang

**Diagnosis:**
```sql
-- Check what was deleted
select 
  table_name,
  rows_deleted,
  created_at
from cleanup_logs
where rows_deleted > 10000
order by created_at desc;
```

**Solution:**
1. **Immediate**: Unschedule cron jobs
   ```sql
   select cron.unschedule('daily-database-cleanup');
   select cron.unschedule('weekly-billing-cleanup');
   ```

2. **Restore**: Restore dari backup jika critical data hilang

3. **Adjust**: Review retention policies
   ```sql
   -- Example: Increase retention dari 14 hari ke 30 hari
   create or replace function cleanup_visitor_events()
   returns jsonb
   language plpgsql
   as $$
   begin
     delete from visitor_events
     where created_at < now() - interval '30 days'; -- Changed from 14
     -- ... rest of function
   end;
   $$;
   ```

---

### Problem 4: Cleanup Too Slow

**Symptoms:**
- `execution_time_ms` > 300,000 (5 minutes)
- Cleanup timeout

**Diagnosis:**
```sql
-- Check execution times
select 
  table_name,
  avg(execution_time_ms) as avg_time_ms,
  max(execution_time_ms) as max_time_ms
from cleanup_logs
where created_at >= now() - interval '7 days'
group by table_name
order by avg_time_ms desc;

-- Check table sizes
select * from get_table_sizes();

-- Check if indexes exist
select 
  tablename,
  indexname,
  indexdef
from pg_indexes
where tablename in (
  'visitor_events',
  'visitor_daily_stats',
  'admin_notifications',
  'user_notifications',
  'billing_transactions'
)
order by tablename, indexname;
```

**Solution:**
1. **Add Missing Indexes**
   ```sql
   create index if not exists idx_visitor_events_created_at 
     on visitor_events(created_at);
   ```

2. **Reindex Tables**
   ```sql
   reindex table visitor_events;
   reindex table visitor_daily_stats;
   ```

3. **Analyze Tables**
   ```sql
   analyze visitor_events;
   analyze visitor_daily_stats;
   ```

4. **Batch Delete** (if still slow)
   ```sql
   -- Modify function to delete in batches
   create or replace function cleanup_visitor_events()
   returns jsonb
   language plpgsql
   as $$
   declare
     v_batch_size integer := 1000;
     v_total_deleted integer := 0;
   begin
     loop
       delete from visitor_events
       where id in (
         select id from visitor_events
         where created_at < now() - interval '14 days'
         limit v_batch_size
       );
       
       exit when not found;
       v_total_deleted := v_total_deleted + v_batch_size;
     end loop;
     -- ... rest of function
   end;
   $$;
   ```

---

### Problem 5: Storage Not Reducing

**Symptoms:**
- Cleanup running successfully
- `rows_deleted` > 0
- Table size tidak berkurang

**Diagnosis:**
```sql
-- Check table bloat
select 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_dead_tup as dead_tuples
from pg_stat_user_tables
where tablename in (
  'visitor_events',
  'visitor_daily_stats',
  'admin_notifications',
  'user_notifications',
  'billing_transactions'
)
order by pg_total_relation_size(schemaname||'.'||tablename) desc;
```

**Solution:**
```sql
-- Run VACUUM to reclaim space
vacuum full visitor_events;
vacuum full visitor_daily_stats;
vacuum full admin_notifications;
vacuum full user_notifications;
vacuum full billing_transactions;

-- Or run VACUUM ANALYZE (less aggressive, no table lock)
vacuum analyze visitor_events;
vacuum analyze visitor_daily_stats;
```

**Note**: `VACUUM FULL` locks table, jalankan di off-peak hours!

---

## 🔧 Manual Operations

### Manual Cleanup Execution

```sql
-- Run all cleanups manually
select run_all_cleanups();

-- Run specific cleanup
select cleanup_visitor_events();
select cleanup_visitor_daily_stats();
select cleanup_admin_notifications();
select cleanup_user_notifications();
select cleanup_billing_transactions_expired();
```

**When to Run Manual Cleanup:**
- Testing setelah deployment
- Emergency cleanup (storage penuh)
- Cron job gagal
- Perubahan retention policy

---

### Adjust Retention Policies

#### Increase Retention (Keep Data Longer)

```sql
-- Example: Change visitor_events dari 14 hari ke 30 hari
create or replace function cleanup_visitor_events()
returns jsonb
language plpgsql
as $$
begin
  delete from visitor_events
  where created_at < now() - interval '30 days'; -- Changed from 14
  -- ... rest of function unchanged
end;
$$;
```

#### Decrease Retention (Delete More Aggressively)

```sql
-- Example: Change visitor_events dari 14 hari ke 7 hari
create or replace function cleanup_visitor_events()
returns jsonb
language plpgsql
as $$
begin
  delete from visitor_events
  where created_at < now() - interval '7 days'; -- Changed from 14
  -- ... rest of function unchanged
end;
$$;
```

**⚠️ Warning**: Test di staging dulu sebelum production!

---

### Disable Cleanup Temporarily

```sql
-- Unschedule cron jobs
select cron.unschedule('daily-database-cleanup');
select cron.unschedule('weekly-billing-cleanup');

-- Verify unscheduled
select * from cron.job;
-- Should return empty or not show the cleanup jobs
```

**When to Disable:**
- Investigating data loss issue
- Major database migration
- Performance testing
- Debugging

---

### Re-enable Cleanup

```sql
-- Reschedule cron jobs
select cron.schedule(
  'daily-database-cleanup',
  '0 19 * * *',
  $$select run_all_cleanups();$$
);

select cron.schedule(
  'weekly-billing-cleanup',
  '0 21 * * 6',
  $$select cleanup_billing_transactions_expired();$$
);

-- Verify scheduled
select * from cron.job;
```

---

## 📊 Reporting

### Weekly Cleanup Report

```sql
-- Generate weekly report
select 
  table_name,
  sum(rows_deleted) as total_deleted,
  count(*) as cleanup_runs,
  round(avg(execution_time_ms), 2) as avg_time_ms,
  round(
    (count(*) filter (where status = 'success')::numeric / count(*)::numeric) * 100,
    2
  ) as success_rate
from cleanup_logs
where created_at >= now() - interval '7 days'
group by table_name
order by total_deleted desc;
```

**Export to CSV** (via Supabase Dashboard):
1. Run query di SQL Editor
2. Click "Download CSV"
3. Share dengan team

---

### Monthly Storage Report

```sql
-- Compare table sizes over time
-- (Requires manual tracking or external monitoring)

-- Current sizes
select 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as current_size
from information_schema.tables
where table_schema = 'public'
and table_name in (
  'visitor_events',
  'visitor_daily_stats',
  'admin_notifications',
  'user_notifications',
  'billing_transactions'
)
order by pg_total_relation_size(quote_ident(table_name)::regclass) desc;
```

**Recommendation**: Setup external monitoring (Datadog, New Relic) untuk track storage over time.

---

## 🔐 Security & Permissions

### Required Permissions

Cleanup functions memerlukan permissions:
- `DELETE` on target tables
- `INSERT` on cleanup_logs
- `EXECUTE` on cleanup functions

### Verify Permissions

```sql
-- Check function permissions
select 
  routine_name,
  routine_type,
  security_type
from information_schema.routines
where routine_name like 'cleanup%'
order by routine_name;
```

---

## 📞 Escalation

### When to Escalate to Developer

- Cleanup functions failing consistently (> 3 times)
- Foreign key constraint errors
- Performance degradation (> 5 minutes execution)
- Data loss reported by users
- Schema changes needed

### When to Escalate to DBA/DevOps

- Database storage > 90% full
- Cron jobs not running (pg_cron issue)
- Backup/restore needed
- Performance issues affecting production
- Need to adjust Supabase plan/resources

---

## 📝 Change Log

### How to Document Changes

Setiap kali adjust retention policy atau modify cleanup functions:

1. **Document in cleanup_logs** (manual entry)
   ```sql
   insert into cleanup_logs (
     table_name,
     cleanup_type,
     rows_deleted,
     execution_time_ms,
     status,
     error_message
   ) values (
     'system',
     'config_change',
     0,
     0,
     'success',
     'Changed visitor_events retention from 14 to 30 days - Ticket #123'
   );
   ```

2. **Update this runbook**
3. **Notify team** via Slack/email

---

## 🎓 Training Checklist

New team members should:

- [ ] Read this runbook completely
- [ ] Access Supabase SQL Editor
- [ ] Run monitoring queries (read-only)
- [ ] Understand retention policies
- [ ] Know when to escalate
- [ ] Practice manual cleanup in staging
- [ ] Review cleanup_logs regularly

---

## 📚 Additional Resources

- [Supabase Database Cleanup Implementation Plan](./supabase-database-cleanup-implementation.md)
- [SQL Migrations Documentation](./supabase-cleanup-sql-migrations.md)
- [PostgreSQL VACUUM Documentation](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)

---

**Last Updated**: 2026-05-08  
**Version**: 1.0  
**Maintained By**: Database Team
