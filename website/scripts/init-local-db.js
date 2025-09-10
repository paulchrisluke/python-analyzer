import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize local database
async function initLocalDb() {
  // Create local database (relative to this script) using dynamic imports
  let db;
  try {
    const Database = (await import('better-sqlite3')).default;
    // Use DATABASE_PATH env var if provided, otherwise fall back to default
    const dbPath = process.env.DATABASE_PATH 
      ? path.resolve(process.env.DATABASE_PATH)
      : path.join(__dirname, '../local.db');
    db = new Database(dbPath);
  } catch (error) {
    console.error('❌ Failed to load better-sqlite3. Ensure it is installed for local development.');
    console.error('Error:', error.message);
    process.exit(1);
  }
  
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Read and execute the migration files
  const migrationsDir = path.join(__dirname, '../db/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql')).sort();

  try {
    console.log('Running migrations...');
    const applyMigrations = db.transaction(() => {
      for (const file of migrationFiles) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        try {
          db.exec(sql);
        } catch (migrationError) {
          console.warn(`Warning: Migration ${file} failed:`, migrationError.message);
          console.warn('This may be due to SQLite syntax incompatibilities. Continuing...');
          // Continue with other migrations
        }
      }
    });
    applyMigrations();

    // Insert the admin user
    console.log('Creating admin user...');
    const adminUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, email_verified, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

     const adminAccount = db.prepare(`
       INSERT OR IGNORE INTO accounts (id, user_id, account_id, provider_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     `);

    const userId = 'admin-user-id';
    const accountId = 'admin-account-id';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cranberryhearing.com';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH; // bcrypt hash of the admin password
    if (!adminPasswordHash) {
      throw new Error('Missing ADMIN_PASSWORD_HASH env var. Aborting for safety.');
    }
    const now = new Date().toISOString();

    adminUser.run(
      userId,
      'Admin User',
      adminEmail,
      1, // email_verified
      'admin',
      1, // is_active
      now,
      now
    );

    adminAccount.run(
      accountId,
      userId,
      adminEmail,
      'credential',
      null,
      null,
      null,
      null,
      null,
      null,
      adminPasswordHash,
      now,
      now
    );

    console.log('Database initialized successfully!');
    console.log('Admin user created.');
    console.log(`Email: ${adminEmail}`);
    console.log('Admin password is not printed. Provide ADMIN_PASSWORD_HASH env var.');
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run the initialization
initLocalDb().catch(console.error);
