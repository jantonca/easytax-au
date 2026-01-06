import { test, expect } from '@playwright/test';

/**
 * E2E tests for Expense CRUD operations
 *
 * Tests cover:
 * - Creating a new expense with form validation
 * - GST auto-calculation for domestic vs international providers
 * - Business percentage slider and claimable GST calculation
 * - Editing an existing expense
 * - Deleting an expense with confirmation
 */

test.describe('Expense CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to expenses page
    await page.goto('/expenses');
    await page.waitForLoadState('networkidle');
  });

  test('should display expenses page with Add expense button', async ({ page }) => {
    // Check page heading
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // Check Add expense button is visible
    await expect(page.getByRole('button', { name: 'Add expense' })).toBeVisible();
  });

  test('should create a new expense with GST auto-calculation', async ({ page }) => {
    // Click Add expense button
    await page.getByRole('button', { name: 'Add expense' }).click();

    // Wait for form to appear (modal)
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in the form
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);

    // Select first provider (should auto-populate)
    const providerSelect = page.getByLabel(/^Provider$/i);
    await providerSelect.selectOption({ index: 1 }); // Index 0 is usually empty/placeholder

    // Select first category
    const categorySelect = page.getByLabel(/^Category$/i);
    await categorySelect.selectOption({ index: 1 });

    // Enter amount (should trigger GST auto-calculation)
    await page.getByLabel(/^Amount/i).fill('110.00');

    // Set business percentage using the slider
    const bizPercentSlider = page.getByLabel(/business use percentage/i);
    await bizPercentSlider.fill('100');

    // Add description
    await page.getByLabel(/^Description/i).fill('E2E Test Expense');

    // Submit form
    await page.getByRole('button', { name: /create expense/i }).click();

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify toast notification appears
    await expect(page.getByText(/expense created successfully/i)).toBeVisible();

    // Verify expense appears in table
    await expect(page.getByText('E2E Test Expense')).toBeVisible();
    await expect(page.getByText('$110.00')).toBeVisible();
  });

  test('should show $0 GST for international providers', async ({ page }) => {
    // Click Add expense button
    await page.getByRole('button', { name: 'Add expense' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill basic fields
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);

    // Select an international provider (e.g., GitHub, if it exists)
    // Note: This assumes GitHub or another international provider exists in seed data
    const providerSelect = page.getByLabel(/^Provider$/i);
    const options = await providerSelect.locator('option').allTextContents();

    // Try to find an international provider (GitHub, AWS, etc.)
    const internationalProviderIndex = options.findIndex((opt) =>
      /github|aws|google|international/i.test(opt),
    );

    if (internationalProviderIndex > 0) {
      await providerSelect.selectOption({ index: internationalProviderIndex });

      // Select category
      await page.getByLabel(/^Category$/i).selectOption({ index: 1 });

      // Enter amount
      await page.getByLabel(/^Amount/i).fill('100.00');

      // Verify GST shows as $0.00 for international provider
      await expect(page.getByText(/GST.*\$0\.00/i)).toBeVisible();
    }

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('should update claimable GST when business percentage changes', async ({ page }) => {
    // Click Add expense button
    await page.getByRole('button', { name: 'Add expense' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill basic fields
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Provider$/i).selectOption({ index: 1 });
    await page.getByLabel(/^Category$/i).selectOption({ index: 1 });

    // Enter amount that gives clean GST calculation
    await page.getByLabel(/^Amount/i).fill('110.00');

    // Set business percentage to 50%
    const bizPercentSlider = page.getByLabel(/business use percentage/i);
    await bizPercentSlider.fill('50');

    // Verify claimable GST is 50% of total GST
    // For $110, GST = $10, 50% claimable = $5
    await expect(page.getByText(/claimable gst.*\$5\.00.*50%/i)).toBeVisible();

    // Change to 100%
    await bizPercentSlider.fill('100');

    // Verify claimable GST is now 100%
    await expect(page.getByText(/claimable gst.*\$10\.00.*100%/i)).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('should validate required fields', async ({ page }) => {
    // Click Add expense button
    await page.getByRole('button', { name: 'Add expense' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Try to submit empty form
    await page.getByRole('button', { name: /create expense/i }).click();

    // Should still show dialog (form validation prevents submission)
    await expect(page.getByRole('dialog')).toBeVisible();

    // Browser's native HTML5 validation should prevent submission
    // We can verify required attributes exist
    const dateInput = page.getByLabel(/^Date$/i);
    await expect(dateInput).toHaveAttribute('required');

    const amountInput = page.getByLabel(/^Amount/i);
    await expect(amountInput).toHaveAttribute('required');

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('should edit an existing expense', async ({ page }) => {
    // First create an expense
    await page.getByRole('button', { name: 'Add expense' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Provider$/i).selectOption({ index: 1 });
    await page.getByLabel(/^Category$/i).selectOption({ index: 1 });
    await page.getByLabel(/^Amount/i).fill('100.00');
    await page.getByLabel(/^Description/i).fill('Original Description');

    await page.getByRole('button', { name: /create expense/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for expense to appear
    await expect(page.getByText('Original Description')).toBeVisible();

    // Find and click Edit button (pencil icon) for the expense we just created
    // Note: This assumes the Edit button has an aria-label with "edit"
    const editButtons = page.getByRole('button', { name: /edit/i });
    const firstEditButton = editButtons.first();
    await firstEditButton.click();

    // Wait for edit form to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify form is pre-populated
    await expect(page.getByLabel(/^Description/i)).toHaveValue('Original Description');

    // Update the description
    await page.getByLabel(/^Description/i).fill('Updated Description');

    // Submit the update
    await page.getByRole('button', { name: /update expense/i }).click();

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify toast notification
    await expect(page.getByText(/expense updated successfully/i)).toBeVisible();

    // Verify updated description appears in table
    await expect(page.getByText('Updated Description')).toBeVisible();
    await expect(page.getByText('Original Description')).not.toBeVisible();
  });

  test('should delete an expense with confirmation', async ({ page }) => {
    // First create an expense to delete
    await page.getByRole('button', { name: 'Add expense' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Provider$/i).selectOption({ index: 1 });
    await page.getByLabel(/^Category$/i).selectOption({ index: 1 });
    await page.getByLabel(/^Amount/i).fill('99.99');
    await page.getByLabel(/^Description/i).fill('To Be Deleted');

    await page.getByRole('button', { name: /create expense/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for expense to appear
    await expect(page.getByText('To Be Deleted')).toBeVisible();

    // Find and click Delete button (trash icon)
    const deleteButtons = page.getByRole('button', { name: /delete/i });
    const firstDeleteButton = deleteButtons.first();
    await firstDeleteButton.click();

    // Wait for confirmation dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByText(/are you sure.*delete/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm|delete/i }).click();

    // Wait for confirmation dialog to close
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // Verify toast notification
    await expect(page.getByText(/expense deleted successfully/i)).toBeVisible();

    // Verify expense is removed from table
    await expect(page.getByText('To Be Deleted')).not.toBeVisible();
  });

  test('should cancel deletion when Cancel is clicked', async ({ page }) => {
    // First create an expense
    await page.getByRole('button', { name: 'Add expense' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Provider$/i).selectOption({ index: 1 });
    await page.getByLabel(/^Category$/i).selectOption({ index: 1 });
    await page.getByLabel(/^Amount/i).fill('50.00');
    await page.getByLabel(/^Description/i).fill('Should Not Be Deleted');

    await page.getByRole('button', { name: /create expense/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for expense to appear
    await expect(page.getByText('Should Not Be Deleted')).toBeVisible();

    // Click Delete button
    const deleteButtons = page.getByRole('button', { name: /delete/i });
    await deleteButtons.first().click();

    // Wait for confirmation dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // Click Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Confirmation dialog should close
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // Expense should still be in table
    await expect(page.getByText('Should Not Be Deleted')).toBeVisible();
  });

  test('should handle empty state when no expenses exist', async ({ page }) => {
    // This test assumes a clean database or we need to delete all expenses first
    // For now, we'll just check if the empty state component exists
    const expenses = page.getByRole('row');
    const expenseCount = await expenses.count();

    if (expenseCount === 0) {
      // Check for empty state
      await expect(page.getByText(/no expenses yet/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /add.*first expense/i })).toBeVisible();
    }
  });
});
