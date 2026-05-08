# PRD — Database Cleanup & Retention Strategy (Supabase)

## Project Overview

Tujuan dari dokumen ini adalah membuat sistem cleanup database otomatis pada Supabase agar:

- Database tetap ringan dan efisien.
- Data lama yang tidak penting otomatis terhapus.
- Menghindari table overload.
- Mengurangi duplicate table atau struktur yang redundan.
- Menjaga performa query dan storage.
- Mempermudah maintenance jangka panjang.

---

# 1. Objectives

## Primary Goals

1. Membuat mekanisme auto-delete untuk data lama.
2. Membatasi jumlah row pada table tertentu.
3. Membersihkan data temporary / analytics.
4. Menggabungkan table yang redundant.
5. Membuat cleanup berjalan otomatis via cron.
6. Menurunkan storage usage dan query load.

---

# 2. Cleanup Strategy

## A. Retention Based Cleanup

Data dihapus berdasarkan umur data.

Contoh:

| Table | Retention |
|---|---|
| visitor_daily_stat | 90 hari |
| notifications_log | 30 hari |
| analytics_events | 14 hari |
| temp_uploads | 7 hari |
| otp_requests | 1 hari |

---

## B. Row Limit Cleanup

Data dibatasi berdasarkan jumlah maksimum row.

Contoh:

| Table | Max Rows |
|---|---|
| visitor_daily_stat | 100 |
| search_logs | 500 |
| notifications_log | 1000 |

Jika melebihi limit:

- Ambil data paling lama.
- Hapus row tertua.
- Sisakan data terbaru.

---

# 3. Recommended Table Classification

## Critical Tables (Jangan Auto Delete)

Table berikut jangan dibersihkan otomatis:

- users
- subscriptions
- transactions
- invoices
- products
- orders
- teams
- permissions

Cleanup hanya boleh manual.

---

## Temporary / Cache Tables

Table berikut aman untuk auto-clean:

- visitor_daily_stat
- analytics_events
- temp_uploads
- session_logs
- notifications_log
- email_logs
- search_logs
- otp_requests
- api_request_logs
- realtime_presence

---

# 4. Recommended Database Refactor

## Merge Duplicate Tables

Jika terdapat struktur seperti:

- onboarding
- onboarding_step
- onboarding_progress

Maka bisa disederhanakan menjadi:

```sql
onboarding
```

Dengan struktur:

```sql
id
user_id
current_step
completed_steps
is_completed
created_at
updated_at
```

---

## Reason

Keuntungan:

- Query lebih sederhana.
- Relasi lebih ringan.
- Mengurangi join berlebihan.
- Lebih mudah maintain.
- Mengurangi duplicate logic.

---

# 5. Supabase Cleanup Architecture

## Recommended Architecture

```text
Supabase Cron Job
        ↓
Postgres Function
        ↓
Cleanup Query
        ↓
Delete Old Data
```

---

# 6. Auto Cleanup SQL Functions

## A. Cleanup Based On Row Count

### visitor_daily_stat

```sql
create or replace function cleanup_visitor_daily_stat()
returns void
language plpgsql
as $$
begin
  delete from visitor_daily_stat
  where id in (
    select id
    from visitor_daily_stat
    order by created_at asc
    offset 100
  );
end;
$$;
```

---

## Logic

Mekanisme:

1. Ambil data paling lama.
2. Sisakan 100 data terbaru.
3. Hapus sisanya.

---

## B. Cleanup Based On Date

```sql
create or replace function cleanup_old_analytics()
returns void
language plpgsql
as $$
begin
  delete from analytics_events
  where created_at < now() - interval '14 days';
end;
$$;
```

---

## C. Cleanup Notifications

```sql
create or replace function cleanup_notifications_log()
returns void
language plpgsql
as $$
begin
  delete from notifications_log
  where created_at < now() - interval '30 days';
end;
$$;
```

---

# 7. Scheduled Cron Jobs

Gunakan extension:

```sql
pg_cron
```

---

## Enable Extension

```sql
create extension if not exists pg_cron;
```

---

## Schedule Cleanup

### Daily Cleanup

```sql
select cron.schedule(
  'cleanup-visitor-stat',
  '0 2 * * *',
  $$select cleanup_visitor_daily_stat();$$
);
```

---

### Analytics Cleanup

```sql
select cron.schedule(
  'cleanup-analytics',
  '0 3 * * *',
  $$select cleanup_old_analytics();$$
);
```

---

### Notification Cleanup

```sql
select cron.schedule(
  'cleanup-notification-log',
  '0 4 * * *',
  $$select cleanup_notifications_log();$$
);
```

---

# 8. Additional Optimization Recommendations

## A. Add Indexes

Pastikan semua table cleanup memiliki index:

```sql
create index idx_visitor_created_at
on visitor_daily_stat(created_at);
```

---

## B. Soft Delete (Optional)

Untuk data penting gunakan:

```sql
is_deleted boolean default false
```

Daripada hard delete.

---

## C. Archive Before Delete

Untuk analytics besar:

```text
active_table → archive_table → delete
```

---

# 9. Recommended Retention Policy

| Table | Strategy | Value |
|---|---|---|
| visitor_daily_stat | Max Rows | 100 |
| analytics_events | Time Based | 14 days |
| notifications_log | Time Based | 30 days |
| search_logs | Max Rows | 500 |
| otp_requests | Time Based | 1 day |
| session_logs | Time Based | 7 days |
| api_request_logs | Time Based | 3 days |
| temp_uploads | Time Based | 7 days |

---

# 10. Database Health Checklist

## Weekly

- Check unused tables.
- Check duplicate columns.
- Check slow queries.
- Check missing indexes.
- Check storage growth.
- Check large analytics tables.

---

# 11. Recommended Folder Structure

```text
supabase/
 ├── migrations/
 ├── functions/
 │    ├── cleanup_visitor.sql
 │    ├── cleanup_logs.sql
 │    ├── cleanup_analytics.sql
 │
 ├── cron/
 │    ├── daily_cleanup.sql
 │    ├── weekly_cleanup.sql
```

---

# 12. Future Improvements

## Recommended Next Features

### A. Auto Vacuum

```sql
vacuum analyze;
```

Jalankan mingguan.

---

### B. Monitoring Dashboard

Pantau:

- Table size
- Row growth
- Slow queries
- Deleted rows
- Storage usage

---

### C. Cleanup Logs

Buat table:

```sql
cleanup_logs
```

Untuk menyimpan:

- deleted_rows
- deleted_table
- cleanup_time
- duration

---

# 13. Example Universal Cleanup Function

```sql
create or replace function cleanup_table_limit(
  target_table text,
  max_rows integer
)
returns void
language plpgsql
as $$
begin
  execute format(
    'delete from %I
     where id in (
       select id from %I
       order by created_at asc
       offset %s
     )',
    target_table,
    target_table,
    max_rows
  );
end;
$$;
```

---

## Usage

```sql
select cleanup_table_limit('visitor_daily_stat', 100);
```

---

# 14. Final Recommendation

## Prioritas Utama

1. Bersihkan analytics dan logs.
2. Batasi row pada table statistik.
3. Gabungkan table onboarding.
4. Aktifkan cron otomatis.
5. Tambahkan index created_at.
6. Monitoring storage mingguan.

---

# 15. Expected Results

## Setelah Implementasi

- Database lebih ringan.
- Query lebih cepat.
- Storage lebih hemat.
- Maintenance lebih mudah.
- Risiko overload berkurang.
- Struktur database lebih rapi.
- Supabase cost lebih stabil.

---

# 16. Implementation Priority

| Priority | Task |
|---|---|
| High | Cleanup visitor_daily_stat |
| High | Cleanup analytics_events |
| High | Cleanup logs |
| Medium | Merge onboarding tables |
| Medium | Add indexes |
| Low | Build monitoring dashboard |
| Low | Archive system |

---

# 17. Notes

Sebelum menjalankan cleanup production:

- Backup database terlebih dahulu.
- Test di staging environment.
- Pastikan semua table memiliki created_at.
- Pastikan foreign key tidak broken.
- Gunakan transaction jika diperlukan.

---

# END

