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
    bio: text("bio").notNull().default(""),
    experience: text("experience").notNull().default(""),
    birthDate: text("birth_date").notNull().default(""),
    city: text("city").notNull().default(""),
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
    publicSlug: text("public_slug").notNull().unique(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("videos_user_id_idx").on(table.userId),
    slugIdx: index("videos_public_slug_idx").on(table.publicSlug),
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
