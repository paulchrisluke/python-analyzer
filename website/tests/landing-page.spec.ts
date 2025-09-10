import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  
  test('should display business metrics from ETL data', async ({ page }) => {
    await page.goto('/');
    
    // Check for business metrics cards
    await expect(page.getByText('Annual Revenue')).toBeVisible();
    await expect(page.getByText('EBITDA Margin')).toBeVisible();
    await expect(page.getByText('ROI Potential')).toBeVisible();
    await expect(page.getByText('Equipment Value')).toBeVisible();
  });

  test('should display investment highlights', async ({ page }) => {
    await page.goto('/');
    
    // Check for investment metrics
    await expect(page.getByText('Asking Price')).toBeVisible();
    await expect(page.getByText('Payback Period')).toBeVisible();
    await expect(page.getByText('Monthly Cash Flow')).toBeVisible();
  });

  test('should display business details section', async ({ page }) => {
    await page.goto('/');
    
    // Check for business information
    await expect(page.getByText('Business Details')).toBeVisible();
    await expect(page.getByText('Cranberry Hearing & Balance Center')).toBeVisible();
  });

  test('should display due diligence documents section', async ({ page }) => {
    await page.goto('/');
    
    // Check for due diligence section
    await expect(page.getByText('Due Diligence')).toBeVisible();
    await expect(page.getByText('Financial Reports')).toBeVisible();
    await expect(page.getByText('Equipment Analysis')).toBeVisible();
    await expect(page.getByText('Legal Documents')).toBeVisible();
  });

  test('should display location information', async ({ page }) => {
    await page.goto('/');
    
    // Check for location details
    await expect(page.getByText('Location Information')).toBeVisible();
    await expect(page.getByText('Cranberry Township')).toBeVisible();
    await expect(page.getByText('Pittsburgh')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check sidebar navigation
    await expect(page.getByText('Investment Highlights')).toBeVisible();
    await expect(page.getByText('Business Details')).toBeVisible();
    await expect(page.getByText('Location Information')).toBeVisible();
    await expect(page.getByText('Due Diligence')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is visible on mobile
    await expect(page.getByText('Cranberry Hearing & Balance Center')).toBeVisible();
    await expect(page.getByText('Business Sale Overview')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check that layout adapts to tablet
    await expect(page.getByText('Due Diligence Documents')).toBeVisible();
    await expect(page.getByText('Investment Highlights')).toBeVisible();
  });
});


