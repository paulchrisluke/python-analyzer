import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  
  test('should display business metrics from ETL data', async ({ page }) => {
    await page.goto('/');
    
    // Check for business metrics cards using actual text from InvestmentHighlights component
    await expect(page.locator('text=Gross Revenue').first()).toBeVisible();
    await expect(page.locator('text=EBITDA').first()).toBeVisible();
    await expect(page.locator('text=Asking Price').first()).toBeVisible();
    await expect(page.locator('text=Cash Flow (EBITDA)').first()).toBeVisible();
  });

  test('should display investment highlights', async ({ page }) => {
    await page.goto('/');
    
    // Check for investment metrics using actual text from components
    await expect(page.locator('text=Asking Price').first()).toBeVisible();
    await expect(page.locator('text=Cash Flow (EBITDA)').first()).toBeVisible();
    await expect(page.locator('text=Gross Revenue').first()).toBeVisible();
  });

  test('should display business details section', async ({ page }) => {
    await page.goto('/');
    
    // Check for business information
    await expect(page.getByText('Business Details')).toBeVisible();
    await expect(page.getByText('Cranberry Hearing & Balance Center')).toBeVisible();
  });

  test('should display due diligence documents section', async ({ page }) => {
    await page.goto('/');
    
    // Check for due diligence section using actual text from components
    await expect(page.locator('#due-diligence-documents').getByText('Due Diligence Documents')).toBeVisible();
    await expect(page.locator('text=Financial Documents').first()).toBeVisible();
    await expect(page.locator('text=Operational Documents').first()).toBeVisible();
    await expect(page.locator('text=Request Full Due Diligence Package').first()).toBeVisible();
  });

  test('should display location information', async ({ page }) => {
    await page.goto('/');
    
    // Check for location details using more specific selectors
    await expect(page.getByText('Location Information')).toBeVisible();
    await expect(page.locator('text=Cranberry Township').first()).toBeVisible();
    await expect(page.locator('text=Pittsburgh').first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check sidebar navigation using more specific selectors
    await expect(page.getByText('Investment Highlights')).toBeVisible();
    await expect(page.getByText('Business Details')).toBeVisible();
    await expect(page.getByText('Location Information')).toBeVisible();
    await expect(page.locator('text=Due Diligence').first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is visible on mobile
    await expect(page.getByText('Cranberry Hearing & Balance Center')).toBeVisible();
    await expect(page.getByText('Established Two-Location Audiology Practice Available')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check that layout adapts to tablet using more specific selectors
    await expect(page.locator('text=Due Diligence Documents').first()).toBeVisible();
    await expect(page.getByText('Investment Highlights')).toBeVisible();
  });
});


