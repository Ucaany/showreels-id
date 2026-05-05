CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"maintenance_enabled" boolean DEFAULT false NOT NULL,
	"pause_enabled" boolean DEFAULT false NOT NULL,
	"maintenance_message" text DEFAULT 'Website sedang dalam maintenance sementara. Silakan kembali beberapa saat lagi.' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"image" text,
	"cover_image_url" text DEFAULT '' NOT NULL,
	"username" text,
	"role" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"experience" text DEFAULT '' NOT NULL,
	"birth_date" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"phone_number" text DEFAULT '' NOT NULL,
	"website_url" text DEFAULT '' NOT NULL,
	"instagram_url" text DEFAULT '' NOT NULL,
	"youtube_url" text DEFAULT '' NOT NULL,
	"facebook_url" text DEFAULT '' NOT NULL,
	"threads_url" text DEFAULT '' NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"blocked_at" timestamp,
	"blocked_reason" text DEFAULT '' NOT NULL,
	"username_change_count" integer DEFAULT 0 NOT NULL,
	"username_change_window_start" timestamp,
	"locale" text DEFAULT 'id' NOT NULL,
	"prefers_dark_mode" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"thumbnail_url" text DEFAULT '' NOT NULL,
	"extra_video_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_url" text NOT NULL,
	"source" text NOT NULL,
	"aspect_ratio" text DEFAULT 'landscape' NOT NULL,
	"output_type" text DEFAULT '' NOT NULL,
	"duration_label" text DEFAULT '' NOT NULL,
	"public_slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "videos_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
CREATE TABLE "visitor_events" (
	"id" text PRIMARY KEY NOT NULL,
	"visitor_id" text NOT NULL,
	"path" text DEFAULT '/' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_auth_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "videos_user_id_idx" ON "videos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "videos_public_slug_idx" ON "videos" USING btree ("public_slug");--> statement-breakpoint
CREATE INDEX "visitor_events_visitor_id_idx" ON "visitor_events" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "visitor_events_created_at_idx" ON "visitor_events" USING btree ("created_at");
