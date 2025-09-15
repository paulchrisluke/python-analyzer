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

test.describe('Buyer Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test.describe('Authentication and Access', () => {
    test('should require authentication to access buyer dashboard', async ({ page }) => {
      await page.goto('/buyer');
      
      // Should redirect to login page with callback URL
      await expect(page).toHaveURL(/\/login\/\?callbackUrl=/);
    });

    test('should allow buyer to access dashboard after login', async ({ page }) => {
      // Login as buyer
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.buyer.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.buyer.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to buyer dashboard
      await page.waitForURL('/buyer/', { timeout: 15000 });
      
      // Should show buyer dashboard title
      await expect(page.locator('h1').nth(1)).toContainText('Buyer Dashboard');
      
      // Should show welcome message with user name
      await expect(page.locator('text=' + TEST_CREDENTIALS.buyer.name).first()).toBeVisible();
    });

    test('should allow admin to access buyer dashboard', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect to admin dashboard
      await page.waitForURL('/admin/', { timeout: 15000 });
      
      // Navigate to buyer dashboard
      await page.goto('/buyer');
      await expect(page).toHaveURL('/buyer/');
      
      // Should show buyer dashboard title
      await expect(page.locator('h1').nth(1)).toContainText('Buyer Dashboard');
      
      // Should show welcome message with user name
      await expect(page.locator('text=' + TEST_CREDENTIALS.admin.name).first()).toBeVisible();
    });
  });

  test.describe('Dashboard Content', () => {
    test('should display all main dashboard sections', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Check for main sections
      await expect(page.locator('h1').nth(1)).toContainText('Buyer Dashboard');
      
      // Investment Highlights section
      await expect(page.locator('text=Investment Highlights')).toBeVisible();
      
      // Business Details section
      await expect(page.locator('text=Business Details')).toBeVisible();
      
      // Financial Chart section
      await expect(page.locator('text=Detailed Revenue Analysis')).toBeVisible();
      
      // Location Information section
      await expect(page.locator('text=Location Information')).toBeVisible();
      
      // Due Diligence Documents section
      await expect(page.locator('text=Due Diligence Documents')).toBeVisible();
    });

    test('should display business metrics correctly', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Check for asking price
      await expect(page.locator('text=$650,000').first()).toBeVisible();
      
      // Check for business name
      await expect(page.locator('text=Cranberry Hearing & Balance Center').first()).toBeVisible();
      
      // Check for business type
      await expect(page.locator('text=Audiology Practice')).toBeVisible();
    });

    test('should display location information', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Check for primary location
      await expect(page.locator('text=Cranberry Hearing & Balance').first()).toBeVisible();
      await expect(page.locator('text=20820 Route 19, Suite A')).toBeVisible();
      await expect(page.locator('text=Cranberry Twp, PA 16066')).toBeVisible();
      
      // Check for secondary location
      await expect(page.locator('text=Cranberry Hearing & Balance - West View')).toBeVisible();
      await expect(page.locator('text=999 West View Park Drive')).toBeVisible();
      await expect(page.locator('text=Pittsburgh, PA 15229')).toBeVisible();
    });
  });

  test.describe('Navigation and Functionality', () => {
    test('should have working sign out button', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Find and click sign out button
      const signOutButton = page.locator('button:has-text("Sign Out")');
      await expect(signOutButton).toBeVisible();
      
      await signOutButton.click();
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should maintain session across page refreshes', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Refresh the page
      await page.reload();
      
      // Should still be on buyer dashboard
      await expect(page).toHaveURL('/buyer/');
      await expect(page.locator('h1').nth(1)).toContainText('Buyer Dashboard');
    });

    test('should navigate to buyer sub-pages', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'buyer');
      
      // Test buyer documents page
      await page.goto('/buyer/documents');
      await expect(page).toHaveURL(/\/buyer\/documents/);
      
      // Test buyer financials page
      await page.goto('/buyer/financials');
      await expect(page).toHaveURL(/\/buyer\/financials/);
      
      // Test buyer locations page
      await page.goto('/buyer/locations');
      await expect(page).toHaveURL(/\/buyer\/locations/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Should still show main content
      await expect(page.locator('h1').nth(1)).toContainText('Buyer Dashboard');
      
      // Should show sign out button
      await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
      
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Should show all sections
      await expect(page.locator('h1').nth(1)).toContainText('Buyer Dashboard');
      await expect(page.locator('text=Investment Highlights')).toBeVisible();
    });
  });

  test.describe('Data Loading', () => {
    test('should load business data correctly', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Wait for data to load
      await page.waitForLoadState('networkidle');
      
      // Check that business data is displayed
      await expect(page.locator('text=Cranberry Hearing & Balance Center').first()).toBeVisible();
      await expect(page.locator('text=$650,000').first()).toBeVisible();
      await expect(page.locator('text=Established in 2003')).toBeVisible();
    });

    test('should handle data loading states gracefully', async ({ page }) => {
      // Intercept API calls to simulate slow loading
      await page.route('**/api/**', route => {
        // Delay the response
        setTimeout(() => route.continue(), 1000);
      });
      
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Should show loading state or content
      await expect(page.locator('h1').nth(1)).toContainText('Buyer Dashboard');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure for API calls
      await page.route('**/api/**', route => route.abort());
      
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Should still show the page structure
      await expect(page.locator('h1').nth(1)).toContainText('Buyer Dashboard');
    });

    test('should redirect to login if session expires', async ({ page }) => {
      await loginAndWaitForRedirect(page, 'buyer');
      await page.goto('/buyer');
      
      // Clear cookies to simulate session expiry
      await page.context().clearCookies();
      
      // Try to navigate to a protected route
      await page.goto('/buyer');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
