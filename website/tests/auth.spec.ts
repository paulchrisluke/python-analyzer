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

  test('should allow form input without errors', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testName = `Test User ${timestamp}`;
    const testPassword = 'TestPassword123!';

    // Listen for page errors to fail test on uncaught exceptions
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    // Test signup form input functionality
    await page.goto('/signup');
    
    // Wait for the form to be ready
    await page.waitForSelector('input[id="name"]', { state: 'visible' });
    
    // Fill form fields with more robust approach for WebKit
    await page.locator('input[id="name"]').fill(testName);
    await page.locator('input[id="email"]').fill(testEmail);
    await page.locator('input[id="password"]').fill(testPassword);
    
    // Wait a bit for the values to be set, especially for WebKit
    await page.waitForTimeout(100);
    
    // Verify form fields have the correct values
    await expect(page.locator('input[id="name"]')).toHaveValue(testName);
    await expect(page.locator('input[id="email"]')).toHaveValue(testEmail);
    await expect(page.locator('input[id="password"]')).toHaveValue(testPassword);
    
    // Verify submit button is enabled and visible
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    // Verify no page errors occurred
    expect(pageErrors).toHaveLength(0);
  });

  test('should allow login form input without errors', async ({ page }) => {
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';

    // Listen for page errors to fail test on uncaught exceptions
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/login');
    
    // Fill login form with test credentials
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Verify form fields have the correct values
    await expect(page.locator('input[type="email"]')).toHaveValue(testEmail);
    await expect(page.locator('input[type="password"]')).toHaveValue(testPassword);
    
    // Verify submit button is enabled and visible
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    // Verify no page errors occurred
    expect(pageErrors).toHaveLength(0);
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to login with redirect parameter
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
  });
});