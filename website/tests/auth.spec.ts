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

    // Listen for page errors to fail test on uncaught exceptions
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    // Stub the signup API to return a stable response
    await page.route('**/api/auth/sign-up/email', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: testEmail,
            name: testName,
            createdAt: new Date().toISOString()
          },
          session: {
            id: 'test-session-id',
            userId: 'test-user-id',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        })
      });
    });

    // Test signup form submission
    await page.goto('/signup');
    
    await page.fill('input[id="name"]', testName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    
    // Submit form and wait for success message
    await page.click('button[type="submit"]');
    
    // Wait for success message to appear deterministically
    await page.waitForSelector('text=Account created successfully! Redirecting to login...', { timeout: 10000 });
    
    // Verify no page errors occurred
    expect(pageErrors).toHaveLength(0);
    
    // The page should still be functional (not crashed)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should allow login form submission', async ({ page }) => {
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';

    // Listen for page errors to fail test on uncaught exceptions
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    // Stub the login API to return a stable response
    await page.route('**/api/auth/sign-in/email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: testEmail,
            name: 'Test User',
            createdAt: new Date().toISOString()
          },
          session: {
            id: 'test-session-id',
            userId: 'test-user-id',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        })
      });
    });

    await page.goto('/login');
    
    // Fill login form with test credentials
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Submit form and wait for navigation to dashboard
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard (success)
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify no page errors occurred
    expect(pageErrors).toHaveLength(0);
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});