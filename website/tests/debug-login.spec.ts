import { test, expect } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../.env') });

test('debug login process', async ({ page }) => {
  console.log('🔍 Testing login with:', process.env.ADMIN_EMAIL);
  
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in login form
  await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL || '');
  await page.getByLabel('Password').fill(process.env.ADMIN_PASSWORD || '');
  
  // Listen for console logs and network requests
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', response => {
    if (response.url().includes('/api/auth')) {
      console.log('AUTH API:', response.status(), response.url());
    }
  });
  
  // Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for navigation or timeout
  try {
    await page.waitForURL('/dashboard', { timeout: 10000 });
    console.log('✅ Successfully redirected to dashboard!');
  } catch (error) {
    console.log('❌ Did not redirect to dashboard, current URL:', page.url());
  }
  
  // Wait a bit more to see what happens
  await page.waitForTimeout(2000);
  
  // Check current URL
  const currentUrl = page.url();
  console.log('Final URL:', currentUrl);
  
  // Check for any error messages
  const errorElement = page.locator('[data-testid="error"]').or(page.locator('.text-red-500')).or(page.locator('.text-destructive'));
  if (await errorElement.isVisible()) {
    const errorText = await errorElement.textContent();
    console.log('Login error:', errorText);
  }
  
  // Check for any text that might indicate an error
  const pageText = await page.textContent('body');
  if (pageText.includes('Sign in failed') || pageText.includes('Invalid') || pageText.includes('Error')) {
    console.log('Page contains error text');
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-login.png' });
  
  // Log the page content for debugging
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());
});
