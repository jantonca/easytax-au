import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { FyReportPage } from './fy-report-page';
import { useFYReport } from './hooks/use-fy-report';
import type { FYSummaryDto } from '@/lib/api-client';
import * as apiClient from '@/lib/api-client';

vi.mock('./hooks/use-fy-report');
vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual('@/lib/api-client');
  return {
    ...actual,
    downloadFYReportPdf: vi.fn(),
  };
});

// Mock toast context
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock getFYInfo
vi.mock('@/lib/fy', () => ({
  getFYInfo: () => ({
    financialYear: 2026,
    quarter: 'Q2',
    fyLabel: 'FY2026',
    quarterLabel: 'Q2 FY2026',
  }),
}));

const mockedUseFYReport = vi.mocked(useFYReport);

const mockFYSummary: FYSummaryDto = {
  financialYear: 2026,
  fyLabel: 'FY2026',
  periodStart: '2025-07-01',
  periodEnd: '2026-06-30',
  income: {
    totalIncomeCents: 5500000,
    paidIncomeCents: 5000000,
    unpaidIncomeCents: 500000,
    gstCollectedCents: 500000,
    count: 45,
  },
  expenses: {
    totalExpensesCents: 2200000,
    gstPaidCents: 200000,
    count: 156,
    byCategory: [
      {
        categoryId: 1,
        name: 'Software',
        basLabel: '1B',
        totalCents: 1200000,
        gstCents: 109090,
        count: 80,
      },
      {
        categoryId: 2,
        name: 'Hosting',
        basLabel: '1B',
        totalCents: 800000,
        gstCents: 72727,
        count: 50,
      },
      {
        categoryId: 3,
        name: 'Hardware',
        basLabel: 'G10',
        totalCents: 200000,
        gstCents: 18183,
        count: 26,
      },
    ],
  },
  netProfitCents: 3300000,
  netGstPayableCents: 300000,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('FyReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header and description', () => {
    mockedUseFYReport.mockReturnValue({
      data: mockFYSummary,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    expect(screen.getByText('FY Reports')).toBeInTheDocument();
    expect(
      screen.getByText('View financial year summaries for tax return preparation and download PDF reports'),
    ).toBeInTheDocument();
  });

  it('renders year selector', () => {
    mockedUseFYReport.mockReturnValue({
      data: mockFYSummary,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText('Financial Year')).toBeInTheDocument();
  });

  it('displays loading state while fetching data', () => {
    mockedUseFYReport.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading FY report...')).toBeInTheDocument();
  });

  it('displays error state when API fails', () => {
    const error = new Error('Failed to load FY report');
    mockedUseFYReport.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    expect(screen.getAllByText('Failed to load FY report').length).toBeGreaterThan(0);
  });

  it('displays empty state when no data available', () => {
    mockedUseFYReport.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/No data available for FY2026/)).toBeInTheDocument();
    expect(screen.getByText(/Add expenses and incomes to generate a financial year report/)).toBeInTheDocument();
  });

  it('renders FY summary when data is loaded', () => {
    mockedUseFYReport.mockReturnValue({
      data: mockFYSummary,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Income Summary')).toBeInTheDocument();
    expect(screen.getByText('Expenses Summary')).toBeInTheDocument();
    expect(screen.getByText('Net Position')).toBeInTheDocument();
  });

  it('renders category breakdown table', () => {
    mockedUseFYReport.mockReturnValue({
      data: mockFYSummary,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Expense Breakdown by Category')).toBeInTheDocument();
    expect(screen.getAllByText('Software')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hosting')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hardware')).length).toBeGreaterThan(0);
  });

  it('renders BAS label breakdown section', () => {
    mockedUseFYReport.mockReturnValue({
      data: mockFYSummary,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Expense Breakdown by BAS Label')).toBeInTheDocument();
    expect(screen.getByText('BAS Label 1B')).toBeInTheDocument();
    expect(screen.getByText('BAS Label G10')).toBeInTheDocument();
  });

  it('has PDF download button', () => {
    mockedUseFYReport.mockReturnValue({
      data: mockFYSummary,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    const downloadButton = screen.getByRole('button', { name: /download fy report as pdf/i });
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).not.toBeDisabled();
  });

  it('disables PDF download button when loading', () => {
    mockedUseFYReport.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    const downloadButton = screen.getByRole('button', { name: /download fy report as pdf/i });
    expect(downloadButton).toBeDisabled();
  });

  it('disables PDF download button when no data', () => {
    mockedUseFYReport.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    const downloadButton = screen.getByRole('button', { name: /download fy report as pdf/i });
    expect(downloadButton).toBeDisabled();
  });

  it('calls downloadFYReportPdf when download button is clicked', async () => {
    const user = userEvent.setup();
    const mockDownload = vi.fn().mockResolvedValue(undefined);
    vi.mocked(apiClient.downloadFYReportPdf).mockImplementation(mockDownload);

    mockedUseFYReport.mockReturnValue({
      data: mockFYSummary,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    const downloadButton = screen.getByRole('button', { name: /download fy report as pdf/i });
    await user.click(downloadButton);

    expect(mockDownload).toHaveBeenCalledWith(2026);
  });

  it('shows correct section headings in order', () => {
    mockedUseFYReport.mockReturnValue({
      data: mockFYSummary,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useFYReport>);

    render(<FyReportPage />, { wrapper: createWrapper() });

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent('Expense Breakdown by Category');
    expect(headings[1]).toHaveTextContent('Expense Breakdown by BAS Label');
  });
});
