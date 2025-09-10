import { test, expect } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../.env') });

test('debug login process', async ({ page }) => {
  // Check for required environment variables
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const baseUrl = process.env.BASE_URL;
  
  if (!adminEmail || !adminPassword || !baseUrl) {
    const missingVars = [];
    if (!adminEmail) missingVars.push('ADMIN_EMAIL');
    if (!adminPassword) missingVars.push('ADMIN_PASSWORD');
    if (!baseUrl) missingVars.push('BASE_URL');
    
    console.log(`⏭️  Skipping debug login test - missing required environment variables: ${missingVars.join(', ')}`);
    test.skip(true, `Missing required environment variables: ${missingVars.join(', ')}`);
    return;
  }
  
  // Log non-sensitive indicators for debugging
  console.log(`🔍 Testing login flow with adminEmail: ${adminEmail ? '[PROVIDED]' : '[MISSING]'}, adminPassword: [REDACTED]`);
  
  // Navigate to login page using full URL
  const loginUrl = `${baseUrl}/login`;
  await page.goto(loginUrl);
  
  // Fill in login form
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for and assert successful redirection to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
});
