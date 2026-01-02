import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryDto, ExpenseResponseDto, ProviderDto } from '@/lib/api-client';
import { ExpensesPage } from '@/features/expenses/expenses-page';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { useCategories } from '@/hooks/use-categories';
import { useProviders } from '@/hooks/use-providers';

vi.mock('@/features/expenses/hooks/use-expenses');
vi.mock('@/hooks/use-providers');
vi.mock('@/hooks/use-categories');

const mockedUseExpenses = vi.mocked(
  useExpenses as () => {
    data?: ExpenseResponseDto[];
    isLoading: boolean;
    isError: boolean;
  },
);

const mockedUseProviders = vi.mocked(
  useProviders as () => {
    data?: ProviderDto[];
  },
);

const mockedUseCategories = vi.mocked(
  useCategories as () => {
    data?: CategoryDto[];
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

    mockedUseProviders.mockReturnValue({
      data: [],
    });

    mockedUseCategories.mockReturnValue({
      data: [],
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

    mockedUseProviders.mockReturnValue({
      data: [],
    });

    mockedUseCategories.mockReturnValue({
      data: [],
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

    mockedUseProviders.mockReturnValue({
      data: [],
    });

    mockedUseCategories.mockReturnValue({
      data: [],
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

    mockedUseProviders.mockReturnValue({
      data: [],
    });

    mockedUseCategories.mockReturnValue({
      data: [],
    });

    render(<ExpensesPage />);

    expect(screen.getByText('No expenses recorded yet.')).toBeInTheDocument();
  });

  it('filters expenses by provider', async () => {
    const user = userEvent.setup();

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
        providerId: 'prov-a',
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
      {
        id: '2',
        date: '2025-08-16T00:00:00Z',
        description: undefined,
        amountCents: 22000,
        gstCents: 2000,
        bizPercent: 100,
        currency: 'AUD',
        fileRef: undefined,
        providerId: 'prov-b',
        categoryId: 'cat-1',
        importJobId: undefined,
        financialYear: 2026,
        quarter: 'Q1',
        fyLabel: 'FY2026',
        quarterLabel: 'Q1 FY2026',
        createdAt: '2025-08-16T10:30:00Z',
        updatedAt: '2025-08-16T10:30:00Z',
        provider: undefined,
        category: undefined,
      } as unknown as ExpenseResponseDto,
    ];

    mockedUseExpenses.mockReturnValue({
      data: expenses,
      isLoading: false,
      isError: false,
    });

    const providers: ProviderDto[] = [
      {
        id: 'prov-a',
        name: 'Provider A',
        isInternational: false,
        defaultCategoryId: null,
        abnArn: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'prov-b',
        name: 'Provider B',
        isInternational: false,
        defaultCategoryId: null,
        abnArn: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockedUseProviders.mockReturnValue({
      data: providers,
    });

    mockedUseCategories.mockReturnValue({
      data: [],
    });

    render(<ExpensesPage />);

    // Select Provider B in the filter
    await user.selectOptions(screen.getByLabelText('Provider'), 'prov-b');

    // Only the amount for provider B should remain visible in the table
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(1);
    expect(screen.getByText('$220.00')).toBeInTheDocument();
  });
});
