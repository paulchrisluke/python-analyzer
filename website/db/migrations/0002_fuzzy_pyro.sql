CREATE TABLE `document_access` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`document_name` text NOT NULL,
	`document_type` text NOT NULL,
	`access_level` text DEFAULT 'authenticated' NOT NULL CHECK (access_level IN ('public', 'authenticated', 'private')),
	`file_path` text,
	`file_size` integer CHECK (file_size IS NULL OR file_size >= 0),
	`uploaded_by` text,
	`uploaded_at` integer NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL CHECK (is_active IN (0, 1)),
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `user_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`resource` text,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'guest' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` integer;

-- Indexes for document_access table
CREATE INDEX IF NOT EXISTS idx_document_access_document_id ON document_access(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_uploaded_by ON document_access(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_access_is_active ON document_access(is_active);

-- Indexes for accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Unique constraint for accounts table
-- Dedupe before creating unique index
DELETE FROM accounts
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM accounts
  GROUP BY provider_id, account_id
);

-- Verify no duplicates remain
-- SELECT provider_id, account_id, COUNT(*) c
-- FROM accounts
-- GROUP BY provider_id, account_id
-- HAVING c > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider_account_unique ON accounts(provider_id, account_id);

-- Backfill existing users to avoid NULLs
UPDATE users SET role = 'guest' WHERE role IS NULL;
UPDATE users SET is_active = 1 WHERE is_active IS NULL;

-- NOTE: SQLite does not support ADD CONSTRAINT; implement these CHECKs by rebuilding `users`
-- in a subsequent migration (CREATE TABLE users_new ... CHECK(...); INSERT ...; DROP; RENAME).
-- ALTER TABLE users ADD CONSTRAINT users_bool_ck CHECK (email_verified IN (0, 1) AND is_active IN (0, 1));
-- ALTER TABLE users ADD CONSTRAINT users_role_ck CHECK (role IN ('guest', 'user', 'admin'));

-- Rename password column to password_hash for security
ALTER TABLE accounts RENAME COLUMN password TO password_hash;

-- Rename value column to value_hash for security
ALTER TABLE verifications RENAME COLUMN value TO value_hash;

-- Indexes for user_activity table
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created_at ON user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- Indexes for verifications table
CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier);
CREATE INDEX IF NOT EXISTS idx_verifications_expires_at ON verifications(expires_at);

-- Unique constraint for verifications table
-- Dedupe before creating unique index
DELETE FROM verifications
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM verifications
  GROUP BY identifier, value_hash
);

-- Verify no duplicates remain
-- SELECT identifier, value_hash, COUNT(*) c
-- FROM verifications
-- GROUP BY identifier, value_hash
-- HAVING c > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_verifications_identifier_value_unique ON verifications(identifier, value_hash);