-- Migration: Drop password-based auth
-- File: 0024_drop_password_auth.sql
-- 
-- Hapus user yang:
--   1. Punya password_hash
--   2. Belum punya Google OAuth (provider != 'google')
--   3. Bukan email owner (hello@ucan.com)
-- 
-- Drop kolom password_hash dan verification_tokens
-- 
-- Owner hello@ucan.com tetap dipertahankan

-- 1. Hapus user legacy yang belum punya Google OAuth
DELETE FROM users
WHERE password_hash IS NOT NULL
  AND id NOT IN (
    SELECT user_id FROM accounts WHERE provider = 'google'
  )
  AND lower(email) NOT IN (
    SELECT lower(value) FROM (VALUES ('hello@ucan.com')) AS owners(value)
  );

-- 2. Drop kolom password_hash dari tabel users
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- 3. Drop kolom password_hash dari tabel accounts (jika ada)
ALTER TABLE accounts DROP COLUMN IF EXISTS password_hash;

-- 4. Drop tabel verification_tokens (hanya dipakai email-link credentials)
DROP TABLE IF EXISTS verification_tokens;

-- 5. Drop kolom password_hash dari tabel sessions (jika ada)
ALTER TABLE sessions DROP COLUMN IF EXISTS password_hash;