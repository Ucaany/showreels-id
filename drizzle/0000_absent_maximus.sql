CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"cover_image_url" text DEFAULT '' NOT NULL,
	"username" text,
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
	"password_hash" text,
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
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"thumbnail_url" text DEFAULT '' NOT NULL,
	"extra_video_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_url" text NOT NULL,
	"source" text NOT NULL,
	"public_slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "videos_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "videos_user_id_idx" ON "videos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "videos_public_slug_idx" ON "videos" USING btree ("public_slug");