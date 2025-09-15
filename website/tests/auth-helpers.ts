import { Page, expect } from '@playwright/test';

// Test credentials from NextAuth configuration
export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@cranberryhearing.com',
    password: 'admin123!',
    name: 'Admin User',
    role: 'admin'
  },
  admin2: {
    email: 'admin2@example.com',
    password: 'admin123!',
    name: 'Admin User 2',
    role: 'admin'
  },
  buyer: {
    email: 'buyer@example.com',
    password: 'buyer123!',
    name: 'Buyer User',
    role: 'buyer'
  },
  investor: {
    email: 'investor@example.com',
    password: 'buyer123!',
    name: 'Investor User',
    role: 'buyer'
  }
};

/**
 * Login helper function
 */
export async function loginAs(page: Page, userType: keyof typeof TEST_CREDENTIALS) {
  const credentials = TEST_CREDENTIALS[userType];
  
  await page.goto('/login');
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect after login
  await page.waitForURL(/\/(admin|buyer|dashboard|$)/);
  
  return credentials;
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  const signOutButton = page.locator('button:has-text("Sign Out")');
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await page.waitForURL(/\/login/);
  }
}

/**
 * Clear authentication state
 */
export async function clearAuthState(page: Page) {
  await page.context().clearCookies();
}

/**
 * Check if user is authenticated by looking for user name on page
 */
export async function isAuthenticated(page: Page, expectedName?: string): Promise<boolean> {
  try {
    if (expectedName) {
      await page.waitForSelector(`text=${expectedName}`, { timeout: 5000 });
      return true;
    } else {
      // Look for any sign out button as indicator of authentication
      const signOutButton = page.locator('button:has-text("Sign Out")');
      return await signOutButton.isVisible();
    }
  } catch {
    return false;
  }
}

/**
 * Navigate to a protected route and check if access is granted
 */
export async function testProtectedRoute(page: Page, route: string, shouldHaveAccess: boolean = true) {
  await page.goto(route);
  
  if (shouldHaveAccess) {
    await expect(page).toHaveURL(new RegExp(route));
  } else {
    // Should redirect to login or unauthorized
    await expect(page).toHaveURL(/\/(login|unauthorized)/);
  }
}

/**
 * Wait for page to load and be ready
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('body');
}
