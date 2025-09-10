import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  role: text("role", { enum: ["admin", "buyer", "viewer", "guest"] })
    .default("guest")
    .notNull(),
  isActive: integer("is_active", { mode: "boolean" })
    .default(true)
    .notNull(),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

// Indexes for sessions table
export const sessionsUserIdx = index("idx_sessions_user_id").on(sessions.userId);
export const sessionsExpiresAtIdx = index("idx_sessions_expires_at").on(sessions.expiresAt);

// Unique constraint for accounts table
export const accountsProviderAccountUnique = uniqueIndex("ux_accounts_provider_provider_account_id")
  .on(accounts.providerId, accounts.accountId);
export const accountsUserIdx = index("idx_accounts_user_id").on(accounts.userId);

// Unique constraint and index for verifications table
export const verificationsIdentifierTokenUnique = uniqueIndex("ux_verifications_identifier_token")
  .on(verifications.identifier, verifications.value);
export const verificationsExpiresAtIdx = index("idx_verifications_expires_at").on(verifications.expiresAt);

// User activity log table for admin monitoring
export const userActivity = sqliteTable("user_activity", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // "login", "logout", "view_document", "download_document", etc.
  resource: text("resource"), // Document ID, page URL, etc.
  metadata: text("metadata"), // JSON string for additional data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Document access control table
export const documentAccess = sqliteTable("document_access", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull(), // "financial", "equipment", "legal", etc.
  accessLevel: text("access_level", { enum: ["public", "authenticated", "buyer_only", "admin_only"] })
    .default("authenticated")
    .notNull(),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  uploadedBy: text("uploaded_by")
    .references(() => users.id),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  isActive: integer("is_active", { mode: "boolean" })
    .default(true)
    .notNull(),
});

// Indexes for new tables
export const userActivityUserIdx = index("idx_user_activity_user_id").on(userActivity.userId);
export const userActivityCreatedAtIdx = index("idx_user_activity_created_at").on(userActivity.createdAt);
export const documentAccessTypeIdx = index("idx_document_access_type").on(documentAccess.documentType);
export const documentAccessLevelIdx = index("idx_document_access_level").on(documentAccess.accessLevel);

// Export the schema object
export const schema = {
  users,
  sessions,
  accounts,
  verifications,
  userActivity,
  documentAccess,
};
