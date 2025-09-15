import { test, expect } from '@playwright/test';
import { TEST_CREDENTIALS } from './auth-helpers';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test.describe('Public Access', () => {
    test('should allow access to home page without authentication', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/');
      await expect(page.locator('h1').nth(1)).toContainText('Established Two-Location');
    });

    test('should show login page with form fields', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL('/login/');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
  });

  test.describe('Login Functionality', () => {
    test('should login with admin credentials and redirect to admin dashboard', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      await expect(page.locator('text=' + TEST_CREDENTIALS.admin.name).first()).toBeVisible();
    });

    test('should login with buyer credentials and redirect to buyer dashboard', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.buyer.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.buyer.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to buyer dashboard
      await page.waitForURL('/buyer/', { timeout: 15000 });
      await expect(page.locator('text=' + TEST_CREDENTIALS.buyer.name).first()).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should stay on login page
      await expect(page).toHaveURL('/login/');
    });
  });

  test.describe('Route Protection', () => {
    test('should protect admin routes from unauthenticated users', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/login\/\?callbackUrl=/);
    });

    test('should protect buyer routes from unauthenticated users', async ({ page }) => {
      await page.goto('/buyer');
      await expect(page).toHaveURL(/\/login\/\?callbackUrl=/);
    });

    test('should deny buyer access to admin routes', async ({ page }) => {
      // Login as buyer
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.buyer.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.buyer.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to buyer dashboard
      await page.waitForURL('/buyer/', { timeout: 15000 });
      
      // Try to access admin dashboard
      await page.goto('/admin');
      await expect(page).toHaveURL('/unauthorized/');
    });

    test('should allow admin to access buyer routes', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Should be able to access buyer dashboard
      await page.goto('/buyer');
      await expect(page).toHaveURL('/buyer/');
      await expect(page.locator('h1').nth(1)).toContainText('Buyer Dashboard');
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page navigation', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Navigate between pages
      await page.goto('/buyer');
      await expect(page).toHaveURL('/buyer/');
      
      await page.goto('/');
      await expect(page).toHaveURL('/');
      
      // Should still be authenticated
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin/');
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Logout
      const signOutButton = page.locator('button:has-text("Sign Out")');
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        await page.waitForURL(/\/login/);
      }
    });
  });

  test.describe('Multiple User Types', () => {
    test('should login with different admin user', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin2.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin2.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/admin/', { timeout: 15000 });
      await expect(page.locator('text=' + TEST_CREDENTIALS.admin2.name).first()).toBeVisible();
    });

    test('should login with investor user (buyer role)', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.investor.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.investor.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/buyer/', { timeout: 15000 });
      await expect(page.locator('text=' + TEST_CREDENTIALS.investor.name).first()).toBeVisible();
    });
  });
});
