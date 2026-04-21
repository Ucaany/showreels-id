ALTER TABLE "videos" ADD COLUMN "aspect_ratio" text DEFAULT 'landscape' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "output_type" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "duration_label" text DEFAULT '' NOT NULL;
