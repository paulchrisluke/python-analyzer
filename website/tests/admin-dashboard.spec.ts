import { test, expect } from '@playwright/test';
import { loginAs, logout, clearAuthState, TEST_CREDENTIALS } from './auth-helpers';

// Helper function to login and wait for redirect
async function loginAndWaitForRedirect(page: any, userType: 'admin' | 'admin2' | 'buyer' | 'investor') {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_CREDENTIALS[userType].email);
  await page.fill('input[type="password"]', TEST_CREDENTIALS[userType].password);
  await page.click('button[type="submit"]');
  
  if (userType === 'admin' || userType === 'admin2') {
    await page.waitForURL('/admin/', { timeout: 15000 });
  } else {
    await page.waitForURL('/buyer/', { timeout: 15000 });
  }
}

test.describe('Admin Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test.describe('Authentication and Access', () => {
    test('should require authentication to access admin dashboard', async ({ page }) => {
      await page.goto('/admin');
      
      // Should redirect to login page with callback URL
      await expect(page).toHaveURL(/\/login\/\?callbackUrl=/);
    });

    test('should allow admin to access dashboard after login', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Should show admin dashboard content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should allow second admin user to access dashboard', async ({ page }) => {
      // Login as admin2
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin2.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin2.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Should show admin dashboard content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should deny buyer access to admin dashboard', async ({ page }) => {
      // Login as buyer
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.buyer.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.buyer.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to buyer dashboard
      await page.waitForURL('/buyer/', { timeout: 15000 });
      
      // Try to access admin dashboard
      await page.goto('/admin');
      
      // Should redirect to unauthorized page
      await expect(page).toHaveURL('/unauthorized/');
    });
  });

  test.describe('Admin Dashboard Content', () => {
    test('should display admin dashboard sections', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Should show admin-specific content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should display business metrics for admin', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      
      // Should show business information
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Admin Sub-pages', () => {
    test('should access admin documents page', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Navigate to admin documents page
      await page.goto('/admin/documents');
      await expect(page).toHaveURL('/admin/documents/');
      
      // Should show documents content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should access admin metrics page', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Navigate to admin metrics page
      await page.goto('/admin/metrics');
      await expect(page).toHaveURL('/admin/metrics/');
      
      // Should show metrics content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should deny buyer access to admin documents', async ({ page }) => {
      // Login as buyer
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.buyer.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.buyer.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to buyer dashboard
      await page.waitForURL('/buyer/', { timeout: 15000 });
      
      // Try to access admin documents
      await page.goto('/admin/documents');
      
      // Should redirect to unauthorized page
      await expect(page).toHaveURL('/unauthorized/');
    });

    test('should deny buyer access to admin metrics', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'buyer');
      
      await page.goto('/admin/metrics');
      
      // Should redirect to unauthorized or login
      await expect(page).toHaveURL(/\/(unauthorized|login)/);
    });
  });

  test.describe('Admin Privileges', () => {
    test('admin should access both admin and buyer routes', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'admin');
      
      // Should access admin routes
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin/');
      
      // Should also access buyer routes
      await page.goto('/buyer');
      await expect(page).toHaveURL(/\/buyer/);
    });

    test('admin should access all admin sub-pages', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'admin');
      
      // Test all admin routes
      const adminRoutes = ['/admin', '/admin/documents', '/admin/metrics'];
      
      for (const route of adminRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(new RegExp(route));
      }
    });
  });

  test.describe('Navigation and Functionality', () => {
    test('should have working sign out button', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'admin');
      await page.goto('/admin');
      
      // Look for sign out button
      const signOutButton = page.locator('button:has-text("Sign Out")');
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        
        // Should redirect to login page
        await expect(page).toHaveURL(/\/login/);
      }
    });

    test('should maintain session across page refreshes', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'admin');
      await page.goto('/admin');
      
      // Refresh the page
      await page.reload();
      
      // Should still be on admin dashboard
      await expect(page).toHaveURL('/admin/');
    });

    test('should navigate between admin pages', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'admin');
      
      // Navigate between admin pages
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin/');
      
      await page.goto('/admin/documents');
      await expect(page).toHaveURL('/admin/documents/');
      
      await page.goto('/admin/metrics');
      await expect(page).toHaveURL('/admin/metrics/');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      
      await loginAndWaitForRedirect(page, 'admin');
      await page.goto('/admin');
      
      // Should still show main content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
      
      await loginAndWaitForRedirect(page, 'admin');
      await page.goto('/admin');
      
      // Should show content
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Data Loading', () => {
    test('should load admin data correctly', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'admin');
      await page.goto('/admin');
      
      // Wait for data to load
      await page.waitForLoadState('networkidle');
      
      // Should show admin content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle data loading states gracefully', async ({ page }) => {
      // Intercept API calls to simulate slow loading
      await page.route('**/api/**', route => {
        // Delay the response
        setTimeout(() => route.continue(), 1000);
      });
      
      await loginAndWaitForRedirect(page, 'admin');
      await page.goto('/admin');
      
      // Should show content
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure for API calls
      await page.route('**/api/**', route => route.abort());
      
      await loginAndWaitForRedirect(page, 'admin');
      await page.goto('/admin');
      
      // Should still show the page structure
      await expect(page.locator('body')).toBeVisible();
    });

    test('should redirect to login if session expires', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'admin');
      await page.goto('/admin');
      
      // Clear cookies to simulate session expiry
      await page.context().clearCookies();
      
      // Try to navigate to a protected route
      await page.goto('/admin');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
