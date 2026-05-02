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

export interface DbCustomLink {
  id: string;
  type?: string;
  title: string;
  url: string;
  value?: string;
  description?: string;
  platform?: string;
  badge?: string;
  thumbnailUrl?: string;
  style?: string;
  iconKey?: string;
  iconUrl?: string;
  inputValue?: string;
  finalUrl?: string;
  inactiveReason?: string;
  metadata?: Record<string, unknown>;
  enabled: boolean;
  order: number;
}

export interface DbOnboardingProgressPayload {
  profile?: {
    fullName?: string;
    username?: string;
    role?: string;
    bio?: string;
    image?: string;
    coverImageUrl?: string;
  };
  firstLink?: {
    title?: string;
    url?: string;
    platform?: string;
    enabled?: boolean;
  };
  [key: string]: unknown;
}

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
    avatarCropX: integer("avatar_crop_x").notNull().default(0),
    avatarCropY: integer("avatar_crop_y").notNull().default(0),
    avatarCropZoom: integer("avatar_crop_zoom").notNull().default(100),
    coverCropX: integer("cover_crop_x").notNull().default(0),
    coverCropY: integer("cover_crop_y").notNull().default(0),
    coverCropZoom: integer("cover_crop_zoom").notNull().default(100),
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
    linkedinUrl: text("linkedin_url").notNull().default(""),
    customLinks: jsonb("custom_links")
      .$type<DbCustomLink[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    linkBuilderDraft: jsonb("link_builder_draft")
      .$type<DbCustomLink[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    linkBuilderPublishedAt: timestamp("link_builder_published_at", { mode: "date" }),
    profileVisibility: text("profile_visibility")
      .$type<"private" | "semi_private" | "public">()
      .notNull()
      .default("public"),
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
      .$type<"draft" | "private" | "semi_private" | "public">()
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
    pinnedToProfile: boolean("pinned_to_profile").notNull().default(false),
    pinnedOrder: integer("pinned_order").notNull().default(0),
    publicSlug: text("public_slug").notNull().unique(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("videos_user_id_idx").on(table.userId),
    slugIdx: index("videos_public_slug_idx").on(table.publicSlug),
    pinnedIdx: index("videos_user_pinned_idx").on(table.userId, table.pinnedToProfile, table.pinnedOrder),
    sourceVisibilityIdx: index("videos_user_source_visibility_idx").on(
      table.userId,
      table.source,
      table.visibility
    ),
  })
);

export const userOnboarding = pgTable(
  "user_onboarding",
  {
    userId: uuid("user_id")
      .primaryKey()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    onboardingSkipped: boolean("onboarding_skipped").notNull().default(false),
    firstLinkCreated: boolean("first_link_created").notNull().default(false),
    firstVideoUploaded: boolean("first_video_uploaded").notNull().default(false),
    hasPublicProfile: boolean("has_public_profile").notNull().default(false),
    currentStep: integer("current_step").notNull().default(1),
    progressPayload: jsonb("progress_payload")
      .$type<DbOnboardingProgressPayload>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    stepIdx: index("user_onboarding_current_step_idx").on(table.currentStep),
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

export const creatorSettings = pgTable(
  "creator_settings",
  {
    userId: uuid("user_id")
      .primaryKey()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    publicProfile: boolean("public_profile").notNull().default(true),
    searchIndexing: boolean("search_indexing").notNull().default(true),
    showPublicEmail: boolean("show_public_email").notNull().default(false),
    showSocialLinks: boolean("show_social_links").notNull().default(true),
    showPublicStats: boolean("show_public_stats").notNull().default(false),
    whitelabelEnabled: boolean("whitelabel_enabled").notNull().default(false),
    billingEmail: text("billing_email").notNull().default(""),
    paymentMethod: text("payment_method").notNull().default("midtrans"),
    taxInfo: text("tax_info").notNull().default(""),
    invoiceNotes: text("invoice_notes").notNull().default(""),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    billingEmailIdx: index("creator_settings_billing_email_idx").on(table.billingEmail),
  })
);

export const billingSubscriptions = pgTable(
  "billing_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    planName: text("plan_name")
      .$type<"free" | "creator" | "business">()
      .notNull()
      .default("free"),
    billingCycle: text("billing_cycle")
      .$type<"monthly" | "yearly">()
      .notNull()
      .default("monthly"),
    status: text("status")
      .$type<"active" | "trial" | "expired" | "failed" | "pending">()
      .notNull()
      .default("active"),
    price: integer("price").notNull().default(0),
    currency: text("currency").notNull().default("IDR"),
    renewalDate: timestamp("renewal_date", { mode: "date" }),
    nextPlanName: text("next_plan_name")
      .$type<"free" | "creator" | "business">()
      .notNull()
      .default("free"),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("billing_subscriptions_user_id_idx").on(table.userId),
    statusIdx: index("billing_subscriptions_status_idx").on(table.status),
  })
);

export const adminNotifications = pgTable(
  "admin_notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: text("type").notNull().default("system"),
    severity: text("severity")
      .$type<"info" | "success" | "warning" | "danger">()
      .notNull()
      .default("info"),
    title: text("title").notNull(),
    message: text("message").notNull().default(""),
    entityType: text("entity_type").notNull().default(""),
    entityId: text("entity_id").notNull().default(""),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    readIdx: index("admin_notifications_is_read_idx").on(table.isRead),
    createdAtIdx: index("admin_notifications_created_at_idx").on(table.createdAt),
    severityIdx: index("admin_notifications_severity_idx").on(table.severity),
  })
);

export const userNotifications = pgTable(
  "user_notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scheduleId: text("schedule_id").references(() => adminNotificationSchedules.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    message: text("message").notNull().default(""),
    status: text("status")
      .$type<"unread" | "read">()
      .notNull()
      .default("unread"),
    deliveredAt: timestamp("delivered_at", { mode: "date" }).notNull().defaultNow(),
    readAt: timestamp("read_at", { mode: "date" }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (table) => ({
    userIdIdx: index("user_notifications_user_id_idx").on(table.userId),
    statusIdx: index("user_notifications_status_idx").on(table.status),
    deliveredAtIdx: index("user_notifications_delivered_at_idx").on(table.deliveredAt),
    scheduleIdx: index("user_notifications_schedule_id_idx").on(table.scheduleId),
  })
);

export const adminNotificationSchedules = pgTable(
  "admin_notification_schedules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    notificationId: text("notification_id").references(() => adminNotifications.id, {
      onDelete: "set null",
    }),
    targetType: text("target_type")
      .$type<"all" | "active" | "blocked" | "public" | "private">()
      .notNull()
      .default("all"),
    targetUserId: uuid("target_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    message: text("message").notNull().default(""),
    status: text("status")
      .$type<"draft" | "scheduled" | "sent" | "paused" | "cancelled">()
      .notNull()
      .default("scheduled"),
    sendMode: text("send_mode")
      .$type<"now" | "scheduled">()
      .notNull()
      .default("now"),
    recurrence: text("recurrence")
      .$type<"once" | "daily" | "weekly" | "monthly">()
      .notNull()
      .default("once"),
    startsAt: timestamp("starts_at", { mode: "date" }).notNull().defaultNow(),
    endsAt: timestamp("ends_at", { mode: "date" }),
    lastSentAt: timestamp("last_sent_at", { mode: "date" }),
    nextRunAt: timestamp("next_run_at", { mode: "date" }),
    activeDurationDays: integer("active_duration_days").notNull().default(1),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("admin_notification_schedules_status_idx").on(table.status),
    nextRunIdx: index("admin_notification_schedules_next_run_idx").on(table.nextRunAt),
    targetTypeIdx: index("admin_notification_schedules_target_type_idx").on(table.targetType),
    targetUserIdx: index("admin_notification_schedules_target_user_idx").on(table.targetUserId),
  })
);

export const billingTransactions = pgTable(
  "billing_transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").references(() => billingSubscriptions.id, {
      onDelete: "set null",
    }),
    invoiceId: text("invoice_id").notNull().unique(),
    planName: text("plan_name")
      .$type<"free" | "creator" | "business">()
      .notNull()
      .default("free"),
    billingCycle: text("billing_cycle")
      .$type<"monthly" | "yearly">()
      .notNull()
      .default("monthly"),
    amount: integer("amount").notNull().default(0),
    currency: text("currency").notNull().default("IDR"),
    status: text("status")
      .$type<"pending" | "paid" | "failed" | "cancelled" | "expired">()
      .notNull()
      .default("pending"),
    provider: text("provider").notNull().default("midtrans"),
    providerReference: text("provider_reference").notNull().default(""),
    snapToken: text("snap_token").notNull().default(""),
    redirectUrl: text("redirect_url").notNull().default(""),
    paymentMethod: text("payment_method").notNull().default(""),
    description: text("description").notNull().default(""),
    rawPayload: jsonb("raw_payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    paidAt: timestamp("paid_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("billing_transactions_user_id_idx").on(table.userId),
    invoiceIdIdx: index("billing_transactions_invoice_id_idx").on(table.invoiceId),
    statusIdx: index("billing_transactions_status_idx").on(table.status),
  })
);

export const usersRelations = relations(users, ({ many, one }) => ({
  videos: many(videos),
  billingTransactions: many(billingTransactions),
  onboarding: one(userOnboarding),
  notifications: many(userNotifications),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  author: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
}));

export const creatorSettingsRelations = relations(creatorSettings, ({ one }) => ({
  user: one(users, {
    fields: [creatorSettings.userId],
    references: [users.id],
  }),
}));

export const billingSubscriptionsRelations = relations(
  billingSubscriptions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [billingSubscriptions.userId],
      references: [users.id],
    }),
    transactions: many(billingTransactions),
  })
);

export const billingTransactionsRelations = relations(billingTransactions, ({ one }) => ({
  user: one(users, {
    fields: [billingTransactions.userId],
    references: [users.id],
  }),
  subscription: one(billingSubscriptions, {
    fields: [billingTransactions.subscriptionId],
    references: [billingSubscriptions.id],
  }),
}));

export const userOnboardingRelations = relations(userOnboarding, ({ one }) => ({
  user: one(users, {
    fields: [userOnboarding.userId],
    references: [users.id],
  }),
}));

export const adminNotificationSchedulesRelations = relations(
  adminNotificationSchedules,
  ({ one, many }) => ({
    notification: one(adminNotifications, {
      fields: [adminNotificationSchedules.notificationId],
      references: [adminNotifications.id],
    }),
    targetUser: one(users, {
      fields: [adminNotificationSchedules.targetUserId],
      references: [users.id],
    }),
    creator: one(users, {
      fields: [adminNotificationSchedules.createdBy],
      references: [users.id],
    }),
    deliveries: many(userNotifications),
  })
);

export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  user: one(users, {
    fields: [userNotifications.userId],
    references: [users.id],
  }),
  schedule: one(adminNotificationSchedules, {
    fields: [userNotifications.scheduleId],
    references: [adminNotificationSchedules.id],
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
export type DbCreatorSettings = typeof creatorSettings.$inferSelect;
export type NewDbCreatorSettings = typeof creatorSettings.$inferInsert;
export type DbBillingSubscription = typeof billingSubscriptions.$inferSelect;
export type NewDbBillingSubscription = typeof billingSubscriptions.$inferInsert;
export type DbBillingTransaction = typeof billingTransactions.$inferSelect;
export type NewDbBillingTransaction = typeof billingTransactions.$inferInsert;
export type DbAdminNotification = typeof adminNotifications.$inferSelect;
export type NewDbAdminNotification = typeof adminNotifications.$inferInsert;
export type DbAdminNotificationSchedule = typeof adminNotificationSchedules.$inferSelect;
export type NewDbAdminNotificationSchedule = typeof adminNotificationSchedules.$inferInsert;
export type DbUserNotification = typeof userNotifications.$inferSelect;
export type NewDbUserNotification = typeof userNotifications.$inferInsert;
export type DbUserOnboarding = typeof userOnboarding.$inferSelect;
export type NewDbUserOnboarding = typeof userOnboarding.$inferInsert;
