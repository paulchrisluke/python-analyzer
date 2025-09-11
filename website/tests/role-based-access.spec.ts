import { test, expect } from '@playwright/test';
import { loginAs, createTestUser, logout, TEST_USERS } from './utils/auth';

// Helper function to get app URL
const getAppUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('Role-Based Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('user role cannot access admin page', async ({ page }) => {
    // Create test user if it doesn't exist
    await createTestUser(page, 'user');
    
    // Login as regular user
    await loginAs(page, 'user');
    
    // Try to access admin page
    await page.goto(`${getAppUrl()}/admin`);
    
    // Should see access denied message
    await expect(page.locator('text=Access Denied')).toBeVisible();
    await expect(page.locator('text=You don\'t have permission to access this page')).toBeVisible();
    await expect(page.locator('text=This page requires admin privileges')).toBeVisible();
  });

  test('admin role can access admin page', async ({ page }) => {
    // Create admin user if it doesn't exist
    await createTestUser(page, 'admin');
    
    // Login as admin user
    await loginAs(page, 'admin');
    
    // Navigate to admin page
    await page.goto(`${getAppUrl()}/admin`);
    
    // Should see admin dashboard content
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=Welcome to the admin panel')).toBeVisible();
    await expect(page.locator('text=This page is only accessible to users with admin role')).toBeVisible();
    
    // Should see admin dashboard cards
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Admin Users')).toBeVisible();
    await expect(page.locator('text=System Status')).toBeVisible();
    await expect(page.locator('text=Settings').first()).toBeVisible();
    
    // Should see admin actions section
    await expect(page.locator('text=Admin Actions')).toBeVisible();
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=System Logs')).toBeVisible();
    await expect(page.locator('text=Database Admin')).toBeVisible();
  });

  test('unauthenticated user cannot access admin page', async ({ page }) => {
    // Ensure no authentication
    await logout(page);
    
    // Try to access admin page
    await page.goto(`${getAppUrl()}/admin`);
    
    // Should be redirected to Better Auth UI sign-in with redirect parameter
    await expect(page).toHaveURL(/\/auth\/sign-in\?redirectTo=\/admin/);
    
    // Should see Better Auth UI login form
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('admin user can access regular pages', async ({ page }) => {
    // Create admin user if it doesn't exist
    await createTestUser(page, 'admin');
    
    // Login as admin user
    await loginAs(page, 'admin');
    
    // Should be able to access regular pages
    await page.goto(`${getAppUrl()}/`);
    await expect(page.locator('text=Established Two-Location Audiology Practice Available')).toBeVisible();
    
    // Navigate to dashboard and verify access
    await page.goto(`${getAppUrl()}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Verify URL is correct
    await expect(page).toHaveURL(`${getAppUrl()}/dashboard`);
    
    // Verify dashboard heading is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    // Verify dashboard content is loaded
    await expect(page.locator('text=Asking Price')).toBeVisible();
    await expect(page.locator('text=Cash Flow (EBITDA)')).toBeVisible();
  });

  test('user role can access regular pages', async ({ page }) => {
    // Create test user if it doesn't exist
    await createTestUser(page, 'user');
    
    // Login as regular user
    await loginAs(page, 'user');
    
    // Should be able to access regular pages
    await page.goto(`${getAppUrl()}/`);
    await expect(page.locator('text=Established Two-Location Audiology Practice Available')).toBeVisible();
    
    // Navigate to dashboard and verify access
    await page.goto(`${getAppUrl()}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Verify URL is correct
    await expect(page).toHaveURL(`${getAppUrl()}/dashboard`);
    
    // Verify dashboard heading is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    // Verify dashboard content is loaded
    await expect(page.locator('text=Asking Price')).toBeVisible();
    await expect(page.locator('text=Cash Flow (EBITDA)')).toBeVisible();
  });

  test('role-based navigation works correctly', async ({ page }) => {
    // Test admin navigation
    await createTestUser(page, 'admin');
    await loginAs(page, 'admin');
    
    await page.goto(`${getAppUrl()}/admin`);
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    
    // Test user navigation (should be blocked)
    await logout(page);
    await createTestUser(page, 'user');
    await loginAs(page, 'user');
    
    await page.goto(`${getAppUrl()}/admin`);
    
    // Should see access denied message
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });
});
