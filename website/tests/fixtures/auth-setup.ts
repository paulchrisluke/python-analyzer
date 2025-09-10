import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test user configuration from environment variables
const getTestUser = (role: 'admin' | 'buyer' | 'viewer') => {
  const envPrefix = role.toUpperCase();
  const email = process.env[`${envPrefix}_EMAIL`];
  const password = process.env[`${envPrefix}_PASSWORD`];
  const name = process.env[`${envPrefix}_NAME`] || `${role.charAt(0).toUpperCase() + role.slice(1)} User`;

  if (!email || !password) {
    throw new Error(
      `Missing environment variables for ${role} user. Required: ${envPrefix}_EMAIL, ${envPrefix}_PASSWORD. ` +
      `Optional: ${envPrefix}_NAME. Please set these in your .env file or environment.`
    );
  }

  return { email, password, name, role };
};

// Storage state paths
const storageStatePath = (role: string) => path.join(__dirname, `../auth-states/${role}-state.json`);

// Ensure auth-states directory exists
const ensureAuthStatesDir = () => {
  const authStatesDir = path.join(__dirname, '../auth-states');
  if (!fs.existsSync(authStatesDir)) {
    fs.mkdirSync(authStatesDir, { recursive: true });
  }
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
  ensureAuthStatesDir();
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
  ensureAuthStatesDir();
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
  ensureAuthStatesDir();
  await page.context().storageState({ path: storageStatePath('viewer') });
});

// Export utility functions for use in tests
export { getTestUser, storageStatePath };
