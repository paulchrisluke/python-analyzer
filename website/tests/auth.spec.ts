import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('should show login page with form fields', async ({ page }) => {
    await page.goto('/login');
    
    // Check basic form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show signup page with form fields', async ({ page }) => {
    await page.goto('/signup');
    
    // Check basic form elements exist
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should navigate between login and signup pages', async ({ page }) => {
    // Test login to signup navigation
    await page.goto('/login');
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL('/signup');
    
    // Test signup to login navigation
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
  });

  test('should show business sale page without authentication', async ({ page }) => {
    await page.goto('/');
    
    // Should show business sale page
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Business Sale Dashboard')).toBeVisible();
  });

  test('should allow form submission without errors', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testName = `Test User ${timestamp}`;
    const testPassword = 'TestPassword123!';

    // Test signup form submission
    await page.goto('/signup');
    
    await page.fill('input[id="name"]', testName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    
    // Submit form and check it doesn't crash
    await page.click('button[type="submit"]');
    
    // Wait a bit to see if anything happens
    await page.waitForTimeout(3000);
    
    // The page should still be functional (not crashed)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should allow login form submission', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form and check it doesn't crash
    await page.click('button[type="submit"]');
    
    // Wait a bit to see if anything happens
    await page.waitForTimeout(3000);
    
    // The page should still be functional (not crashed)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});