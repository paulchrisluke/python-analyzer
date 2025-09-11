import { Page, BrowserContext } from '@playwright/test';

/**
 * Auth test utilities for role-based access testing
 * Based on Better-Auth API documentation: https://www.better-auth.com/docs/plugins/admin#api
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
}

// Test user credentials
export const TEST_USERS: Record<'user' | 'admin', TestUser> = {
  user: {
    email: 'testuser@example.com',
    password: 'testpass123!',
    name: 'Test User',
    role: 'user'
  },
  admin: {
    email: 'admin@cranberryhearing.com',
    password: 'admin123!',
    name: 'Admin User',
    role: 'admin'
  }
};

/**
 * Login as a specific role by calling the Better-Auth worker API
 * @param page - Playwright page instance
 * @param role - User role ('user' or 'admin')
 * @param context - Browser context for cookie management
 */
export async function loginAs(
  page: Page, 
  role: 'user' | 'admin',
  context?: BrowserContext
): Promise<void> {
  const user = TEST_USERS[role];
  
  try {
    console.log(`Logging in as ${role} user: ${user.email}`);
    
    // Navigate to login page and fill form
    await page.goto('http://localhost:3000/login');
    
    // Fill login form
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or success
    await page.waitForLoadState('networkidle');
    
    // Check if login was successful by looking for redirect or dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin') || !currentUrl.includes('/login')) {
      console.log(`✅ Successfully logged in as ${role} user`);
    } else {
      // Check for error messages
      const errorElement = await page.locator('.text-destructive, .error, [role="alert"]').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        throw new Error(`Login failed: ${errorText}`);
      } else {
        throw new Error('Login failed: Unknown error');
      }
    }
    
  } catch (error) {
    console.error(`❌ Failed to login as ${role}:`, error);
    throw error;
  }
}

/**
 * Create a test user if it doesn't exist
 * @param page - Playwright page instance
 * @param role - User role ('user' or 'admin')
 */
export async function createTestUser(page: Page, role: 'user' | 'admin'): Promise<void> {
  const user = TEST_USERS[role];
  
  try {
    console.log(`Creating ${role} user: ${user.email}`);
    
    // Navigate to signup page
    await page.goto('http://localhost:3000/signup');
    
    // Fill signup form
    await page.fill('input[id="name"]', user.name);
    await page.fill('input[id="email"]', user.email);
    await page.fill('input[id="password"]', user.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForLoadState('networkidle');
    
    // Check if signup was successful
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin') || !currentUrl.includes('/signup')) {
      console.log(`✅ ${role} user created successfully`);
    } else {
      // Check for error messages
      const errorElement = await page.locator('.text-destructive, .error, [role="alert"]').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        if (errorText?.includes('already exists') || errorText?.includes('User already exists')) {
          console.log(`ℹ️  ${role} user already exists`);
        } else {
          console.log(`ℹ️  ${role} user creation had an issue: ${errorText}`);
        }
      } else {
        console.log(`ℹ️  ${role} user already exists or created successfully`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to create ${role} user:`, error);
    // Don't throw error - just log it and continue
    console.log(`ℹ️  ${role} user creation failed, but continuing with test`);
  }
}

/**
 * Logout the current user
 * @param page - Playwright page instance
 */
export async function logout(page: Page): Promise<void> {
  try {
    await page.request.post('http://localhost:8787/api/auth/sign-out', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Clear all cookies
    await page.context().clearCookies();
    console.log('✅ Successfully logged out');
  } catch (error) {
    console.error('❌ Failed to logout:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 * @param page - Playwright page instance
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('http://localhost:8787/api/auth/get-session');
    return response.ok();
  } catch (error) {
    return false;
  }
}
