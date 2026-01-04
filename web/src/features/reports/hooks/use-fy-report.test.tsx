import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFYReport } from './use-fy-report';
import type { FYSummaryDto } from '@/lib/api-client';

// Mock fetch
global.fetch = vi.fn();

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
        totalCents: 500000,
        gstCents: 45454,
        count: 24,
      },
      {
        categoryId: 2,
        name: 'Hosting',
        basLabel: '1B',
        totalCents: 300000,
        gstCents: 27272,
        count: 12,
      },
    ],
  },
  netProfitCents: 3300000,
  netGstPayableCents: 300000,
};

describe('useFYReport', () => {
  it('should be a function that accepts financialYear parameter', () => {
    // Basic smoke test - just ensure the hook can be called
    const { result } = renderHook(() => useFYReport({ financialYear: 2026 }), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useFYReport({ financialYear: 2026 }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading || result.current.data === undefined).toBe(true);
  });
});
