import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ExpenseResponseDto } from '@/lib/api-client';
import { ExpensesPage } from '@/features/expenses/expenses-page';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';

vi.mock('@/features/expenses/hooks/use-expenses');

const mockedUseExpenses = vi.mocked(
  useExpenses as () => {
    data?: ExpenseResponseDto[];
    isLoading: boolean;
    isError: boolean;
  },
);

describe('ExpensesPage', () => {
  it('renders expenses table rows when data is available', () => {
    const expenses: ExpenseResponseDto[] = [
      {
        id: '1',
        date: '2025-08-15T00:00:00Z',
        description: undefined,
        amountCents: 11000,
        gstCents: 1000,
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
      } as unknown as ExpenseResponseDto,
    ];

    mockedUseExpenses.mockReturnValue({
      data: expenses,
      isLoading: false,
      isError: false,
    });

    render(<ExpensesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Expenses' })).toBeInTheDocument();
    expect(screen.getByText('Sorted by date (newest first)')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('$110.00')).toBeInTheDocument();
  });

  it('shows loading state when expenses are loading', () => {
    mockedUseExpenses.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<ExpensesPage />);

    expect(screen.getByText('Loading expenses…')).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    mockedUseExpenses.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<ExpensesPage />);

    expect(
      screen.getByText("We couldn't load your expenses right now. Please try again shortly."),
    ).toBeInTheDocument();
  });

  it('shows empty state when there are no expenses', () => {
    mockedUseExpenses.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<ExpensesPage />);

    expect(screen.getByText('No expenses recorded yet.')).toBeInTheDocument();
  });
});
