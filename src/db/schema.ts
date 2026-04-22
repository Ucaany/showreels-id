import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .notNull(),
    name: text("name"),
    email: text("email").notNull().unique(),
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

export const videos = pgTable(
  "videos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: uuid("user_id")
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

export const visitorDailyStats = pgTable(
  "visitor_daily_stats",
  {
    day: date("day", { mode: "string" }).notNull(),
    path: text("path").notNull().default("/"),
    totalEvents: integer("total_events").notNull().default(0),
    uniqueVisitors: integer("unique_visitors").notNull().default(0),
  },
  (table) => ({
    pk: primaryKey({
      name: "visitor_daily_stats_day_path_pk",
      columns: [table.day, table.path],
    }),
    dayIdx: index("visitor_daily_stats_day_idx").on(table.day),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
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
export type DbVisitorDailyStats = typeof visitorDailyStats.$inferSelect;
export type NewDbVisitorDailyStats = typeof visitorDailyStats.$inferInsert;
