import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { BasReportPage } from './bas-report-page';
import { useBasReport } from './hooks/use-bas-report';
import type { BasSummaryDto } from '@/lib/api-client';
import * as apiClient from '@/lib/api-client';

vi.mock('./hooks/use-bas-report');
vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual('@/lib/api-client');
  return {
    ...actual,
    downloadBasReportPdf: vi.fn(),
  };
});

vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('@/lib/fy', () => ({
  getFYInfo: () => ({
    financialYear: 2026,
    quarter: 'Q2',
    fyLabel: 'FY2026',
    quarterLabel: 'Q2 FY2026',
  }),
}));

const mockedUseBasReport = vi.mocked(useBasReport);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

const mockSummary: BasSummaryDto = {
  quarter: 'Q2',
  financialYear: 2026,
  basis: 'ACCRUAL',
  periodStart: '2025-10-01',
  periodEnd: '2025-12-31',
  g1TotalSalesCents: 1100000,
  label1aGstCollectedCents: 100000,
  label1bGstPaidCents: 50000,
  netGstPayableCents: 50000,
  g10CapitalPurchasesCents: 0,
  g11NonCapitalPurchasesCents: 0,
  incomeCount: 10,
  expenseCount: 12,
  unreconciledPaidIncomeCount: 0,
  unreconciledPaidIncomeTotalCents: 0,
};

describe('BasReportPage accounting basis (M02)', () => {
  beforeEach(() => {
    mockedUseBasReport.mockReturnValue({
      data: mockSummary,
      isLoading: false,
      isError: false,
      error: undefined,
    } as ReturnType<typeof useBasReport>);
  });

  it('renders the accounting basis selector defaulting to accrual', async () => {
    const user = userEvent.setup();
    render(<BasReportPage />, { wrapper: createWrapper() });

    const selector = screen.getByLabelText('Accounting basis');
    expect(selector).toHaveValue('ACCRUAL');

    await user.selectOptions(selector, 'CASH');

    expect(mockedUseBasReport).toHaveBeenCalledWith(
      expect.objectContaining({ basis: 'CASH' }),
    );
  });

  it('shows the reconciliation banner for paid incomes without a receipt date', async () => {
    const user = userEvent.setup();
    mockedUseBasReport.mockReturnValue({
      data: {
        ...mockSummary,
        basis: 'CASH',
        unreconciledPaidIncomeCount: 2,
        unreconciledPaidIncomeTotalCents: 55000,
      },
      isLoading: false,
      isError: false,
      error: undefined,
    } as ReturnType<typeof useBasReport>);

    render(<BasReportPage />, { wrapper: createWrapper() });

    // Select the CASH basis: unreconciled paid incomes are excluded there
    await user.selectOptions(screen.getByLabelText('Accounting basis'), 'CASH');

    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('2 paid incomes have no recorded receipt date');
    expect(banner).toHaveTextContent('$550.00');
  });

  it('does not show the banner on accrual summaries', () => {
    render(<BasReportPage />, { wrapper: createWrapper() });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
