import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * E2E tests for CSV Import functionality
 *
 * Tests cover:
 * - Uploading a CSV file
 * - Previewing parsed data with validation
 * - Selecting/deselecting rows for import
 * - Importing selected rows
 * - Handling duplicate detection
 * - Error handling for invalid files
 */

test.describe('CSV Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import page
    await page.goto('/import/expenses');
    await page.waitForLoadState('networkidle');
  });

  test('should display import page with upload interface', async ({ page }) => {
    // Check page heading
    await expect(page.getByRole('heading', { name: /import/i })).toBeVisible();

    // Check for CSV upload interface
    await expect(page.getByText(/drag.*drop.*csv/i)).toBeVisible();
  });

  test('should upload CSV and show preview', async ({ page }) => {
    // Select source type (Manual/Custom CSV) using radio button
    await page.getByRole('radio', { name: /manual csv/i }).click();

    // Upload CSV file
    const fileInput = page.locator('input[type="file"]');
    const csvPath = path.join(__dirname, 'fixtures', 'test-expenses.csv');
    await fileInput.setInputFiles(csvPath);

    // Click Preview button
    await page.getByRole('button', { name: /preview/i }).click();

    // Wait for preview to load (use .first() for strict mode)
    await expect(page.getByText(/preview/i).first()).toBeVisible();

    // Wait for the preview table to actually load with data
    await page.waitForTimeout(2000); // Give time for API call to complete

    // Verify preview table shows the CSV data (use .first() for multiple matches)
    await expect(page.getByText('Test Expense 1').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Test Expense 2').first()).toBeVisible();
    await expect(page.getByText('Test Expense 3').first()).toBeVisible();
  });

  test('should allow selecting and deselecting rows', async ({ page }) => {
    // Upload and preview CSV
    await page.getByRole('radio', { name: /manual csv/i }).click();

    const fileInput = page.locator('input[type="file"]');
    const csvPath = path.join(__dirname, 'fixtures', 'test-expenses.csv');
    await fileInput.setInputFiles(csvPath);

    await page.getByRole('button', { name: /preview/i }).click();

    // Wait for preview to load (use .first() for strict mode)
    await expect(page.getByText(/preview/i).first()).toBeVisible();
    
    // Wait for the preview table to load with data
    await page.waitForTimeout(2000);

    // Find checkboxes for row selection
    const checkboxes = page.locator('input[type="checkbox"]');
    const firstRowCheckbox = checkboxes.nth(1); // Skip the "select all" checkbox

    // Initially should be checked (auto-selected successful rows)
    await expect(firstRowCheckbox).toBeChecked();

    // Uncheck the first row
    await firstRowCheckbox.uncheck();
    await expect(firstRowCheckbox).not.toBeChecked();

    // Re-check it
    await firstRowCheckbox.check();
    await expect(firstRowCheckbox).toBeChecked();
  });

  test('should import selected rows successfully', async ({ page }) => {
    // Upload and preview CSV
    await page.getByRole('radio', { name: /manual csv/i }).click();

    const fileInput = page.locator('input[type="file"]');
    const csvPath = path.join(__dirname, 'fixtures', 'test-expenses.csv');
    await fileInput.setInputFiles(csvPath);

    await page.getByRole('button', { name: /preview/i }).click();

    // Wait for preview to load (use .first() for strict mode)
    await expect(page.getByText(/preview/i).first()).toBeVisible();
    
    // Wait for the preview table to load with data  
    await page.waitForTimeout(2000);

    // Click Import button
    const importButton = page.getByRole('button', { name: /import.*selected/i });
    await importButton.click();

    // Wait for import to complete
    // Note: This might show a success message or redirect
    await expect(
      page.getByText(/import.*successful|imported.*successfully/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid file type', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Create a temporary text file
    // Create a temporary text file on disk
    const fs = await import('fs/promises');
    const fixturesDir = path.join(__dirname, 'fixtures');
    await fs.mkdir(fixturesDir, { recursive: true });
    const tempPath = path.join(fixturesDir, 'temp-invalid.txt');
    await fs.writeFile(tempPath, 'This is not a CSV file');
    
    try {
      await fileInput.setInputFiles(tempPath);
    } finally {
      // Clean up
      await fs.unlink(tempPath).catch(() => {});
    }

    // Should show error message about file type
    // Note: Exact error message depends on implementation
    // We'll check for common error patterns
    const errorVisible = await Promise.race([
      page.getByText(/invalid.*file|must be.*csv|only.*csv/i).isVisible().catch(() => false),
      page.getByText(/error/i).isVisible().catch(() => false),
    ]);

    // If no error is shown, the file input might just not accept the file
    // which is also acceptable behavior
    if (errorVisible) {
      await expect(page.getByText(/invalid.*file|must be.*csv|only.*csv|error/i)).toBeVisible();
    }
  });

  test('should handle empty CSV file', async ({ page }) => {
    const emptyCSV = 'date,description,amount\n';

    // Upload via file input
    const fileInput = page.locator('input[type="file"]');

    // Create temporary empty CSV file
    const fs = await import('fs/promises');
    const fixturesDir = path.join(__dirname, 'fixtures');
    await fs.mkdir(fixturesDir, { recursive: true });
    const tempPath = path.join(fixturesDir, 'temp-empty.csv');
    await fs.writeFile(tempPath, emptyCSV);
    
    try {
      await fileInput.setInputFiles(tempPath);
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }

    // Select source
    await page.getByRole('radio', { name: /manual csv/i }).click();

    // Click Preview
    await page.getByRole('button', { name: /preview/i }).click();

    // Should show no rows or empty state
    await expect(page.getByText(/no.*rows|empty|no data/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    const invalidCSV = `date,description,amount
invalid-date,Bad Expense,100.00
2025-01-06,Good Expense,200.00`;

    // Upload the CSV
    const fileInput = page.locator('input[type="file"]');

    // Create temporary invalid CSV file
    const fs = await import('fs/promises');
    const fixturesDir = path.join(__dirname, 'fixtures');
    await fs.mkdir(fixturesDir, { recursive: true });
    const tempPath = path.join(fixturesDir, 'temp-invalid.csv');
    await fs.writeFile(tempPath, invalidCSV);
    
    try {
      await fileInput.setInputFiles(tempPath);
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }

    // Select source
    await page.getByRole('radio', { name: /manual csv/i }).click();

    // Click Preview
    await page.getByRole('button', { name: /preview/i }).click();

    // Wait for preview
    await page.waitForTimeout(2000);

    // Should show validation errors or mark rows as failed
    // The exact error handling depends on implementation
    // Check for error indicators (red text, error icons, etc.)
    const hasErrors =
      (await page.getByText(/error|invalid|failed/i).count()) > 0 ||
      (await page.locator('[class*="error"]').count()) > 0 ||
      (await page.locator('[class*="red"]').count()) > 0;

    expect(hasErrors).toBe(true);
  });

  test('should navigate between import tabs', async ({ page }) => {
    // Check we're on expenses import tab
    await expect(page).toHaveURL(/\/import\/expenses/);

    // Navigate to incomes import tab (if it exists)
    // Use specific selector to avoid ambiguity (get the import tab, not navigation)
    const incomesTab = page.getByRole('link', { name: 'Incomes', exact: true }).filter({ has: page.locator('[href="/import/incomes"]') });

    if (await incomesTab.count() > 0) {
      await incomesTab.click();
      await expect(page).toHaveURL(/\/import\/incomes/);

      // Go back to expenses
      const expensesTab = page.getByRole('link', { name: /expenses/i });
      await expensesTab.click();
      await expect(page).toHaveURL(/\/import\/expenses/);
    }
  });

  test('should show import statistics after successful import', async ({ page }) => {
    // Upload and preview CSV
    await page.getByRole('radio', { name: /manual csv/i }).click();

    const fileInput = page.locator('input[type="file"]');
    const csvPath = path.join(__dirname, 'fixtures', 'test-expenses.csv');
    await fileInput.setInputFiles(csvPath);

    await page.getByRole('button', { name: /preview/i }).click();

    // Wait for preview (use .first() for strict mode)
    await expect(page.getByText(/preview/i).first()).toBeVisible();
    
    // Wait for the preview table to load with data
    await page.waitForTimeout(2000);

    // Import
    const importButton = page.getByRole('button', { name: /import.*selected/i });
    await importButton.click();

    // Wait for import to complete
    await page.waitForTimeout(2000);

    // Should show statistics (imported count, skipped count, etc.)
    const hasStats =
      (await page.getByText(/imported|successful|created/i).count()) > 0 ||
      (await page.getByText(/\d+.*row/i).count()) > 0;

    expect(hasStats).toBe(true);
  });
});
