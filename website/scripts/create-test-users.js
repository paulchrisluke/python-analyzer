import { schema } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';

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
  
  const timestamp = new Date();
  
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
      const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, user.email)).limit(1).get();
      
      if (existingUser) {
        console.log(`✅ User ${user.email} already exists, updating...`);
        
        // Update existing user
        await db.update(schema.users)
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
        await db.insert(schema.users).values({
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
      const existingAccount = await db.select().from(schema.accounts)
        .where(eq(schema.accounts.accountId, user.email))
        .limit(1).get();
      
      if (existingAccount) {
        console.log(`✅ Account for ${user.email} already exists, updating password...`);
        
        // Update existing account
        await db.update(schema.accounts)
          .set({
            password: passwordHash,
            updatedAt: timestamp
          })
          .where(eq(schema.accounts.accountId, user.email)).run();
      } else {
        console.log(`➕ Creating account for: ${user.email}`);
        
        // Get user ID
        const userRecord = await db.select().from(schema.users).where(eq(schema.users.email, user.email)).limit(1).get();
        const userId = userRecord.id;
        
        // Create new account
        await db.insert(schema.accounts).values({
          id: createId(),
          accountId: user.email,
          providerId: 'credential',
          userId: userId,
          password: passwordHash,
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
