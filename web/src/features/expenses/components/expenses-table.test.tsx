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
});
