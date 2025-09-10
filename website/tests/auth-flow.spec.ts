import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test('should allow user signup and login', async ({ page }) => {
    // Generate unique email for this test run
    const timestamp = Date.now();
    const uniqueEmail = `testuser-${timestamp}@example.com`;
    
    // Navigate to signup page
    await page.goto('/signup');
    
    // Fill in signup form
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill('testpassword123');
    
    // Submit signup form
    await page.click('button[type="submit"]');
    
    // Wait for success message and redirect to login
    await page.waitForSelector('div.text-sm.text-green-600.bg-green-50', { timeout: 10000 });
    await page.waitForURL('/login', { timeout: 10000 });
    
    // Now login with the new user
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill('testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard after successful login
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Assert that we're on the dashboard and the heading is visible
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check form elements are present
    await expect(page.locator('div.font-semibold.tracking-tight.text-2xl').filter({ hasText: 'Login' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should display signup form correctly', async ({ page }) => {
    await page.goto('/signup');
    
    // Check form elements are present
    await expect(page.locator('div.font-semibold.tracking-tight.text-2xl').filter({ hasText: 'Create Account' })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('should protect dashboard route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await page.waitForURL('/login');
    await expect(page.locator('div.font-semibold.tracking-tight.text-2xl').filter({ hasText: 'Login' })).toBeVisible();
  });

  test('should protect docs route', async ({ page }) => {
    // Try to access docs without login
    await page.goto('/docs');
    
    // Should be redirected to login
    await page.waitForURL('/login');
    await expect(page.locator('div.font-semibold.tracking-tight.text-2xl').filter({ hasText: 'Login' })).toBeVisible();
  });

  test('should allow access to public routes', async ({ page }) => {
    // Home page should be accessible
    await page.goto('/');
    await expect(page.getByText('Cranberry Hearing & Balance Center')).toBeVisible();
    
    // Login page should be accessible
    await page.goto('/login');
    await expect(page.locator('div.font-semibold.tracking-tight.text-2xl').filter({ hasText: 'Login' })).toBeVisible();
    
    // Signup page should be accessible
    await page.goto('/signup');
    await expect(page.locator('div.font-semibold.tracking-tight.text-2xl').filter({ hasText: 'Create Account' })).toBeVisible();
  });
});
