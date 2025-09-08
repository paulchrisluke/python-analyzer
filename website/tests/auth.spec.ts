import { test, expect } from '@playwright/test';

test.describe('Better Auth Integration', () => {
  test('should show sign-in form when accessing protected docs page', async ({ page }) => {
    await page.goto('/docs');
    
    // Should show authentication required page
    await expect(page.locator('h1')).toContainText('Authentication Required');
    await expect(page.locator('form#signin-form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
  });

  test('should show sign-up page when clicking sign up link', async ({ page }) => {
    await page.goto('/docs');
    
    // Click the sign up link
    await page.click('text=Sign up');
    
    // Should navigate to signup page
    await expect(page).toHaveURL('/signup');
    await expect(page.locator('h1')).toContainText('Create Account');
    await expect(page.locator('form#signup-form')).toBeVisible();
  });

  test('should allow user registration', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill out the signup form
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testName = `Test User ${timestamp}`;
    const testPassword = 'TestPassword123!';
    
    await page.fill('input[id="name"]', testName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should show success message and redirect
    await expect(page.locator('#success-message')).toBeVisible();
    await expect(page.locator('#success-message')).toContainText('Account created successfully');
  });

  test('should allow user sign-in after registration', async ({ page }) => {
    // First, register a user
    await page.goto('/signup');
    
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testName = `Test User ${timestamp}`;
    const testPassword = 'TestPassword123!';
    
    await page.fill('input[id="name"]', testName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Wait for success message and redirect
    await expect(page.locator('#success-message')).toBeVisible();
    await page.waitForURL('/docs');
    
    // Should be authenticated and see the protected content immediately after registration
    await expect(page.locator('h1')).toContainText('Due Diligence Documents');
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/docs');
    
    // Try to sign in with invalid credentials
    await page.fill('input[id="email"]', 'invalid@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('Sign in failed');
  });

  test('should allow sign out', async ({ page }) => {
    // First, register and sign in
    await page.goto('/signup');
    
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testName = `Test User ${timestamp}`;
    const testPassword = 'TestPassword123!';
    
    await page.fill('input[id="name"]', testName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('#success-message')).toBeVisible();
    await page.waitForURL('/docs');
    
    // Now sign out
    await page.click('button:has-text("Sign Out")');
    
    // Should be redirected back to home page
    await expect(page.locator('h1')).toContainText('Cranberry Hearing & Balance Center');
  });

  test('should protect docs.html route', async ({ page }) => {
    await page.goto('/docs.html');
    
    // Should show authentication required
    await expect(page.locator('h1')).toContainText('Authentication Required');
  });

  test('should allow access to public pages without authentication', async ({ page }) => {
    // Test that public pages are accessible
    await page.goto('/');
    
    // Should not show authentication form
    await expect(page.locator('h1')).not.toContainText('Authentication Required');
  });
});
