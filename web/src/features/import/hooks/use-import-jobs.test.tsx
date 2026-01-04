import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useImportJobs } from './use-import-jobs';

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

describe('useImportJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch import jobs successfully', async () => {
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

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockJobs,
    });

    const { result } = renderHook(() => useImportJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockJobs);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/import/jobs');
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch import jobs';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        message: errorMessage,
        statusCode: 500,
      }),
    });

    const { result } = renderHook(() => useImportJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toContain(errorMessage);
  });

  it('should handle network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useImportJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect((result.current.error as Error).message).toContain('Network error');
  });

  it('should handle empty job list', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useImportJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('should track loading state correctly', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => [],
              }),
            100,
          );
        }),
    );

    const { result } = renderHook(() => useImportJobs(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isLoading).toBe(false);
  });
});
