import { test, expect } from '@playwright/test';

// Test data for different user roles
const testUsers = {
  admin: {
    email: 'newadmin@cranberryhearing.com',
    password: 'adminpassword123',
    name: 'Admin User',
    role: 'admin'
  },
  buyer: {
    email: 'buyer@example.com',
    password: 'buyerpassword123',
    name: 'Sarah Buyer',
    role: 'buyer'
  },
  viewer: {
    email: 'viewer@example.com',
    password: 'viewerpassword123',
    name: 'Mike Viewer',
    role: 'viewer'
  }
};

test.describe('Admin Role System', () => {
  
  test.describe('Admin User Access', () => {
    test('should allow admin to login and access admin panel', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');
      
      // Fill in admin credentials
      await page.getByLabel('Email').fill(testUsers.admin.email);
      await page.getByLabel('Password').fill(testUsers.admin.password);
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Wait for redirect and verify we're logged in
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Check that admin navigation is visible
      await expect(page.getByText('Admin Panel')).toBeVisible();
      await expect(page.getByRole('link', { name: 'User Management' })).toBeVisible();
      
      // Navigate to admin panel
      await page.click('text=Admin Panel');
      await page.waitForURL('/admin');
      
      // Verify admin dashboard is accessible
      await expect(page.getByText('Analytics Dashboard')).toBeVisible();
      await expect(page.getByText('User Statistics')).toBeVisible();
      await expect(page.getByText('Document Statistics')).toBeVisible();
    });

    test('should allow admin to access user management', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.admin.email);
      await page.getByLabel('Password').fill(testUsers.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Navigate to user management
      await page.click('text=User Management');
      await page.waitForURL('/admin/users');
      
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
      // Login as admin
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.admin.email);
      await page.getByLabel('Password').fill(testUsers.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Navigate to user management
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
      await page.click('text=Select role');
      await page.click('text=Qualified Buyer');
      
      // Submit form
      await page.click('text=Create User');
      
      // Verify dialog closes (user would be created in real implementation)
      await expect(page.getByText('Add New User')).not.toBeVisible();
    });
  });

  test.describe('Role-Based Access Restrictions', () => {
    test('should prevent buyer from accessing admin panel', async ({ page }) => {
      // Login as buyer
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.buyer.email);
      await page.getByLabel('Password').fill(testUsers.buyer.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Verify admin navigation is NOT visible
      await expect(page.getByText('Admin Panel')).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'User Management' })).not.toBeVisible();
      
      // Try to navigate directly to admin panel
      await page.goto('/admin');
      
      // Should be redirected to dashboard (not admin panel)
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Verify we're on dashboard, not admin panel
      await expect(page.getByText('Analytics Dashboard')).not.toBeVisible();
    });

    test('should prevent viewer from accessing admin panel', async ({ page }) => {
      // Login as viewer
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.viewer.email);
      await page.getByLabel('Password').fill(testUsers.viewer.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Verify admin navigation is NOT visible
      await expect(page.getByText('Admin Panel')).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'User Management' })).not.toBeVisible();
      
      // Try to navigate directly to admin panel
      await page.goto('/admin');
      
      // Should be redirected to dashboard
      await page.waitForURL('/dashboard', { timeout: 15000 });
    });

    test('should show access denied for non-admin users', async ({ page }) => {
      // Login as buyer
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.buyer.email);
      await page.getByLabel('Password').fill(testUsers.buyer.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Try to access admin users page directly
      await page.goto('/admin/users');
      
      // Should be redirected to dashboard
      await page.waitForURL('/dashboard', { timeout: 15000 });
    });
  });

  test.describe('User Interface and Navigation', () => {
    test('should show correct navigation for admin user', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.admin.email);
      await page.getByLabel('Password').fill(testUsers.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Check sidebar navigation
      await expect(page.getByText('Admin Panel')).toBeVisible();
      await expect(page.getByRole('link', { name: 'User Management' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByText('Investment Highlights')).toBeVisible();
      await expect(page.getByText('Business Details')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Due Diligence' })).toBeVisible();
    });

    test('should show correct navigation for buyer user', async ({ page }) => {
      // Login as buyer
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.buyer.email);
      await page.getByLabel('Password').fill(testUsers.buyer.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Check sidebar navigation (should NOT include admin items)
      await expect(page.getByText('Admin Panel')).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'User Management' })).not.toBeVisible();
      
      // Should include regular navigation items
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByText('Investment Highlights')).toBeVisible();
      await expect(page.getByText('Business Details')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Due Diligence' })).toBeVisible();
    });

    test('should display user role information correctly', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.admin.email);
      await page.getByLabel('Password').fill(testUsers.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Navigate to user management
      await page.goto('/admin/users');
      
      // Check role statistics cards
      await expect(page.getByText('Administrator')).toBeVisible();
      await expect(page.getByText('Qualified Buyer')).toBeVisible();
      await expect(page.getByText('Viewer')).toBeVisible();
      await expect(page.getByText('Guest')).toBeVisible();
      
      // Check user table shows correct roles
      await expect(page.getByText('System Administrator')).toBeVisible();
      await expect(page.getByText('admin@cranberryhearing.com')).toBeVisible();
    });
  });

  test.describe('Analytics Dashboard', () => {
    test('should display analytics dashboard for admin', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.admin.email);
      await page.getByLabel('Password').fill(testUsers.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Navigate to admin panel
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

    test('should redirect to original page after login', async ({ page }) => {
      // Try to access admin panel
      await page.goto('/admin');
      await page.waitForURL('/login');
      
      // Login
      await page.getByLabel('Email').fill(testUsers.admin.email);
      await page.getByLabel('Password').fill(testUsers.admin.password);
      await page.click('button[type="submit"]');
      
      // Should be redirected to admin panel
      await page.waitForURL('/admin');
      await expect(page.getByText('Analytics Dashboard')).toBeVisible();
    });
  });

  test.describe('User Management Features', () => {
    test('should allow admin to search and filter users', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.admin.email);
      await page.getByLabel('Password').fill(testUsers.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Navigate to user management
      await page.goto('/admin/users');
      
      // Test search functionality
      await page.fill('input[placeholder="Search by name or email..."]', 'admin');
      await expect(page.getByText('System Administrator')).toBeVisible();
      await expect(page.getByText('Sarah Buyer')).not.toBeVisible();
      
      // Clear search
      await page.fill('input[placeholder="Search by name or email..."]', '');
      
      // Test role filter
      await page.click('text=All Roles');
      await page.click('text=Administrator');
      await expect(page.getByText('System Administrator')).toBeVisible();
      await expect(page.getByText('Sarah Buyer')).not.toBeVisible();
    });

    test('should display user actions menu', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUsers.admin.email);
      await page.getByLabel('Password').fill(testUsers.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Navigate to user management
      await page.goto('/admin/users');
      
      // Click on user actions menu
      await page.click('button[aria-label="Open menu"]');
      
      // Verify action menu items
      await expect(page.getByText('Edit User')).toBeVisible();
      await expect(page.getByText('Activate')).toBeVisible();
      await expect(page.getByText('Delete User')).toBeVisible();
    });
  });
});
