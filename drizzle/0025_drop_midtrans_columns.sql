-- Migration: Drop deprecated Midtrans columns from billing_transactions
-- File: 0025_drop_midtrans_columns.sql
--
-- Kolom snap_token dan redirect_url adalah sisa dari integrasi Midtrans lama.
-- Payment gateway sekarang menggunakan Tripay (checkout_url, qr_url, pay_code).
-- Kolom ini sudah di-deprecated di schema (komentar "backward compat Midtrans").
--
-- CATATAN: Jalankan migration ini setelah memastikan tidak ada transaksi pending
-- yang masih membutuhkan snap_token atau redirect_url.

-- Update default paymentMethod di creator_settings dari 'midtrans' ke 'tripay'
UPDATE creator_settings
SET payment_method = 'tripay'
WHERE payment_method = 'midtrans';

-- Drop kolom deprecated dari billing_transactions
-- (snap_token dan redirect_url sudah digantikan oleh checkout_url)
ALTER TABLE billing_transactions DROP COLUMN IF EXISTS snap_token;
ALTER TABLE billing_transactions DROP COLUMN IF EXISTS redirect_url;
