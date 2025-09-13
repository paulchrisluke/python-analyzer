import { test, expect } from '@playwright/test';

test.describe('Simple Auth Tests', () => {
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

  test('should allow access to public home page', async ({ page }) => {
    await page.goto('/');
    
    // Should show business sale page
    await expect(page).toHaveURL('/');
    // Use more specific selector to avoid multiple h1 elements
    await expect(page.locator('h1.text-3xl')).toContainText('Established Two-Location');
  });

  test('should allow access to admin when DEV_AUTH_ROLE is set', async ({ page }) => {
    // This test verifies that dev auth bypass is working
    // When DEV_AUTH_ROLE is set, protected routes should be accessible
    test.skip(!process.env.DEV_AUTH_ROLE, 'DEV_AUTH_ROLE not set - skipping dev bypass test');
    
    await page.goto('/admin');
    
    // Should be accessible with dev bypass
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should protect admin route when DEV_AUTH_ROLE is not set', async ({ page }) => {
    // This test verifies that admin route is properly protected
    // When DEV_AUTH_ROLE is not set, should redirect to login or show unauthorized
    test.skip(!!process.env.DEV_AUTH_ROLE, 'DEV_AUTH_ROLE is set - skipping protection test');
    
    await page.goto('/admin');
    
    // Should redirect to login or unauthorized page
    await expect(page).toHaveURL(/\/login|\/unauthorized/);
  });
});
