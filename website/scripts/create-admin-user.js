import { drizzle } from 'drizzle-orm/d1';
import { schema } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

// This script creates an admin user for testing
async function createAdminUser() {
  console.log('🔧 Creating admin user...');
  
  // In a real implementation, you would connect to your D1 database
  // For now, we'll create the SQL commands to run manually
  
  const adminUserId = createId();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cranberryhearing.com';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';
  
  // Generate cryptographically-strong random password
  const adminPassword = crypto.randomBytes(16).toString('hex');
  
  // Hash the password with bcrypt
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  
  // Reuse timestamp for consistency
  const timestamp = new Date().toISOString();
  
  // SQL escape function to double single quotes
  const sqlEscape = (str) => str.replace(/'/g, "''");
  
  console.log('📝 Run these SQL commands to create the admin user:');
  console.log('');
  console.log('-- Create admin user');
  console.log(`INSERT INTO users (id, name, email, email_verified, role, is_active, created_at, updated_at)`);
  console.log(`VALUES ('${adminUserId}', '${sqlEscape(adminName)}', '${sqlEscape(adminEmail)}', 1, 'admin', 1, '${timestamp}', '${timestamp}');`);
  console.log('');
  console.log('-- Create password account with hashed password');
  console.log(`INSERT INTO accounts (id, account_id, provider_id, user_id, password_hash, created_at, updated_at)`);
  console.log(`VALUES ('${createId()}', '${sqlEscape(adminEmail)}', 'credential', '${adminUserId}', '${passwordHash}', '${timestamp}', '${timestamp}');`);
  console.log('');
  console.log('🔑 Admin credentials:');
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Save this password securely - it will not be shown again!');
  console.log('⚠️  Consider changing the password after first login for additional security.');
}

createAdminUser().catch(console.error);


