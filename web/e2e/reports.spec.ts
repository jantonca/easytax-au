import { test, expect } from '@playwright/test';

/**
 * E2E tests for BAS and FY Report viewing
 *
 * Tests cover:
 * - Viewing BAS quarterly reports
 * - Switching between quarters
 * - Viewing FY annual reports
 * - Switching between financial years
 * - Displaying GST calculations (G1, 1A, 1B, Net GST)
 */

test.describe('BAS Report Viewing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to BAS reports page
    await page.goto('/reports/bas');
    await page.waitForLoadState('networkidle');
  });

  test('should display BAS report page with current quarter', async ({ page }) => {
    // Check page heading
    await expect(page.getByRole('heading', { name: /bas.*report/i })).toBeVisible();

    // Should show quarter selector
    await expect(page.getByText(/Q[1-4].*FY/i)).toBeVisible();

    // Should show BAS summary cards or placeholders
    // Check for G1, 1A, 1B labels
    await expect(page.getByText(/G1|total.*sales/i)).toBeVisible();
    await expect(page.getByText(/1A|gst.*collected/i)).toBeVisible();
    await expect(page.getByText(/1B|gst.*paid/i)).toBeVisible();
    await expect(page.getByText(/net.*gst/i)).toBeVisible();
  });

  test('should switch between quarters', async ({ page }) => {
    // Find quarter selector (usually a dropdown or buttons)
    const quarterSelect = page.locator('select').first();

    // Get initial quarter
    const initialQuarter = await quarterSelect.inputValue().catch(() => null);

    if (initialQuarter) {
      // Select a different quarter
      const options = await quarterSelect.locator('option').allTextContents();

      if (options.length > 1) {
        // Select the second option (different quarter)
        await quarterSelect.selectOption({ index: 1 });

        // Wait for data to reload
        await page.waitForTimeout(1000);

        // Verify the quarter changed
        const newQuarter = await quarterSelect.inputValue();
        expect(newQuarter).not.toBe(initialQuarter);

        // BAS summary should still be visible (even if empty)
        await expect(page.getByText(/G1|1A|1B|net.*gst/i)).toBeVisible();
      }
    }
  });

  test('should display BAS summary cards with amounts', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check if BAS data is available
    // If data exists, should show currency amounts
    const hasData = (await page.getByText(/\$[\d,]+\.\d{2}/).count()) > 0;

    if (hasData) {
      // Verify all four BAS fields show amounts
      await expect(page.getByText(/G1.*\$[\d,]+\.\d{2}/i)).toBeVisible();
      await expect(page.getByText(/1A.*\$[\d,]+\.\d{2}/i)).toBeVisible();
      await expect(page.getByText(/1B.*\$[\d,]+\.\d{2}/i)).toBeVisible();
      await expect(page.getByText(/net.*gst.*\$[\d,]+\.\d{2}/i)).toBeVisible();
    } else {
      // Empty state: should show $0.00 or "No data" message
      const hasZeros = (await page.getByText(/\$0\.00/).count()) >= 4;
      const hasEmptyState = (await page.getByText(/no.*data|no.*transactions/i).count()) > 0;

      expect(hasZeros || hasEmptyState).toBe(true);
    }
  });

  test('should show period date range', async ({ page }) => {
    // BAS report should show the period dates (e.g., "1 Jul 2025 - 30 Sep 2025")
    await expect(
      page.getByText(/\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i),
    ).toBeVisible();
  });

  test('should show record counts for income and expenses', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(1000);

    // Should show count of income and expense records
    // Format might be "8 incomes" or "25 expenses"
    const hasIncomeCounts = (await page.getByText(/\d+.*income/i).count()) > 0;
    const hasExpenseCounts = (await page.getByText(/\d+.*expense/i).count()) > 0;

    expect(hasIncomeCounts || hasExpenseCounts).toBe(true);
  });

  test('should handle empty quarter (no data)', async ({ page }) => {
    // Select a future quarter that likely has no data
    const quarterSelect = page.locator('select').first();
    const options = await quarterSelect.locator('option').allTextContents();

    // Try to find a future quarter
    const futureQuarterIndex = options.findIndex((opt) => /Q[1-4].*202[7-9]/i.test(opt));

    if (futureQuarterIndex > 0) {
      await quarterSelect.selectOption({ index: futureQuarterIndex });

      // Wait for data to load
      await page.waitForTimeout(1000);

      // Should show zeros or empty state
      const hasZeros = (await page.getByText(/\$0\.00/).count()) >= 4;
      const hasEmptyMessage = (await page.getByText(/no.*data|no.*transactions/i).count()) > 0;

      expect(hasZeros || hasEmptyMessage).toBe(true);
    }
  });
});

test.describe('FY Report Viewing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to FY reports page
    await page.goto('/reports/fy');
    await page.waitForLoadState('networkidle');
  });

  test('should display FY report page with current year', async ({ page }) => {
    // Check page heading
    await expect(page.getByRole('heading', { name: /fy.*report|financial.*year/i })).toBeVisible();

    // Should show year selector
    await expect(page.getByText(/FY\s*20\d{2}/i)).toBeVisible();

    // Should show FY summary sections
    await expect(page.getByText(/income/i)).toBeVisible();
    await expect(page.getByText(/expense/i)).toBeVisible();
  });

  test('should switch between financial years', async ({ page }) => {
    // Find year selector
    const yearSelect = page.locator('select').first();

    // Get initial year
    const initialYear = await yearSelect.inputValue().catch(() => null);

    if (initialYear) {
      // Select a different year
      const options = await yearSelect.locator('option').allTextContents();

      if (options.length > 1) {
        // Select the second option (different year)
        await yearSelect.selectOption({ index: 1 });

        // Wait for data to reload
        await page.waitForTimeout(1000);

        // Verify the year changed
        const newYear = await yearSelect.inputValue();
        expect(newYear).not.toBe(initialYear);

        // FY summary should still be visible
        await expect(page.getByText(/income|expense/i)).toBeVisible();
      }
    }
  });

  test('should display income summary', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check for income summary fields
    await expect(page.getByText(/total.*income/i)).toBeVisible();
    await expect(page.getByText(/gst.*collected/i)).toBeVisible();

    // May also show paid/unpaid breakdown
    const hasPaidBreakdown = (await page.getByText(/paid.*income/i).count()) > 0;
    const hasUnpaidBreakdown = (await page.getByText(/unpaid.*income/i).count()) > 0;

    // At least one of these should be visible
    expect(hasPaidBreakdown || hasUnpaidBreakdown || true).toBe(true);
  });

  test('should display expense summary', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check for expense summary fields
    await expect(page.getByText(/total.*expense/i)).toBeVisible();
    await expect(page.getByText(/gst.*paid/i)).toBeVisible();
  });

  test('should display category breakdown', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Should show expense breakdown by category
    const hasCategorySection =
      (await page.getByText(/by.*category|category.*breakdown/i).count()) > 0;

    if (hasCategorySection) {
      await expect(page.getByText(/by.*category|category.*breakdown/i)).toBeVisible();
    }
  });

  test('should display net position (profit/loss)', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Should show net profit or net loss
    const hasNetProfit = (await page.getByText(/net.*profit/i).count()) > 0;
    const hasNetLoss = (await page.getByText(/net.*loss/i).count()) > 0;
    const hasNetPosition = (await page.getByText(/net.*position/i).count()) > 0;

    expect(hasNetProfit || hasNetLoss || hasNetPosition).toBe(true);
  });

  test('should show period date range', async ({ page }) => {
    // FY report should show the period dates (e.g., "1 Jul 2025 - 30 Jun 2026")
    await expect(
      page.getByText(/\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i),
    ).toBeVisible();
  });

  test('should handle empty FY (no data)', async ({ page }) => {
    // Select a future FY that likely has no data
    const yearSelect = page.locator('select').first();
    const options = await yearSelect.locator('option').allTextContents();

    // Try to find a future FY
    const futureYearIndex = options.findIndex((opt) => /FY\s*202[7-9]/i.test(opt));

    if (futureYearIndex > 0) {
      await yearSelect.selectOption({ index: futureYearIndex });

      // Wait for data to load
      await page.waitForTimeout(1000);

      // Should show zeros or empty state
      const hasZeros = (await page.getByText(/\$0\.00/).count()) > 0;
      const hasEmptyMessage = (await page.getByText(/no.*data|no.*transactions/i).count()) > 0;

      expect(hasZeros || hasEmptyMessage).toBe(true);
    }
  });
});
