# E2E Tests for EasyTax-AU Web Frontend

This directory contains end-to-end tests using Playwright to validate critical user flows.

## Test Coverage

### 1. Expense CRUD (`expense.spec.ts`)
- ✅ Creating expenses with GST auto-calculation
- ✅ GST calculation for domestic vs international providers
- ✅ Business percentage slider and claimable GST
- ✅ Editing expenses
- ✅ Deleting expenses with confirmation
- ✅ Form validation

### 2. Income CRUD (`income.spec.ts`)
- ✅ Creating incomes with GST auto-calculation (10%)
- ✅ Total calculation (subtotal + GST)
- ✅ Paid/unpaid status toggle
- ✅ Editing incomes
- ✅ Deleting incomes with confirmation
- ✅ Form validation

### 3. CSV Import (`import.spec.ts`)
- ✅ Uploading CSV files
- ✅ Previewing parsed data
- ✅ Selecting/deselecting rows
- ✅ Importing selected rows
- ✅ Error handling for invalid files
- ✅ Validation error display

### 4. Reports (`reports.spec.ts`)
- ✅ Viewing BAS quarterly reports
- ✅ Switching between quarters
- ✅ Viewing FY annual reports
- ✅ Switching between financial years
- ✅ GST calculations display (G1, 1A, 1B, Net)

### 5. PDF Downloads (`download.spec.ts`)
- ✅ Downloading BAS report PDFs
- ✅ Downloading FY report PDFs
- ✅ Error handling for failed downloads
- ✅ File validation

## Running Tests

### Prerequisites

1. **Backend must be running** with test data:
   ```bash
   # From project root
   docker compose up -d
   ```

2. **Frontend dev server** (or Playwright will start it automatically):
   ```bash
   pnpm --filter web dev
   ```

### Run All E2E Tests

```bash
# From project root
pnpm --filter web test:e2e
```

### Run Specific Test Suite

```bash
# Expense tests only
pnpm --filter web test:e2e expense.spec.ts

# Income tests only
pnpm --filter web test:e2e income.spec.ts

# Import tests only
pnpm --filter web test:e2e import.spec.ts

# Reports tests only
pnpm --filter web test:e2e reports.spec.ts

# PDF download tests only
pnpm --filter web test:e2e download.spec.ts
```

### Run Tests in UI Mode (Interactive)

```bash
pnpm --filter web test:e2e:ui
```

This opens Playwright's interactive UI where you can:
- Run tests with visual feedback
- Debug failed tests
- See trace recordings
- Inspect test steps

### Debug Mode

```bash
# Run tests in headed mode (see the browser)
pnpm exec playwright test --headed

# Run specific test with debug
pnpm exec playwright test expense.spec.ts --debug
```

## Test Data

### Fixtures

Test CSV files are located in `e2e/fixtures/`:
- `test-expenses.csv` - Sample expense data for import tests

### Database Requirements

Tests assume the following seed data exists:
- At least one Provider (domestic and international if possible)
- At least one Category
- At least one Client

## CI/CD Integration

The `playwright.config.ts` is configured for CI:
- Retries failed tests 2 times
- Uses single worker on CI
- Runs in headless mode
- Captures screenshots on failure
- Generates HTML report

Add to your CI pipeline:
```yaml
- name: Run E2E tests
  run: pnpm --filter web test:e2e
```

## Writing New Tests

Follow the existing patterns:
1. Use semantic queries (`getByRole`, `getByLabel`) for accessibility
2. Wait for network idle before assertions
3. Test both happy paths and error cases
4. Clean up test data if needed
5. Use descriptive test names

Example:
```typescript
test('should create a new expense', async ({ page }) => {
  await page.goto('/expenses');
  await page.getByRole('button', { name: 'Add expense' }).click();
  // ... rest of test
});
```

## Troubleshooting

### Tests failing due to timeouts
- Increase timeout in `playwright.config.ts`
- Check if backend is running
- Check if dev server is accessible at http://localhost:5173

### Download tests failing
- Ensure downloads directory is writable
- Check browser permissions

### Import tests failing
- Verify CSV fixture files exist in `e2e/fixtures/`
- Check file upload implementation

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
