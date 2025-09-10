import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create local database
const db = new Database('local.db');

// Read and execute the migration files
const migrationsDir = path.join(__dirname, '../db/migrations');
const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql')).sort();

console.log('Running migrations...');
for (const file of migrationFiles) {
  console.log(`Running migration: ${file}`);
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  db.exec(sql);
}

// Insert the admin user
console.log('Creating admin user...');
const adminUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, email_verified, role, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const adminAccount = db.prepare(`
  INSERT OR IGNORE INTO accounts (id, user_id, account_id, provider_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const userId = 'admin-user-id';
const accountId = 'admin-account-id';
const now = new Date().toISOString();

adminUser.run(
  userId,
  'Admin User',
  'admin@cranberryhearing.com',
  1, // email_verified
  'admin',
  1, // is_active
  now,
  now
);

adminAccount.run(
  accountId,
  userId,
  'admin@cranberryhearing.com',
  'credential',
  null,
  null,
  null,
  null,
  null,
  null,
  '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJByJp8Y2c0Q8qQ8Q8Q', // hashed password for 'admin123'
  now,
  now
);

console.log('Database initialized successfully!');
console.log('Admin user created:');
console.log('Email: admin@cranberryhearing.com');
console.log('Password: admin123');

db.close();
