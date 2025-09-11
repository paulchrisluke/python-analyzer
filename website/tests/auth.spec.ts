import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('should show login page with form fields', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Wait for Better Auth UI to load
    await page.waitForLoadState('networkidle');
    
    // Wait for form elements to be visible
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Check basic form elements exist
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show signup page with form fields', async ({ page }) => {
    await page.goto('/auth/sign-up');
    
    // Wait for Better Auth UI to load
    await page.waitForLoadState('networkidle');
    
    // Wait for form elements to be visible
    await page.waitForSelector('input[name="name"], input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Check basic form elements exist
    await expect(page.locator('input[name="name"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should navigate between login and signup pages', async ({ page }) => {
    // Test login to signup navigation
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');
    
    // Look for signup link in Better Auth UI
    const signupLink = page.locator('a[href*="sign-up"], a[href*="signup"]').first();
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/\/auth\/sign-up/);
    }
    
    // Test signup to login navigation
    const signinLink = page.locator('a[href*="sign-in"], a[href*="signin"]').first();
    if (await signinLink.isVisible()) {
      await signinLink.click();
      await expect(page).toHaveURL(/\/auth\/sign-in/);
    }
  });

  test('should show business sale page without authentication', async ({ page }) => {
    await page.goto('/');
    
    // Should show business sale page
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Established Two-Location Audiology Practice Available')).toBeVisible();
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
    await page.goto('/auth/sign-up');
    
    // Wait for Better Auth UI to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the form to be ready
    await page.waitForSelector('input[name="name"], input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Fill form fields with Better Auth UI selectors
    const nameInput = page.locator('input[name="name"], input[type="text"]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await nameInput.fill(testName);
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    
    // Wait a bit for the values to be set, especially for WebKit
    await page.waitForTimeout(100);
    
    // Verify form fields have the correct values
    await expect(nameInput).toHaveValue(testName);
    await expect(emailInput).toHaveValue(testEmail);
    await expect(passwordInput).toHaveValue(testPassword);
    
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

    await page.goto('/auth/sign-in');
    
    // Wait for Better Auth UI to load
    await page.waitForLoadState('networkidle');
    
    // Wait for form elements to be visible
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Fill login form with Better Auth UI selectors
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    
    // Verify form fields have the correct values
    await expect(emailInput).toHaveValue(testEmail);
    await expect(passwordInput).toHaveValue(testPassword);
    
    // Verify submit button is enabled and visible
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    
    // Verify no page errors occurred
    expect(pageErrors).toHaveLength(0);
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to Better Auth UI sign-in with redirect parameter
    await expect(page).toHaveURL(/\/auth\/sign-in\?redirectTo=\/dashboard/);
  });
});