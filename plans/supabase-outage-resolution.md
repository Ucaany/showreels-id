# Supabase Outage & Database Connection Resolution

## Status Saat Ini (8 Mei 2026)

### Supabase Incident
- **Status**: Ongoing outage di `us-east-1a` availability zone
- **Mulai**: 8 Mei 2026, 00:10 UTC
- **Update terakhir**: 16:34 UTC — Tim masih bekerja, full resolution masih beberapa jam lagi
- **Impact**: Database tidak bisa diakses, authentication services down

### Project Showreels.id
- **Region database**: `ap-northeast-2` (Seoul) — seharusnya TIDAK terdampak langsung
- **Pooler URL**: `aws-1-ap-northeast-2.pooler.supabase.com:6543`
- **Kemungkinan**: Cascading effect dari outage global Supabase

---

## Masalah Konfigurasi yang Ditemukan

### 1. Supabase Auth Key Masih Placeholder
```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="placeholder_key"
```
**Harus diganti** dengan anon key yang benar dari Supabase Dashboard:
- Buka https://supabase.com/dashboard/project/vrnbahmqvhetjrmuirlz/settings/api
- Copy "anon public" key
- Ganti di `.env.local`

### 2. Demo Mode Aktif
```env
NEXT_PUBLIC_DEMO_MODE="true"
```
Selama demo mode aktif, aplikasi menggunakan mock data dan TIDAK akan connect ke database.
**Untuk production/testing dengan database nyata**, ubah ke:
```env
NEXT_PUBLIC_DEMO_MODE="false"
```

---

## Langkah Setelah Supabase Pulih

### Step 1: Verifikasi koneksi database
```bash
cd showreels-id-main
npx tsx -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
sql\`SELECT 1 as test\`.then(r => { console.log('✅ Connected:', r); sql.end(); }).catch(e => { console.error('❌ Error:', e.message); sql.end(); });
"
```

### Step 2: Update .env.local
```env
# Matikan demo mode
NEXT_PUBLIC_DEMO_MODE="false"

# Isi dengan anon key yang benar (dari Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx"
```

### Step 3: Jalankan migrasi (jika belum)
```bash
npx drizzle-kit push
```

### Step 4: Restart dev server
```bash
npm run dev
```

---

## Monitoring Supabase Status
- Status page: https://status.supabase.com
- Incident: https://status.supabase.com/incidents/us-east-1-outage

---

## Kesimpulan
**Database tidak terdeteksi bukan karena kode error**, tapi karena:
1. ⚠️ Supabase sedang outage global (meskipun project di region berbeda, bisa terdampak)
2. ⚠️ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` masih "placeholder_key" 
3. ⚠️ `NEXT_PUBLIC_DEMO_MODE="true"` — aplikasi bypass database

**Tidak ada yang perlu di-fix di kode.** Yang perlu dilakukan:
- Tunggu Supabase pulih
- Update env variables dengan credentials yang benar
- Matikan demo mode
