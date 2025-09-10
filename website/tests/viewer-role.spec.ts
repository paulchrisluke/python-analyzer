import { test, expect } from '@playwright/test';
import { getTestUsers, validateTestEnvironment } from './fixtures/test-users';

// Validate environment variables before running tests
validateTestEnvironment();

// Get test users from environment variables
const testUsers = getTestUsers();

test.describe('Viewer Role Access Restrictions', () => {
  test('should prevent viewer from accessing admin panel', async ({ page }) => {
    // Navigate to dashboard (authentication handled by storage state)
    await page.goto('/dashboard');
    
    // Verify admin navigation is NOT present (count-based assertion)
    await expect(page.getByText('Admin Panel')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'User Management' })).toHaveCount(0);
    
    // Try to navigate directly to admin panel
    await page.goto('/admin');
    
    // Should be redirected to dashboard (not admin panel) - use regex for robust matching
    await expect(page).toHaveURL(/\/dashboard(?:$|[?#])/);
    
    // Verify we're on dashboard, not admin panel (count-based assertion for admin content)
    await expect(page.getByText('Analytics Dashboard')).toHaveCount(0);
  });

  test('should show correct navigation for viewer user', async ({ page }) => {
    // Navigate to dashboard (authentication handled by storage state)
    await page.goto('/dashboard');
    
    // Check sidebar navigation (should NOT include admin items)
    await expect(page.getByText('Admin Panel')).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'User Management' })).not.toBeVisible();
    
    // Should include regular navigation items
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Investment Highlights')).toBeVisible();
    await expect(page.getByText('Business Details')).toBeVisible();
    await expect(page.locator('a[href="/#due-diligence-documents"]')).toBeVisible();
  });
});
