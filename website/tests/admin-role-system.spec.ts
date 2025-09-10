import { test, expect } from '@playwright/test';
import { getTestUsers, validateTestEnvironment } from './fixtures/test-users';

// Validate environment variables before running tests
validateTestEnvironment();

// Get test users from environment variables
const testUsers = getTestUsers();

test.describe('Admin Role System', () => {
  
  test.describe('Admin User Access', () => {
    test('should allow admin to access admin panel', async ({ page }) => {
      // Navigate to dashboard (authentication handled by storage state)
      await page.goto('/dashboard');
      
      // Check that admin navigation is visible
      await expect(page.getByText('Admin Panel')).toBeVisible();
      
      // Verify admin dashboard is accessible
      await expect(page.getByText('Analytics Dashboard')).toBeVisible();
      await expect(page.getByText('User Statistics')).toBeVisible();
      await expect(page.getByText('Document Statistics')).toBeVisible();
    });

    test('should allow admin to access user management', async ({ page }) => {
      // Navigate to user management (authentication handled by storage state)
      await page.goto('/admin/users');
      
      // Verify user management interface
      await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
      await expect(page.getByText('Add User')).toBeVisible();
      await expect(page.getByText('Filters')).toBeVisible();
      
      // Check that users are displayed
      await expect(page.getByText('System Administrator')).toBeVisible();
      await expect(page.getByText('Sarah Buyer')).toBeVisible();
      await expect(page.getByText('Mike Viewer')).toBeVisible();
      
      // Verify role badges are displayed
      await expect(page.locator('span:has-text("Administrator")').first()).toBeVisible();
      await expect(page.locator('span:has-text("Buyer")').last()).toBeVisible();
      await expect(page.locator('span:has-text("Viewer")').last()).toBeVisible();
    });

    test('should allow admin to create new users', async ({ page }) => {
      // Navigate to user management (authentication handled by storage state)
      await page.goto('/admin/users');
      
      // Click Add User button
      await page.click('text=Add User');
      
      // Verify add user dialog opens
      await expect(page.getByText('Add New User')).toBeVisible();
      await expect(page.getByText('Create a new user account with appropriate role and permissions.')).toBeVisible();
      
      // Fill in new user details
      await page.fill('input[placeholder="Enter full name"]', 'Test New User');
      await page.fill('input[placeholder="Enter email address"]', 'newuser@test.com');
      
      // Select role
      await page.selectOption('div:has(h2:has-text("Add New User")) select', 'buyer');
      
      // Submit form
      await page.click('text=Create User');
      
      // Verify dialog closes (user would be created in real implementation)
      await expect(page.getByText('Add New User')).not.toBeVisible();
    });
  });

  // Note: Role-based access restriction tests for buyer and viewer are now in separate files:
  // - buyer-role.spec.ts
  // - viewer-role.spec.ts

  test.describe('User Interface and Navigation', () => {
    test('should show correct navigation for admin user', async ({ page }) => {
      // Navigate to dashboard (authentication handled by storage state)
      await page.goto('/dashboard');
      
      // Check sidebar navigation
      await expect(page.getByText('Admin Panel')).toBeVisible();
      await expect(page.getByRole('link', { name: 'User Management' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByText('Investment Highlights')).toBeVisible();
      await expect(page.getByText('Business Details')).toBeVisible();
      await expect(page.locator('a[href="/#due-diligence"]')).toBeVisible();
    });

    test('should display user role information correctly', async ({ page }) => {
      // Navigate to user management (authentication handled by storage state)
      await page.goto('/admin/users');
      
      // Check role statistics cards
      await expect(page.locator('span:has-text("Administrator")').first()).toBeVisible();
      await expect(page.getByText('Qualified Buyer')).toBeVisible();
      await expect(page.getByText('Viewer')).toBeVisible();
      await expect(page.getByText('Guest')).toBeVisible();
      
      // Check user table shows correct roles
      await expect(page.getByText('System Administrator')).toBeVisible();
      await expect(page.getByText(testUsers.admin.email)).toBeVisible();
    });
  });

  test.describe('Analytics Dashboard', () => {
    test('should display analytics dashboard for admin', async ({ page }) => {
      // Navigate to admin panel (authentication handled by storage state)
      await page.goto('/admin');
      
      // Check key metrics are displayed
      await expect(page.getByRole('heading', { name: 'Total Users' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Total Documents' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Avg Session Time' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Document Downloads' })).toBeVisible();
      
      // Check analytics sections
      await expect(page.getByText('User Statistics')).toBeVisible();
      await expect(page.getByText('Document Statistics')).toBeVisible();
      await expect(page.getByText('Most Accessed Documents')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible();
    });
  });

  test.describe('Authentication Flow', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access admin panel without login
      await page.goto('/admin');
      
      // Should be redirected to login page
      await page.waitForURL('/login');
      await expect(page.locator('div.font-semibold.tracking-tight.text-2xl').filter({ hasText: 'Login' })).toBeVisible();
    });

    test('should allow authenticated admin to access admin panel', async ({ page }) => {
      // Navigate to admin panel (authentication handled by storage state)
      await page.goto('/admin');
      await expect(page.getByText('Analytics Dashboard')).toBeVisible();
    });
  });

  test.describe('User Management Features', () => {
    test('should display user management interface', async ({ page }) => {
      // Navigate to user management (authentication handled by storage state)
      await page.goto('/admin/users');
      
      // Verify user management interface
      await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
      await expect(page.getByText('Add User')).toBeVisible();
      await expect(page.getByText('System Administrator')).toBeVisible();
      await expect(page.getByText('Sarah Buyer')).toBeVisible();
    });

    test('should display user actions menu', async ({ page }) => {
      // Navigate to user management (authentication handled by storage state)
      await page.goto('/admin/users');
      
      // Scope the "Open menu" click to a specific row to avoid ambiguity
      const adminRow = page.getByRole('row', { name: /System Administrator/i });
      await adminRow.getByRole('button', { name: 'Open menu' }).click();
      
      // Verify action menu items
      await expect(page.getByRole('button', { name: 'Edit User' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Activate' }).first()).toBeVisible();
      await expect(page.getByText('Delete User')).toBeVisible();
    });
  });
});
