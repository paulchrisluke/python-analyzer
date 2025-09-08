import { test, expect } from '@playwright/test';

test.describe('Basic Functionality', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    
    // Should not show authentication form
    await expect(page.locator('h1')).not.toContainText('Authentication Required');
  });

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

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/docs');
    
    // Try to sign in with invalid credentials
    await page.fill('input[id="email"]', 'invalid@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait a bit for the request to complete
    await page.waitForTimeout(2000);
    
    // Should show error message
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('Sign in failed');
  });

  test('should protect docs.html route', async ({ page }) => {
    await page.goto('/docs.html');
    
    // Should show authentication required
    await expect(page.locator('h1')).toContainText('Authentication Required');
  });
});
