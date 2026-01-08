import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
});
