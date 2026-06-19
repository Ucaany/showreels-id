ALTER TABLE "users"
  ADD COLUMN "avatar_crop_x" integer NOT NULL DEFAULT 0,
  ADD COLUMN "avatar_crop_y" integer NOT NULL DEFAULT 0,
  ADD COLUMN "avatar_crop_zoom" integer NOT NULL DEFAULT 100,
  ADD COLUMN "cover_crop_x" integer NOT NULL DEFAULT 0,
  ADD COLUMN "cover_crop_y" integer NOT NULL DEFAULT 0,
  ADD COLUMN "cover_crop_zoom" integer NOT NULL DEFAULT 100;
