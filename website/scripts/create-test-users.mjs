import { schema } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create test users for the test suite
async function createTestUsers() {
  console.log('🔧 Creating test users...');
  
  // Connect to the local SQLite database using dynamic imports
  let sqlite, db;
  try {
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const Database = (await import('better-sqlite3')).default;
    sqlite = new Database('./local.db');
    db = drizzle(sqlite);
  } catch (error) {
    console.error('❌ Failed to load better-sqlite3. Ensure it is installed for local development.');
    console.error('Error:', error.message);
    process.exit(1);
  }
  
  const timestamp = Date.now();
  
  // Test users from environment variables
  const testUsers = [
    {
      email: process.env.ADMIN_EMAIL || 'admin@cranberryhearing.com',
      password: process.env.ADMIN_PASSWORD || 'Superman12!',
      name: process.env.ADMIN_NAME || 'Test Admin User',
      role: 'admin'
    },
    {
      email: process.env.BUYER_EMAIL || 'buyer@test.local',
      password: process.env.BUYER_PASSWORD || 'test-buyer-password-123',
      name: process.env.BUYER_NAME || 'Test Buyer User',
      role: 'buyer'
    },
    {
      email: process.env.VIEWER_EMAIL || 'viewer@test.local',
      password: process.env.VIEWER_PASSWORD || 'test-viewer-password-123',
      name: process.env.VIEWER_NAME || 'Test Viewer User',
      role: 'viewer'
    }
  ];
  
  for (const user of testUsers) {
    try {
      // Check if user already exists
      const existingUser = db.select().from(schema.users).where(eq(schema.users.email, user.email)).limit(1).get();
      
      if (existingUser) {
        console.log(`✅ User ${user.email} already exists, updating...`);
        
        // Update existing user
        db.update(schema.users)
          .set({
            name: user.name,
            role: user.role,
            updatedAt: timestamp
          })
          .where(eq(schema.users.email, user.email)).run();
      } else {
        console.log(`➕ Creating new user: ${user.email}`);
        
        // Create new user
        const userId = createId();
        db.insert(schema.users).values({
          id: userId,
          name: user.name,
          email: user.email,
          emailVerified: true,
          role: user.role,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp
        }).run();
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 12);
      
      // Check if account already exists
      const existingAccount = db.select().from(schema.accounts)
        .where(eq(schema.accounts.accountId, user.email))
        .limit(1).get();
      
      if (existingAccount) {
        console.log(`✅ Account for ${user.email} already exists, updating password...`);
        
        // Update existing account
        db.update(schema.accounts)
          .set({
            password_hash: passwordHash,
            updatedAt: timestamp
          })
          .where(eq(schema.accounts.accountId, user.email)).run();
      } else {
        console.log(`➕ Creating account for: ${user.email}`);
        
        // Get user ID
        const userRecord = db.select().from(schema.users).where(eq(schema.users.email, user.email)).limit(1).get();
        const userId = userRecord.id;
        
        // Create new account
        db.insert(schema.accounts).values({
          id: createId(),
          accountId: user.email,
          providerId: 'credential',
          userId: userId,
          password_hash: passwordHash,
          createdAt: timestamp,
          updatedAt: timestamp
        }).run();
      }
      
      console.log(`✅ User ${user.email} ready with role: ${user.role}`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
    }
  }
  
  sqlite.close();
  console.log('🎉 Test users setup complete!');
}

createTestUsers().catch(console.error);
