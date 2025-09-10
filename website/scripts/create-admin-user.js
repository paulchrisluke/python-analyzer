import { drizzle } from 'drizzle-orm/d1';
import { schema } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// This script creates an admin user for testing
async function createAdminUser() {
  console.log('🔧 Creating admin user...');
  
  // In a real implementation, you would connect to your D1 database
  // For now, we'll create the SQL commands to run manually
  
  const adminUserId = createId();
  const adminEmail = 'admin@cranberryhearing.com';
  const adminName = 'System Administrator';
  const adminPassword = 'admin123'; // In production, this should be hashed
  
  console.log('📝 Run these SQL commands to create the admin user:');
  console.log('');
  console.log('-- Create admin user');
  console.log(`INSERT INTO users (id, name, email, email_verified, role, is_active, created_at, updated_at)`);
  console.log(`VALUES ('${adminUserId}', '${adminName}', '${adminEmail}', 1, 'admin', 1, ${Date.now()}, ${Date.now()});`);
  console.log('');
  console.log('-- Create password account (you may need to hash the password properly)');
  console.log(`INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)`);
  console.log(`VALUES ('${createId()}', '${adminEmail}', 'credential', '${adminUserId}', '${adminPassword}', ${Date.now()}, ${Date.now()});`);
  console.log('');
  console.log('🔑 Admin credentials:');
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log('');
  console.log('⚠️  Remember to change the password after first login!');
}

createAdminUser().catch(console.error);


