import { Page, BrowserContext } from '@playwright/test';
import { randomBytes } from 'crypto';

/**
 * Auth test utilities for role-based access testing
 * Based on Better-Auth API documentation: https://www.better-auth.com/docs/plugins/admin#api
 */

/**
 * Generate a secure random password for testing
 * @param length - Password length (default: 16)
 * @returns Secure random password with guaranteed character classes
 */
function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = randomBytes(length);
  
  // Pre-seed one character from each required class
  const requiredChars = ['A', 'a', '1', '!']; // uppercase, lowercase, digit, symbol
  const remainingLength = length - requiredChars.length;
  
  // Generate random characters for the remaining positions
  const randomChars: string[] = [];
  for (let i = 0; i < remainingLength; i++) {
    randomChars.push(charset[bytes[i] % charset.length]);
  }
  
  // Combine required chars and random chars
  const allChars = [...requiredChars, ...randomChars];
  
  // Shuffle the combined array using the same random bytes
  for (let i = allChars.length - 1; i > 0; i--) {
    const j = bytes[i % bytes.length] % (i + 1);
    [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
  }
  
  return allChars.join('');
}

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
}

// Test user credentials - loaded from environment variables with secure fallbacks
export const TEST_USERS: Record<'user' | 'admin', TestUser> = {
  user: {
    email: process.env.TEST_USER_EMAIL || 'testuser@example.com',
    password: process.env.TEST_USER_PASSWORD || generateSecurePassword(),
    name: 'Test User',
    role: 'user'
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@cranberryhearing.com',
    password: process.env.TEST_ADMIN_PASSWORD || generateSecurePassword(),
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
    
    // Navigate to Better Auth UI sign-in page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await page.goto(`${appUrl}/auth/sign-in`);
    
    // Wait for Better Auth UI to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give UI time to render
    
    // Wait for the Better Auth UI form to be visible
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Look for email input - Better Auth UI might use different selectors
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      'form input[type="email"]',
      'form input[name="email"]'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        emailInput = element;
        console.log(`Found email input with selector: ${selector}`);
        break;
      }
    }
    
    if (!emailInput) {
      throw new Error('Could not find email input field');
    }
    
    // Look for password input
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Password" i]',
      'form input[type="password"]',
      'form input[name="password"]'
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        passwordInput = element;
        console.log(`Found password input with selector: ${selector}`);
        break;
      }
    }
    
    if (!passwordInput) {
      throw new Error('Could not find password input field');
    }
    
    // Fill the form fields
    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);
    
    // Wait a moment for the form to register the values
    await page.waitForTimeout(500);
    
    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      'button:has-text("Log in")',
      'form button[type="submit"]',
      'input[type="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        submitButton = element;
        console.log(`Found submit button with selector: ${selector}`);
        break;
      }
    }
    
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }
    
    // Submit the form
    await submitButton.click();
    
    // Wait for the login process to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for redirect
    
    // Check if login was successful
    const currentUrl = page.url();
    console.log(`Current URL after login attempt: ${currentUrl}`);
    
    // Success if we're redirected away from the auth page
    if (!currentUrl.includes('/auth/sign-in')) {
      console.log(`✅ Successfully logged in as ${role} user`);
      return;
    }
    
    // Check for error messages
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '.text-destructive',
      '.text-red-500',
      '.text-red-600',
      '[data-testid="error"]',
      '.alert-error',
      '.form-error',
      '.text-error'
    ];
    
    let errorText = '';
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector).first();
      if (await errorElement.isVisible()) {
        errorText = await errorElement.textContent() || '';
        if (errorText.trim()) {
          console.log(`Found error with selector ${selector}: ${errorText}`);
          break;
        }
      }
    }
    
    // Also check page content for error messages
    if (!errorText) {
      const pageText = await page.textContent('body');
      if (pageText?.includes('Invalid email or password') || 
          pageText?.includes('User not found') ||
          pageText?.includes('Invalid credentials')) {
        errorText = 'Invalid email or password';
      }
    }
    
    if (errorText) {
      throw new Error(`Login failed: ${errorText}`);
    } else {
      // Take a screenshot for debugging
      await page.screenshot({ path: `test-results/login-failure-${role}-${Date.now()}.png` });
      throw new Error(`Login failed: Unknown error. Check screenshot for details.`);
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
    
    // For admin users, we need to create them through the Better Auth API directly
    // since the signup form doesn't support setting roles
    if (role === 'admin') {
      await createAdminUserViaAPI(user);
      return;
    }
    
    // For regular users, use Better Auth UI signup form
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await page.goto(`${appUrl}/auth/sign-up`);
    
    // Wait for Better Auth UI to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give UI time to render
    
    // Wait for the Better Auth UI form to be visible
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Look for name input
    const nameSelectors = [
      'input[name="name"]',
      'input[type="text"]',
      'input[placeholder*="name" i]',
      'input[placeholder*="Name" i]',
      'form input[name="name"]',
      'form input[type="text"]'
    ];
    
    let nameInput = null;
    for (const selector of nameSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        nameInput = element;
        console.log(`Found name input with selector: ${selector}`);
        break;
      }
    }
    
    // Look for email input
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      'form input[type="email"]',
      'form input[name="email"]'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        emailInput = element;
        console.log(`Found email input with selector: ${selector}`);
        break;
      }
    }
    
    if (!emailInput) {
      throw new Error('Could not find email input field');
    }
    
    // Look for password input
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Password" i]',
      'form input[type="password"]',
      'form input[name="password"]'
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        passwordInput = element;
        console.log(`Found password input with selector: ${selector}`);
        break;
      }
    }
    
    if (!passwordInput) {
      throw new Error('Could not find password input field');
    }
    
    // Fill the form fields (no role field - will default to 'user')
    if (nameInput) {
      await nameInput.fill(user.name);
    }
    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);
    
    // Wait a moment for the form to register the values
    await page.waitForTimeout(500);
    
    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign up")',
      'button:has-text("Register")',
      'button:has-text("Create account")',
      'form button[type="submit"]',
      'input[type="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        submitButton = element;
        console.log(`Found submit button with selector: ${selector}`);
        break;
      }
    }
    
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }
    
    // Submit the form
    await submitButton.click();
    
    // Wait for response
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for redirect
    
    // Check if signup was successful
    const currentUrl = page.url();
    console.log(`Current URL after signup attempt: ${currentUrl}`);
    
    if (!currentUrl.includes('/auth/sign-up')) {
      console.log(`✅ ${role} user created successfully`);
    } else {
      // Check for error messages
      const errorSelectors = [
        '[role="alert"]',
        '.error',
        '.text-destructive',
        '.text-red-500',
        '.text-red-600',
        '[data-testid="error"]',
        '.alert-error',
        '.form-error',
        '.text-error'
      ];
      
      let errorText = '';
      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector).first();
        if (await errorElement.isVisible()) {
          errorText = await errorElement.textContent() || '';
          if (errorText.trim()) {
            console.log(`Found error with selector ${selector}: ${errorText}`);
            break;
          }
        }
      }
      
      // Also check page content for error messages
      if (!errorText) {
        const pageText = await page.textContent('body');
        if (pageText?.includes('already exists') || pageText?.includes('User already exists')) {
          errorText = 'User already exists';
        }
      }
      
      if (errorText?.includes('already exists') || errorText?.includes('User already exists')) {
        console.log(`ℹ️  ${role} user already exists`);
      } else if (errorText) {
        console.log(`ℹ️  ${role} user creation had an issue: ${errorText}`);
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
 * Create admin user via Better Auth admin endpoint
 * @param user - Test user object
 */
async function createAdminUserViaAPI(user: TestUser): Promise<void> {
  const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:8787';
  const bootstrapToken = process.env.BETTER_AUTH_SECRET;
  
  if (!bootstrapToken) {
    console.error('❌ BETTER_AUTH_SECRET not found - cannot create admin user via admin endpoint');
    console.log('ℹ️  Falling back to public signup (without role) - admin functionality will be limited');
    await createAdminUserViaPublicSignup(user);
    return;
  }

  try {
    console.log(`🔐 Creating admin user via admin endpoint: ${user.email}`);
    
    // Use the admin-only endpoint with bootstrap token authentication
    const response = await fetch(`${authUrl}/api/auth/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Bootstrap-Token': bootstrapToken,
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        name: user.name,
        role: 'admin',
      }),
    });

    if (response.ok) {
      console.log(`✅ Admin user created successfully via admin endpoint`);
      return;
    }

    const result = await response.json();
    
    // Check if user already exists
    if (result.error?.message?.includes('already exists') || 
        result.error?.message?.includes('User already exists') ||
        response.status === 409) {
      console.log(`ℹ️  Admin user already exists via admin endpoint`);
      return;
    }

    // If admin endpoint fails with non-recoverable error, log and fallback
    console.warn(`⚠️  Admin endpoint failed: ${result.error?.message || 'Unknown error'}`);
    console.log(`🔄 Falling back to public signup (without role) - admin functionality will be limited`);
    await createAdminUserViaPublicSignup(user);

  } catch (error) {
    console.error(`❌ Admin endpoint request failed: ${error}`);
    console.log(`🔄 Falling back to public signup (without role) - admin functionality will be limited`);
    await createAdminUserViaPublicSignup(user);
  }
}

/**
 * Fallback: Create admin user via public signup (without role)
 * @param user - Test user object
 */
async function createAdminUserViaPublicSignup(user: TestUser): Promise<void> {
  try {
    const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:8787';
    
    console.log(`📝 Creating user via public signup (role will be 'user'): ${user.email}`);
    
    // Create user via public signup WITHOUT role field
    const response = await fetch(`${authUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        name: user.name,
        // Note: No role field - will default to 'user'
      }),
    });

    if (response.ok) {
      console.log(`✅ User created via public signup (role: 'user')`);
      console.log(`⚠️  WARNING: User has 'user' role, not 'admin' - admin tests may fail`);
    } else {
      const result = await response.json();
      if (result.error?.message?.includes('already exists') || 
          result.error?.message?.includes('User already exists')) {
        console.log(`ℹ️  User already exists via public signup`);
      } else {
        console.log(`ℹ️  Public signup had an issue: ${result.error?.message || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.log(`ℹ️  Public signup failed: ${error}`);
    console.log(`ℹ️  Continuing with test - admin functionality will be limited`);
  }
}

/**
 * Logout the current user
 * @param page - Playwright page instance
 */
export async function logout(page: Page): Promise<void> {
  try {
    const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:8787';
    const response = await page.request.post(`${authUrl}/api/auth/sign-out`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Check if the response is successful
    if (!response.ok()) {
      const status = response.status();
      let responseBody: string;
      try {
        responseBody = await response.text();
      } catch {
        responseBody = 'Unable to read response body';
      }
      
      // Don't throw error for logout failures - just log and clear cookies
      console.log(`ℹ️  Logout API failed with status ${status}, but clearing cookies anyway`);
    }
    
    // Always clear all cookies regardless of API response
    await page.context().clearCookies();
    console.log('✅ Successfully cleared auth state');
  } catch (error) {
    // Don't throw error for logout failures - just log and clear cookies
    console.log(`ℹ️  Logout failed: ${error}, but clearing cookies anyway`);
    try {
      await page.context().clearCookies();
      console.log('✅ Successfully cleared auth state');
    } catch (clearError) {
      console.log(`ℹ️  Failed to clear cookies: ${clearError}`);
    }
  }
}

/**
 * Check if user is authenticated
 * @param page - Playwright page instance
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:8787';
    const response = await page.request.get(`${authUrl}/api/auth/get-session`);
    return response.ok();
  } catch (error) {
    return false;
  }
}
