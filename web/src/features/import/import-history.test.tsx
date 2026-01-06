import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ImportHistory } from './import-history';

// Mock the hook
vi.mock('./hooks/use-import-jobs', () => ({
  useImportJobs: vi.fn(),
}));

import { useImportJobs } from './hooks/use-import-jobs';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('ImportHistory', () => {
  it('renders loading state', () => {
    vi.mocked(useImportJobs).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useImportJobs>);

    render(<ImportHistory />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useImportJobs).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load import history'),
    } as ReturnType<typeof useImportJobs>);

    render(<ImportHistory />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load import history/i)).toBeInTheDocument();
  });

  it('renders empty state when no jobs', () => {
    vi.mocked(useImportJobs).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useImportJobs>);

    render(<ImportHistory />, { wrapper: createWrapper() });

    expect(screen.getByText(/no import history/i)).toBeInTheDocument();
    expect(screen.getByText(/start importing/i)).toBeInTheDocument();
  });

  it('renders import jobs table', () => {
    const mockJobs = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2025-01-04T10:30:00Z',
        source: 'commbank',
        totalRows: 10,
        successCount: 8,
        failedCount: 1,
        duplicateCount: 1,
        totalAmountCents: 125000,
        totalGstCents: 11363,
        processingTimeMs: 150,
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        createdAt: '2025-01-03T15:20:00Z',
        source: 'manual',
        totalRows: 5,
        successCount: 5,
        failedCount: 0,
        duplicateCount: 0,
        totalAmountCents: 50000,
        totalGstCents: 4545,
        processingTimeMs: 100,
      },
    ];

    vi.mocked(useImportJobs).mockReturnValue({
      data: mockJobs,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useImportJobs>);

    render(<ImportHistory />, { wrapper: createWrapper() });

    // Check table headers
    expect(screen.getByText(/date/i)).toBeInTheDocument();
    expect(screen.getByText(/source/i)).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();
    expect(screen.getByText(/success/i)).toBeInTheDocument();
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
    expect(screen.getByText(/amount/i)).toBeInTheDocument();

    // Check job data
    expect(screen.getByText(/commbank/i)).toBeInTheDocument();
    expect(screen.getByText(/manual/i)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // totalRows
    expect(screen.getByText('8')).toBeInTheDocument(); // successCount

    // Check for "5" which appears twice (totalRows and successCount for second job)
    const fives = screen.getAllByText('5');
    expect(fives.length).toBeGreaterThanOrEqual(1);
  });

  it('formats dates correctly', () => {
    const mockJobs = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2025-01-04T10:30:00Z',
        source: 'commbank',
        totalRows: 10,
        successCount: 8,
        failedCount: 1,
        duplicateCount: 1,
        totalAmountCents: 125000,
        totalGstCents: 11363,
        processingTimeMs: 150,
      },
    ];

    vi.mocked(useImportJobs).mockReturnValue({
      data: mockJobs,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useImportJobs>);

    render(<ImportHistory />, { wrapper: createWrapper() });

    // Date should be formatted (checking for parts of the date)
    expect(screen.getByText(/jan/i)).toBeInTheDocument();
    expect(screen.getByText(/2025/i)).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    const mockJobs = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2025-01-04T10:30:00Z',
        source: 'commbank',
        totalRows: 10,
        successCount: 8,
        failedCount: 1,
        duplicateCount: 1,
        totalAmountCents: 125000,
        totalGstCents: 11363,
        processingTimeMs: 150,
      },
    ];

    vi.mocked(useImportJobs).mockReturnValue({
      data: mockJobs,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useImportJobs>);

    render(<ImportHistory />, { wrapper: createWrapper() });

    expect(screen.getByText(/\$1,250\.00/)).toBeInTheDocument();
  });

  it('displays failed count with warning when failures exist', () => {
    const mockJobs = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2025-01-04T10:30:00Z',
        source: 'commbank',
        totalRows: 10,
        successCount: 8,
        failedCount: 2,
        duplicateCount: 0,
        totalAmountCents: 125000,
        totalGstCents: 11363,
        processingTimeMs: 150,
      },
    ];

    vi.mocked(useImportJobs).mockReturnValue({
      data: mockJobs,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useImportJobs>);

    const { container } = render(<ImportHistory />, { wrapper: createWrapper() });

    expect(screen.getByText('2')).toBeInTheDocument();
    // Check for red styling on failed count (uses dark: prefix)
    const failedCell = container.querySelector('.dark\\:text-red-400');
    expect(failedCell).toBeInTheDocument();
  });

  it('sorts jobs by date descending (newest first)', () => {
    const mockJobs = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2025-01-04T10:30:00Z',
        source: 'commbank',
        totalRows: 10,
        successCount: 8,
        failedCount: 1,
        duplicateCount: 1,
        totalAmountCents: 125000,
        totalGstCents: 11363,
        processingTimeMs: 150,
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        createdAt: '2025-01-03T15:20:00Z',
        source: 'manual',
        totalRows: 5,
        successCount: 5,
        failedCount: 0,
        duplicateCount: 0,
        totalAmountCents: 50000,
        totalGstCents: 4545,
        processingTimeMs: 100,
      },
    ];

    vi.mocked(useImportJobs).mockReturnValue({
      data: mockJobs,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useImportJobs>);

    const { container } = render(<ImportHistory />, { wrapper: createWrapper() });

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);

    // First row should have Jan 4 (newer date)
    expect(rows[0].textContent).toContain('Jan');
    expect(rows[0].textContent).toContain('4');
  });
});
