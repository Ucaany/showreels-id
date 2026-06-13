ALTER TABLE "creator_settings"
ALTER COLUMN "payment_method" SET DEFAULT 'bayar_gg';

UPDATE "creator_settings"
SET "payment_method" = 'bayar_gg'
WHERE "payment_method" = 'tripay';

ALTER TABLE "billing_transactions"
ALTER COLUMN "provider" SET DEFAULT 'bayar_gg';
