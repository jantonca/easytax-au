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

  it('displays upcoming recurring expenses sorted by nextDueDate', () => {
    const upcomingRecurring: RecurringExpenseResponseDto[] = [
      {
        id: 'recurring-1',
        name: 'iinet Internet',
        amountCents: 8999,
        gstCents: 818,
        bizPercent: 100,
        currency: 'AUD',
        schedule: 'monthly',
        dayOfMonth: 15,
        startDate: '2025-07-01',
        endDate: null,
        isActive: true,
        lastGeneratedDate: null,
        nextDueDate: '2026-01-15',
        providerId: 'provider-1',
        providerName: 'iinet',
        categoryId: 'category-1',
        categoryName: 'Internet',
      },
      {
        id: 'recurring-2',
        name: 'GitHub Pro',
        amountCents: 9900,
        gstCents: 0,
        bizPercent: 100,
        currency: 'AUD',
        schedule: 'yearly',
        dayOfMonth: 1,
        startDate: '2025-07-01',
        endDate: null,
        isActive: true,
        lastGeneratedDate: null,
        nextDueDate: '2026-02-01',
        providerId: 'provider-2',
        providerName: 'GitHub',
        categoryId: 'category-2',
        categoryName: 'Software',
      },
    ];

    mockedUseDashboardData.mockReturnValue({
      bas: undefined,
      basLoading: false,
      basError: null,
      recentExpenses: [],
      recentExpensesLoading: false,
      recentExpensesError: null,
      dueRecurring: upcomingRecurring,
      dueRecurringLoading: false,
      dueRecurringError: null,
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('iinet Internet')).toBeInTheDocument();
    expect(screen.getByText('GitHub Pro')).toBeInTheDocument();
    expect(screen.getByText('Next due: 2026-01-15')).toBeInTheDocument();
    expect(screen.getByText('Next due: 2026-02-01')).toBeInTheDocument();
  });

  it('shows message when no recurring expenses are active', () => {
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

    expect(screen.getByText('No recurring expenses due soon.')).toBeInTheDocument();
  });
});
