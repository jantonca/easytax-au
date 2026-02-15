import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ExpenseResponseDto } from '@/lib/api-client';
import { ExpensesTable } from '@/features/expenses/components/expenses-table';

function createExpense(partial: Partial<ExpenseResponseDto>): ExpenseResponseDto {
  const base: ExpenseResponseDto = {
    id: '1',
    date: '2025-08-15T00:00:00Z',
    description: undefined,
    amountCents: 1000,
    gstCents: 100,
    bizPercent: 100,
    currency: 'AUD',
    fileRef: undefined,
    providerId: 'prov-1',
    categoryId: 'cat-1',
    importJobId: undefined,
    financialYear: 2026,
    quarter: 'Q1',
    fyLabel: 'FY2026',
    quarterLabel: 'Q1 FY2026',
    createdAt: '2025-08-15T10:30:00Z',
    updatedAt: '2025-08-15T10:30:00Z',
    provider: undefined,
    category: undefined,
  } as unknown as ExpenseResponseDto;

  return { ...base, ...partial } as ExpenseResponseDto;
}

describe('ExpensesTable', () => {
  it('sorts by date descending by default', () => {
    const expenses: ExpenseResponseDto[] = [
      createExpense({ id: 'older', date: '2025-01-01T00:00:00Z', amountCents: 5000 }),
      createExpense({ id: 'newer', date: '2025-12-31T00:00:00Z', amountCents: 10000 }),
    ];

    render(<ExpensesTable expenses={expenses} />);

    const rows = screen.getAllByRole('row').slice(1); // skip header
    const firstRow = rows[0];

    expect(within(firstRow).getByText('2025-12-31')).toBeInTheDocument();
  });

  it('allows sorting by amount via header click', async () => {
    const user = userEvent.setup();

    const expenses: ExpenseResponseDto[] = [
      createExpense({ id: 'low', date: '2025-08-15T00:00:00Z', amountCents: 5000 }),
      createExpense({ id: 'high', date: '2025-08-16T00:00:00Z', amountCents: 15000 }),
    ];

    render(<ExpensesTable expenses={expenses} />);

    // Default is date-desc so the newer date (high amount) is first
    let rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('$150.00')).toBeInTheDocument();

    const amountHeaderButton = screen.getByRole('button', { name: /amount/i });
    await user.click(amountHeaderButton); // amount asc

    rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('$50.00')).toBeInTheDocument();
  });

  describe('Pagination', () => {
    it('shows pagination controls when expenses exceed 25', () => {
      const expenses: ExpenseResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByText(/showing 1-25 of 30/i)).toBeInTheDocument();
    });

    it('hides pagination controls when expenses are 25 or fewer', () => {
      const expenses: ExpenseResponseDto[] = Array.from({ length: 25 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      expect(screen.queryByRole('button', { name: /previous page/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
    });

    it('navigates to next page when Next button is clicked', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(screen.getByText(/showing 26-30 of 30/i)).toBeInTheDocument();
    });

    it('navigates to previous page when Previous button is clicked', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(prevButton);

      expect(screen.getByText(/showing 1-25 of 30/i)).toBeInTheDocument();
    });

    it('disables Previous button on first page', () => {
      const expenses: ExpenseResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();
    });

    it('disables Next button on last page', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(nextButton).toBeDisabled();
    });

    it('shows correct page indicator for multiple pages', () => {
      const expenses: ExpenseResponseDto[] = Array.from({ length: 100 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-01-01T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      expect(screen.getByText(/page 1 of 4/i)).toBeInTheDocument();
    });

    it('displays only current page rows (25 per page)', () => {
      const expenses: ExpenseResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      const rows = screen.getAllByRole('row').slice(1); // skip header
      expect(rows).toHaveLength(25);
    });

    it('handles zero amount expenses correctly in pagination', () => {
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: '1', amountCents: 0 }),
        ...Array.from({ length: 29 }, (_, i) =>
          createExpense({ id: `expense-${i + 2}`, amountCents: (i + 1) * 1000 }),
        ),
      ];

      render(<ExpensesTable expenses={expenses} />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText(/showing 1-25 of 30/i)).toBeInTheDocument();
    });

    it('preserves sorting when navigating between pages', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      // Sort by amount ascending
      const amountHeaderButton = screen.getByRole('button', { name: /amount/i });
      await user.click(amountHeaderButton);

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Verify page 2 still shows sorted data (amounts 26-30)
      const rows = screen.getAllByRole('row').slice(1);
      expect(within(rows[0]).getByText(/\$260\.00/)).toBeInTheDocument();
    });

    it('has proper ARIA labels on pagination controls', () => {
      const expenses: ExpenseResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createExpense({ id: `expense-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, amountCents: (i + 1) * 1000 }),
      );

      render(<ExpensesTable expenses={expenses} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /next page/i })).toHaveAttribute('aria-label');
    });
  });

  describe('Bulk Operations', () => {
    it('shows selection checkboxes when onBulkDelete is provided', () => {
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('does not show selection checkboxes when onBulkDelete is not provided', () => {
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
      ];

      render(<ExpensesTable expenses={expenses} />);

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('selects individual row when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      await user.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('selects all rows when "Select All" is clicked', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
        createExpense({ id: 'exp-3', description: 'Test Expense 3' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      await user.click(selectAllButton);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('deselects all rows when "Select None" is clicked', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      await user.click(selectAllButton);

      const selectNoneButton = screen.getByRole('button', { name: /select none/i });
      await user.click(selectNoneButton);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('inverts selection when "Invert" is clicked', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
        createExpense({ id: 'exp-3', description: 'Test Expense 3' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      const invertButton = screen.getByRole('button', { name: /invert/i });
      await user.click(invertButton);

      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).toBeChecked();
    });

    it('shows selected count in toolbar', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
        createExpense({ id: 'exp-3', description: 'Test Expense 3' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it('calls onBulkDelete with selected IDs when delete button is clicked', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
        createExpense({ id: 'exp-3', description: 'Test Expense 3' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      await user.click(checkboxes[0]);
      await user.click(checkboxes[2]);

      const deleteButton = screen.getByRole('button', { name: /delete selected/i });
      await user.click(deleteButton);

      expect(onBulkDelete).toHaveBeenCalledWith(['exp-1', 'exp-3']);
    });

    it('calls onBulkExport with selected expenses when export button is clicked', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1', amountCents: 5000 }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2', amountCents: 10000 }),
      ];

      const onBulkExport = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkExport={onBulkExport} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      await user.click(checkboxes[0]);

      const exportButton = screen.getByRole('button', { name: /export selected/i });
      await user.click(exportButton);

      expect(onBulkExport).toHaveBeenCalledWith([expenses[0]]);
    });

    it('calls onBulkCategoryChange with selected IDs and new category when category change is triggered', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
      ];

      const onBulkCategoryChange = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkCategoryChange={onBulkCategoryChange} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      const categoryButton = screen.getByRole('button', { name: /change category/i });
      await user.click(categoryButton);

      expect(onBulkCategoryChange).toHaveBeenCalledWith(['exp-1', 'exp-2']);
    });

    it('hides bulk action buttons when no rows are selected', () => {
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
      ];

      const onBulkDelete = vi.fn();
      const onBulkExport = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} onBulkExport={onBulkExport} />);

      const deleteButton = screen.queryByRole('button', { name: /delete selected/i });
      const exportButton = screen.queryByRole('button', { name: /export selected/i });

      expect(deleteButton).not.toBeInTheDocument();
      expect(exportButton).not.toBeInTheDocument();
    });

    it('shows bulk action toolbar only when rows are selected', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      await user.click(checkboxes[0]);

      expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
    });

    it('supports shift-click for range selection', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
        createExpense({ id: 'exp-3', description: 'Test Expense 3' }),
        createExpense({ id: 'exp-4', description: 'Test Expense 4' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      await user.click(checkboxes[0]);
      await user.keyboard('{Shift>}');
      await user.click(checkboxes[2]);
      await user.keyboard('{/Shift}');

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[2]).toBeChecked();
      expect(checkboxes[3]).not.toBeChecked();
    });

    it('clears selection after bulk delete', async () => {
      const user = userEvent.setup();
      const expenses: ExpenseResponseDto[] = [
        createExpense({ id: 'exp-1', description: 'Test Expense 1' }),
        createExpense({ id: 'exp-2', description: 'Test Expense 2' }),
      ];

      const onBulkDelete = vi.fn();
      render(<ExpensesTable expenses={expenses} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select expense/i });
      await user.click(checkboxes[0]);

      const deleteButton = screen.getByRole('button', { name: /delete selected/i });
      await user.click(deleteButton);

      expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
    });
  });
});
