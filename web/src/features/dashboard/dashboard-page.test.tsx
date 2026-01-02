import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type {
  BasSummaryDto,
  ExpenseResponseDto,
  RecurringExpenseResponseDto,
} from '@/lib/api-client';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-data';
import type { DashboardData } from '@/features/dashboard/hooks/use-dashboard-data';

vi.mock('@/features/dashboard/hooks/use-dashboard-data');

const mockedUseDashboardData = vi.mocked(useDashboardData as () => DashboardData);

describe('DashboardPage', () => {
  it('renders GST summary cards with values from BAS summary', () => {
    const bas: BasSummaryDto = {
      quarter: 'Q1',
      financialYear: 2026,
      periodStart: '2025-07-01',
      periodEnd: '2025-09-30',
      g1TotalSalesCents: 1100000,
      label1aGstCollectedCents: 100000,
      label1bGstPaidCents: 50000,
      netGstPayableCents: 50000,
      incomeCount: 5,
      expenseCount: 12,
    };

    const recentExpenses: ExpenseResponseDto[] = [];
    const dueRecurring: RecurringExpenseResponseDto[] = [];

    mockedUseDashboardData.mockReturnValue({
      bas,
      basLoading: false,
      basError: null,
      recentExpenses,
      recentExpensesLoading: false,
      recentExpensesError: null,
      dueRecurring,
      dueRecurringLoading: false,
      dueRecurringError: null,
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('G1 – Total sales')).toBeInTheDocument();
    expect(screen.getByText('1A – GST collected')).toBeInTheDocument();
    expect(screen.getByText('1B – GST paid')).toBeInTheDocument();
    expect(screen.getByText('Net GST position')).toBeInTheDocument();
  });

  it('renders quick actions with links to expenses and incomes', () => {
    mockedUseDashboardData.mockReturnValue({
      bas: undefined,
      basLoading: false,
      basError: null,
      recentExpenses: [],
      recentExpensesLoading: false,
      recentExpensesError: null,
      dueRecurring: [],
      dueRecurringLoading: false,
      dueRecurringError: null,
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    const addExpenseLink = screen.getByRole('link', { name: /add expense/i });
    const addIncomeLink = screen.getByRole('link', { name: /add income/i });

    expect(addExpenseLink).toHaveAttribute('href', '/expenses');
    expect(addIncomeLink).toHaveAttribute('href', '/incomes');
  });
});
