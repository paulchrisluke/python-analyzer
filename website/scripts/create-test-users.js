import { drizzle } from 'drizzle-orm/better-sqlite3';
import { schema } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

// Create test users for the test suite
async function createTestUsers() {
  console.log('🔧 Creating test users...');
  
  // Connect to the local SQLite database
  const sqlite = new Database('./local.db');
  const db = drizzle(sqlite);
  
  const timestamp = Date.now();
  
  // Test users from .env file
  const testUsers = [
    {
      email: 'admin@cranberryhearing.com',
      password: 'Superman12!',
      name: 'Test Admin User',
      role: 'admin'
    },
    {
      email: 'buyer@test.local',
      password: 'test-buyer-password-123',
      name: 'Test Buyer User',
      role: 'buyer'
    },
    {
      email: 'viewer@test.local',
      password: 'test-viewer-password-123',
      name: 'Test Viewer User',
      role: 'viewer'
    }
  ];
  
  for (const user of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, user.email)).limit(1);
      
      if (existingUser.length > 0) {
        console.log(`✅ User ${user.email} already exists, updating...`);
        
        // Update existing user
        await db.update(schema.users)
          .set({
            name: user.name,
            role: user.role,
            updated_at: timestamp
          })
          .where(eq(schema.users.email, user.email));
      } else {
        console.log(`➕ Creating new user: ${user.email}`);
        
        // Create new user
        const userId = createId();
        await db.insert(schema.users).values({
          id: userId,
          name: user.name,
          email: user.email,
          email_verified: true,
          role: user.role,
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 12);
      
      // Check if account already exists
      const existingAccount = await db.select().from(schema.accounts)
        .where(eq(schema.accounts.account_id, user.email))
        .limit(1);
      
      if (existingAccount.length > 0) {
        console.log(`✅ Account for ${user.email} already exists, updating password...`);
        
        // Update existing account
        await db.update(schema.accounts)
          .set({
            password: passwordHash,
            updated_at: timestamp
          })
          .where(eq(schema.accounts.account_id, user.email));
      } else {
        console.log(`➕ Creating account for: ${user.email}`);
        
        // Get user ID
        const userRecord = await db.select().from(schema.users).where(eq(schema.users.email, user.email)).limit(1);
        const userId = userRecord[0].id;
        
        // Create new account
        await db.insert(schema.accounts).values({
          id: createId(),
          account_id: user.email,
          provider_id: 'credential',
          user_id: userId,
          password: passwordHash,
          created_at: timestamp,
          updated_at: timestamp
        });
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
