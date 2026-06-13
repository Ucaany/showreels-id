CREATE TABLE IF NOT EXISTS "user_onboarding" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"first_link_created" boolean DEFAULT false NOT NULL,
	"first_video_uploaded" boolean DEFAULT false NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"progress_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_onboarding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_onboarding_current_step_idx"
ON "user_onboarding" USING btree ("current_step");
--> statement-breakpoint
INSERT INTO "user_onboarding" (
	"user_id",
	"onboarding_completed",
	"first_link_created",
	"first_video_uploaded",
	"current_step",
	"progress_payload"
)
SELECT
	u.id,
	true,
	COALESCE(jsonb_array_length(COALESCE(u.custom_links, '[]'::jsonb)), 0) > 0,
	EXISTS (SELECT 1 FROM "videos" v WHERE v."user_id" = u.id),
	4,
	'{}'::jsonb
FROM "users" u
ON CONFLICT ("user_id") DO NOTHING;
