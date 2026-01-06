import { test, expect } from '@playwright/test';

/**
 * E2E tests for Income CRUD operations
 *
 * Tests cover:
 * - Creating a new income with GST auto-calculation (10%)
 * - Total auto-calculation (subtotal + GST)
 * - Paid/unpaid status toggle
 * - Editing an existing income
 * - Deleting an income with confirmation
 */

test.describe('Income CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to incomes page
    await page.goto('/incomes');
    await page.waitForLoadState('networkidle');
  });

  test('should display incomes page with Add income button', async ({ page }) => {
    // Check page heading
    await expect(page.getByRole('heading', { name: 'Incomes' })).toBeVisible();

    // Check Add income button is visible
    await expect(page.getByRole('button', { name: 'Add income' })).toBeVisible();
  });

  test('should create a new income with GST auto-calculation', async ({ page }) => {
    // Click Add income button
    await page.getByRole('button', { name: 'Add income' }).click();

    // Wait for form to appear (modal)
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in the form
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);

    // Select first client
    const clientSelect = page.getByLabel(/^Client$/i);
    await clientSelect.selectOption({ index: 1 }); // Index 0 is usually empty/placeholder

    // Enter invoice number
    await page.getByLabel(/invoice.*number/i).fill('INV-E2E-001');

    // Enter subtotal (should trigger 10% GST auto-calculation)
    const subtotalInput = page.getByLabel(/^Subtotal/i);
    await subtotalInput.fill('1000.00');

    // GST should auto-calculate to $100 (10% of $1000)
    const gstInput = page.getByLabel(/^GST/i);
    await expect(gstInput).toHaveValue('$100.00');

    // Verify total is shown (should be $1100)
    await expect(page.getByText(/total.*\$1,100\.00/i)).toBeVisible();

    // Add description
    await page.getByLabel(/^Description/i).fill('E2E Test Income');

    // Submit form
    await page.getByRole('button', { name: /create income/i }).click();

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify toast notification appears
    await expect(page.getByText(/income created successfully/i)).toBeVisible();

    // Verify income appears in table
    await expect(page.getByText('E2E Test Income')).toBeVisible();
    await expect(page.getByText('INV-E2E-001')).toBeVisible();
    await expect(page.getByText('$1,100.00')).toBeVisible(); // Total
  });

  test('should validate required fields', async ({ page }) => {
    // Click Add income button
    await page.getByRole('button', { name: 'Add income' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Try to submit empty form
    await page.getByRole('button', { name: /create income/i }).click();

    // Should still show dialog (form validation prevents submission)
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify required attributes exist
    const dateInput = page.getByLabel(/^Date$/i);
    await expect(dateInput).toHaveAttribute('required');

    const subtotalInput = page.getByLabel(/^Subtotal/i);
    await expect(subtotalInput).toHaveAttribute('required');

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('should toggle paid status from unpaid to paid', async ({ page }) => {
    // First create an unpaid income
    await page.getByRole('button', { name: 'Add income' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Client$/i).selectOption({ index: 1 });
    await page.getByLabel(/invoice.*number/i).fill('INV-UNPAID-001');
    await page.getByLabel(/^Subtotal/i).fill('500.00');
    await page.getByLabel(/^Description/i).fill('Test Unpaid Income');

    // Ensure "Paid" checkbox is NOT checked
    const paidCheckbox = page.getByLabel(/^Paid$/i);
    await paidCheckbox.uncheck();

    await page.getByRole('button', { name: /create income/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for income to appear
    await expect(page.getByText('Test Unpaid Income')).toBeVisible();

    // Find the "Unpaid" badge and click it to toggle to Paid
    const unpaidBadge = page.getByText(/^unpaid$/i).first();
    await unpaidBadge.click();

    // Verify toast notification
    await expect(page.getByText(/income marked as paid/i)).toBeVisible();

    // Verify badge changed to "Paid"
    await expect(page.getByText(/^paid$/i).first()).toBeVisible();
  });

  test('should toggle paid status from paid to unpaid', async ({ page }) => {
    // First create a paid income
    await page.getByRole('button', { name: 'Add income' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Client$/i).selectOption({ index: 1 });
    await page.getByLabel(/invoice.*number/i).fill('INV-PAID-001');
    await page.getByLabel(/^Subtotal/i).fill('750.00');
    await page.getByLabel(/^Description/i).fill('Test Paid Income');

    // Check the "Paid" checkbox
    const paidCheckbox = page.getByLabel(/^Paid$/i);
    await paidCheckbox.check();

    await page.getByRole('button', { name: /create income/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for income to appear
    await expect(page.getByText('Test Paid Income')).toBeVisible();

    // Find the "Paid" badge and click it to toggle to Unpaid
    const paidBadge = page.getByText(/^paid$/i).first();
    await paidBadge.click();

    // Verify toast notification
    await expect(page.getByText(/income marked as unpaid/i)).toBeVisible();

    // Verify badge changed to "Unpaid"
    await expect(page.getByText(/^unpaid$/i).first()).toBeVisible();
  });

  test('should edit an existing income', async ({ page }) => {
    // First create an income
    await page.getByRole('button', { name: 'Add income' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Client$/i).selectOption({ index: 1 });
    await page.getByLabel(/invoice.*number/i).fill('INV-EDIT-001');
    await page.getByLabel(/^Subtotal/i).fill('200.00');
    await page.getByLabel(/^Description/i).fill('Original Income Description');

    await page.getByRole('button', { name: /create income/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for income to appear
    await expect(page.getByText('Original Income Description')).toBeVisible();

    // Find and click Edit button (pencil icon) for the income we just created
    const editButtons = page.getByRole('button', { name: /edit/i });
    const firstEditButton = editButtons.first();
    await firstEditButton.click();

    // Wait for edit form to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify form is pre-populated
    await expect(page.getByLabel(/^Description/i)).toHaveValue('Original Income Description');
    await expect(page.getByLabel(/invoice.*number/i)).toHaveValue('INV-EDIT-001');

    // Update fields
    await page.getByLabel(/^Description/i).fill('Updated Income Description');
    await page.getByLabel(/invoice.*number/i).fill('INV-EDIT-002');
    await page.getByLabel(/^Subtotal/i).fill('300.00');

    // Submit the update
    await page.getByRole('button', { name: /update income/i }).click();

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify toast notification
    await expect(page.getByText(/income updated successfully/i)).toBeVisible();

    // Verify updated fields appear in table
    await expect(page.getByText('Updated Income Description')).toBeVisible();
    await expect(page.getByText('INV-EDIT-002')).toBeVisible();
    await expect(page.getByText('Original Income Description')).not.toBeVisible();
  });

  test('should delete an income with confirmation', async ({ page }) => {
    // First create an income to delete
    await page.getByRole('button', { name: 'Add income' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Client$/i).selectOption({ index: 1 });
    await page.getByLabel(/invoice.*number/i).fill('INV-DELETE-001');
    await page.getByLabel(/^Subtotal/i).fill('999.00');
    await page.getByLabel(/^Description/i).fill('To Be Deleted Income');

    await page.getByRole('button', { name: /create income/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for income to appear
    await expect(page.getByText('To Be Deleted Income')).toBeVisible();

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
    await expect(page.getByText(/income deleted successfully/i)).toBeVisible();

    // Verify income is removed from table
    await expect(page.getByText('To Be Deleted Income')).not.toBeVisible();
  });

  test('should cancel deletion when Cancel is clicked', async ({ page }) => {
    // First create an income
    await page.getByRole('button', { name: 'Add income' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Client$/i).selectOption({ index: 1 });
    await page.getByLabel(/invoice.*number/i).fill('INV-KEEP-001');
    await page.getByLabel(/^Subtotal/i).fill('150.00');
    await page.getByLabel(/^Description/i).fill('Should Not Be Deleted Income');

    await page.getByRole('button', { name: /create income/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for income to appear
    await expect(page.getByText('Should Not Be Deleted Income')).toBeVisible();

    // Click Delete button
    const deleteButtons = page.getByRole('button', { name: /delete/i });
    await deleteButtons.first().click();

    // Wait for confirmation dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();

    // Click Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Confirmation dialog should close
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // Income should still be in table
    await expect(page.getByText('Should Not Be Deleted Income')).toBeVisible();
  });

  test('should handle empty state when no incomes exist', async ({ page }) => {
    // Check if empty state exists (if no incomes in database)
    const incomes = page.getByRole('row');
    const incomeCount = await incomes.count();

    if (incomeCount === 0) {
      // Check for empty state
      await expect(page.getByText(/no incomes yet/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /add.*first income/i })).toBeVisible();
    }
  });

  test('should calculate total correctly (subtotal + GST)', async ({ page }) => {
    // Click Add income button
    await page.getByRole('button', { name: 'Add income' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill basic fields
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/^Date$/i).fill(today);
    await page.getByLabel(/^Client$/i).selectOption({ index: 1 });

    // Enter subtotal of $1,234.56
    await page.getByLabel(/^Subtotal/i).fill('1234.56');

    // GST should be $123.46 (10% of $1,234.56, rounded)
    const gstInput = page.getByLabel(/^GST/i);
    await expect(gstInput).toHaveValue('$123.46');

    // Total should be $1,358.02 ($1,234.56 + $123.46)
    await expect(page.getByText(/total.*\$1,358\.02/i)).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });
});
