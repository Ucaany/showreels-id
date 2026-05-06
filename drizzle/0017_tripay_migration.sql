-- Migration: Tripay payment gateway
-- Mengubah default provider dari midtrans ke tripay
-- Menambahkan field baru untuk Tripay

ALTER TABLE billing_transactions
  ALTER COLUMN provider SET DEFAULT 'tripay';

ALTER TABLE billing_transactions
  ADD COLUMN IF NOT EXISTS checkout_url text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS qr_url text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS pay_code text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS expired_at timestamp;

-- Update default payment method di creator_settings
ALTER TABLE creator_settings
  ALTER COLUMN payment_method SET DEFAULT 'tripay';

-- Tambah status 'cancelled' ke billing_subscriptions jika belum ada
-- (PostgreSQL text type tidak perlu ALTER untuk enum, tapi kita pastikan konsistensi)
