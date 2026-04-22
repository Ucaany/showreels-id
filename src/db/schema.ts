import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    coverImageUrl: text("cover_image_url").notNull().default(""),
    username: text("username").unique(),
    role: text("role").notNull().default(""),
    bio: text("bio").notNull().default(""),
    experience: text("experience").notNull().default(""),
    birthDate: text("birth_date").notNull().default(""),
    city: text("city").notNull().default(""),
    address: text("address").notNull().default(""),
    contactEmail: text("contact_email").notNull().default(""),
    phoneNumber: text("phone_number").notNull().default(""),
    websiteUrl: text("website_url").notNull().default(""),
    instagramUrl: text("instagram_url").notNull().default(""),
    youtubeUrl: text("youtube_url").notNull().default(""),
    facebookUrl: text("facebook_url").notNull().default(""),
    threadsUrl: text("threads_url").notNull().default(""),
    skills: jsonb("skills")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    passwordHash: text("password_hash"),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    loginLockedUntil: timestamp("login_locked_until", { mode: "date" }),
    passwordResetToken: text("password_reset_token"),
    passwordResetExpires: timestamp("password_reset_expires", { mode: "date" }),
    isBlocked: boolean("is_blocked").notNull().default(false),
    blockedAt: timestamp("blocked_at", { mode: "date" }),
    blockedReason: text("blocked_reason").notNull().default(""),
    usernameChangeCount: integer("username_change_count").notNull().default(0),
    usernameChangeWindowStart: timestamp("username_change_window_start", {
      mode: "date",
    }),
    locale: text("locale").notNull().default("id"),
    prefersDarkMode: boolean("prefers_dark_mode").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    usernameIdx: index("users_username_idx").on(table.username),
  })
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

export const videos = pgTable(
  "videos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    tags: jsonb("tags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    visibility: text("visibility")
      .$type<"draft" | "private" | "public">()
      .notNull()
      .default("public"),
    thumbnailUrl: text("thumbnail_url").notNull().default(""),
    extraVideoUrls: jsonb("extra_video_urls")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    imageUrls: jsonb("image_urls")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    sourceUrl: text("source_url").notNull(),
    source: text("source").notNull(),
    aspectRatio: text("aspect_ratio")
      .$type<"landscape" | "portrait">()
      .notNull()
      .default("landscape"),
    outputType: text("output_type").notNull().default(""),
    durationLabel: text("duration_label").notNull().default(""),
    publicSlug: text("public_slug").notNull().unique(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("videos_user_id_idx").on(table.userId),
    slugIdx: index("videos_public_slug_idx").on(table.publicSlug),
  })
);

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("global"),
  maintenanceEnabled: boolean("maintenance_enabled").notNull().default(false),
  pauseEnabled: boolean("pause_enabled").notNull().default(false),
  maintenanceMessage: text("maintenance_message")
    .notNull()
    .default("Website sedang dalam maintenance sementara. Silakan kembali beberapa saat lagi."),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const visitorEvents = pgTable(
  "visitor_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    visitorId: text("visitor_id").notNull(),
    path: text("path").notNull().default("/"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    visitorIdIdx: index("visitor_events_visitor_id_idx").on(table.visitorId),
    createdAtIdx: index("visitor_events_created_at_idx").on(table.createdAt),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  author: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
}));

export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;
export type DbVideo = typeof videos.$inferSelect;
export type NewDbVideo = typeof videos.$inferInsert;
export type DbSiteSettings = typeof siteSettings.$inferSelect;
export type NewDbSiteSettings = typeof siteSettings.$inferInsert;
export type DbVisitorEvent = typeof visitorEvents.$inferSelect;
export type NewDbVisitorEvent = typeof visitorEvents.$inferInsert;
