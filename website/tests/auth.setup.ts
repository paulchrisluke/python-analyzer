import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { mkdirSync } from 'node:fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { getTestUser } from './fixtures/test-users';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../.env') });

// Storage state paths
const storageStatePath = (role: string) => path.join(__dirname, `../auth-states/${role}-state.json`);

// Ensure auth-states directory exists
const ensureAuthStatesDir = (role: string) => {
  const dirPath = path.dirname(storageStatePath(role));
  mkdirSync(dirPath, { recursive: true });
};

// Setup test for admin user authentication
setup('authenticate as admin', async ({ page }) => {
  const user = getTestUser('admin');
  
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('/dashboard', { timeout: 15000 });
  
  // Verify admin access
  await expect(page.getByText('Admin Panel')).toBeVisible();
  
  // Ensure directory exists and save authentication state
  ensureAuthStatesDir('admin');
  await page.context().storageState({ path: storageStatePath('admin') });
});

// Setup test for buyer user authentication
setup('authenticate as buyer', async ({ page }) => {
  const user = getTestUser('buyer');
  
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('/dashboard', { timeout: 15000 });
  
  // Verify buyer access (no admin panel)
  await expect(page.getByText('Admin Panel')).not.toBeVisible();
  
  // Ensure directory exists and save authentication state
  ensureAuthStatesDir('buyer');
  await page.context().storageState({ path: storageStatePath('buyer') });
});

// Setup test for viewer user authentication
setup('authenticate as viewer', async ({ page }) => {
  const user = getTestUser('viewer');
  
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('/dashboard', { timeout: 15000 });
  
  // Verify viewer access (no admin panel)
  await expect(page.getByText('Admin Panel')).not.toBeVisible();
  
  // Ensure directory exists and save authentication state
  ensureAuthStatesDir('viewer');
  await page.context().storageState({ path: storageStatePath('viewer') });
});

// Export utility functions for use in tests
export { storageStatePath };
